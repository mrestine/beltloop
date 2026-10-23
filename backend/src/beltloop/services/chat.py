import asyncio
import json

from sqlmodel import select

from ..integrations.ollama import DEFAULT_MODEL, MAX_CONTEXT, get_ollama_response
from ..integrations.tools import execute_tool, get_tool_schemas
from ..models import Memory, Message, ToolConfig
from .context import read_all_files


async def handle_chat_turn(db, payload, session, stream_response):
    model = session.model
    if session.model != payload.model:
        session.model = model = payload.model or DEFAULT_MODEL

    usage = await __get_token_usage(db, session.id)
    if usage > MAX_CONTEXT:
        async for line in __compact_chat_messages(db, session.id, model, usage):
            yield line

    message = await __save_message(db=db, **payload.model_dump(exclude={"model"}), role="user")
    yield json.dumps({"user_message_id": message.id}) + "\n"

    history_with_context, tools = await __gather_context(db, session_id=session.id)

    async for line in __tool_loop_iteration(
        db,
        session_id=session.id,
        history_with_context=history_with_context,
        model=model,
        tools=tools,
        stream_response=stream_response,
        iterations_left=5,
    ):
        yield line


# puts together everything that gets prepended to the user's message
# - context files
# - memory keys (if memory tool enabled)
# - chat history (non-compacted messages only)
# - available tools
async def __gather_context(db, session_id: int):
    # history
    statement = (
        select(Message)
        .where(Message.session_id == session_id, Message.is_compacted == False)
        .order_by(Message.created_at)
    )
    messages = (await db.exec(statement)).all()
    history = [{"role": m.role, "content": __stringify_content(m.content)} for m in messages]

    # tools
    tool_schemas = get_tool_schemas()
    configStatement = select(ToolConfig).where(ToolConfig.enabled == True)
    enabled_tool_configs = (await db.exec(configStatement)).all()
    enabled_tool_names = {tc.name for tc in enabled_tool_configs}
    tools = [s for s in tool_schemas if s["function"]["name"] in enabled_tool_names]
    use_memory = "memory" in enabled_tool_names

    # context files (persona.md, user.md)
    context_files = read_all_files()
    context_content = "\n\n".join(content for content in context_files.values() if content.strip())
    history_with_context = history

    if use_memory:
        memories = (await db.exec(select(Memory))).all()
        memory_message = {
            "role": "system",
            "content": f"memory keys: {', '.join(m.key for m in memories)}",
        }
        history_with_context = [memory_message, *history_with_context]
    if context_content:
        history_with_context = [
            {"role": "system", "content": context_content},
            *history_with_context,
        ]

    return history_with_context, tools


# one round of one turn - if a tool is called there will be:
# 1. one iteration for the initial assistant message
# 2. one iteration for the tool response(s)
# 3. repeats of the above if the model calls tools in sequence
# 4. the final assistant message
# if the model calls tools in parallel, those results are all in (3)
async def __tool_loop_iteration(
    db, session_id, history_with_context, model, tools, stream_response, iterations_left
):
    if iterations_left == 0:
        yield json.dumps({"error": "maximum tool calls exceeded"}) + "\n"
        return

    assistant_reply = ""
    total_tokens = None
    tool_results = []

    # the streamed response from ollama.py. includes the tool responses
    async for event in get_ollama_response(history_with_context, model, stream_response, tools):
        # normal message text
        if "data" in event:
            assistant_reply += event["data"]
            yield json.dumps(event) + "\n"

        # an announcement that tool calls are happening
        elif "tool_calls" in event:
            tool_names = ", ".join(tc["name"] for tc in event["tool_calls"])
            is_plural = len(event["tool_calls"]) > 1
            message_content = (
                assistant_reply or f"Using tool{'s' if is_plural else ''} {tool_names}..."
            )
            assistant_message = await __save_message(
                db=db,
                session_id=session_id,
                role="assistant",
                content=message_content,
            )
            yield (
                json.dumps(
                    {
                        "assistant_message_id": assistant_message.id,
                        **({"data": message_content} if not assistant_reply else {}),
                    }
                )
                + "\n"
            )
            for tc in event["tool_calls"]:
                yield (
                    json.dumps(
                        {
                            "tool_call": {
                                "name": tc["name"],
                                "arguments": tc["arguments"],
                            }
                        }
                    )
                ) + "\n"
            async for tool_result in __execute_tools(tool_calls=event["tool_calls"], db=db):
                tool_message = await __save_message(
                    db=db,
                    session_id=session_id,
                    role="tool",
                    content={
                        "name": tool_result["name"],
                        "arguments": tool_result["arguments"],
                        "result": tool_result["result"],
                    },
                )
                tool_results.append(tool_message)
                yield (
                    json.dumps(
                        {
                            "tool_result": {
                                "name": tool_result["name"],
                                "result": tool_result["result"],
                            }
                        }
                    )
                    + "\n"
                )

        # an error occurred
        elif "error" in event:
            assistant_reply += f"\n\n[error: {event['error']}]"
            yield json.dumps(event) + "\n"

        # message is over
        elif event.get("done"):
            total_tokens = event["prompt_eval_count"] + event["eval_count"]

    if tool_results:
        next_history = [
            *history_with_context,
            __message_entity_to_chat_item(assistant_message),
            *(__message_entity_to_chat_item(tool_message) for tool_message in tool_results),
        ]
        async for line in __tool_loop_iteration(
            db, session_id, next_history, model, tools, iterations_left - 1
        ):
            yield line
        return

    # no too call, final answer
    assistant_message = await __save_message(
        db=db, session_id=session_id, role="assistant", tokens=total_tokens, content=assistant_reply
    )
    yield (
        json.dumps(
            {
                "assistant_message_id": assistant_message.id,
                "tokens": total_tokens,
                "done": True,
            }
        )
        + "\n"
    )


# runs tool calls in parallel, yields on each one's completion
async def __execute_tools(tool_calls, db):
    tasks = [asyncio.create_task(__run_tool(tc, db)) for tc in tool_calls]
    for task in asyncio.as_completed(tasks):
        tool_call, result = await task
        yield {
            "name": tool_call["name"],
            "arguments": tool_call["arguments"],
            "result": result,
        }


async def __run_tool(tc, db):
    result = await execute_tool(name=tc["name"], arguments=tc["arguments"], db=db)
    return tc, result


async def __get_token_usage(db, session_id: int):
    last_with_tokens = (
        await db.exec(
            select(Message)
            .where(Message.session_id == session_id, Message.tokens.is_not(None))
            .order_by(Message.created_at.desc())
            .limit(1)
        )
    ).first()
    return last_with_tokens.tokens if last_with_tokens else 0


async def __compact_chat_messages(db, session_id: int, model: str, usage: int):
    yield json.dumps({"compacting": {"in_progress": True}}) + "\n"
    statement = (
        select(Message)
        .where(Message.session_id == session_id, Message.is_compacted == False)
        .order_by(Message.created_at)
    )

    history_messages = (await db.exec(statement)).all()
    formatted_history = "\n".join(
        f"{m.role}: {__stringify_content(m.content)}" for m in history_messages
    )

    # this has to be role: user so the model better understands a reply is needed
    # without role: user and a simple history array, the compaction response is empty.
    compact_prompt = {
        "role": "user",
        "content": (
            "Summarize the conversation below into a single, concise paragraph of plain prose. "
            "Preserve important facts, names, decisions, and any unresolved questions the user raised. "
            "Write it as neutral background notes for continuing this conversation later - "
            "not as a message to the user, with no commentary about the summarization itself."
            "Be as brief as possible while keeping anything that matters for future replies.\n\n"
            f"Transcript:\n{formatted_history}"
        ),
    }
    response = get_ollama_response(history=[compact_prompt], model=model, stream=False, tools=None)

    compacted_message = await __save_message(
        db=db,
        session_id=session_id,
        role="system",
        content=response.message.content,
        display_content=f"Compaction complete. Tokens saved: {usage - response.eval_count}",
        tokens=response.eval_count,
    )

    for message in history_messages:
        message.is_compacted = True
    await db.commit()

    yield (
        json.dumps(
            {
                "compacting": {
                    "in_progress": False,
                    "message": compacted_message.model_dump(mode="json"),
                }
            }
        )
        + "\n"
    )


async def __save_message(
    db, session_id: int, role: str, content="", display_content="", tokens=None
):
    message = Message(
        session_id=session_id,
        role=role,
        content=content,
        display_content=display_content,
        tokens=tokens,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


# this is for sending things to ollama without sending the whole ORM object
# content must be stringified
def __message_entity_to_chat_item(message: Message):
    return {"role": message.role, "content": __stringify_content(message.content)}


def __stringify_content(content: str | dict):
    return content if isinstance(content, str) else json.dumps(content)
