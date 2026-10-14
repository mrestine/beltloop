import json

from sqlmodel import select

from ..integrations.ollama import MAX_CONTEXT, chat_sync, stream_chat_completion
from ..models import Message
from .context import read_all_files


async def handle_chat_turn(db, payload):
    usage = await get_token_usage(db, payload.session_id)
    if usage > MAX_CONTEXT:
        async for line in compact_chat_messages(db, payload.session_id, payload.model, usage):
            yield line

    message = Message(**payload.model_dump(exclude={"model"}), role="user")
    db.add(message)
    await db.commit()
    await db.refresh(message)

    statement = (
        select(Message)
        .where(Message.session_id == payload.session_id, Message.is_compacted == False)
        .order_by(Message.created_at)
    )
    messages = (await db.exec(statement)).all()
    history = [{"role": m.role, "content": m.content} for m in messages]

    async for line in stream_and_persist_reply(
        db, payload.session_id, history, payload.model, message.id
    ):
        yield line


async def stream_and_persist_reply(
    db, session_id: int, history: list[dict], model: str, user_message_id: str
):
    yield json.dumps({"user_message_id": user_message_id}) + "\n"
    context_files = read_all_files()
    context_content = "\n\n".join(content for content in context_files.values() if content.strip())
    history_with_context = history
    if context_content:
        history_with_context = [{"role": "system", "content": context_content}, *history]

    full_reply = ""
    total_tokens = None

    for line in stream_chat_completion(history_with_context, model):
        event = json.loads(line)
        if "data" in event:
            full_reply += event["data"]
        elif "error" in event:
            full_reply += f"\n\n[error: {event['error']}]"
        elif event.get("done"):
            total_tokens = event["prompt_eval_count"] + event["eval_count"]
        yield line

    assistant_message = Message(
        session_id=session_id, role="assistant", tokens=total_tokens, content=full_reply
    )
    db.add(assistant_message)
    await db.commit()
    await db.refresh(assistant_message)
    yield json.dumps({"assistant_message_id": assistant_message.id}) + "\n"


async def get_token_usage(db, session_id: int):
    last_with_tokens = (
        await db.exec(
            select(Message)
            .where(Message.session_id == session_id, Message.tokens.is_not(None))
            .order_by(Message.created_at.desc())
            .limit(1)
        )
    ).first()
    return last_with_tokens.tokens if last_with_tokens else 0


async def compact_chat_messages(db, session_id: int, model: str, usage: int):
    yield json.dumps({"compacting": {"in_progress": True}}) + "\n"
    statement = (
        select(Message)
        .where(Message.session_id == session_id, Message.is_compacted == False)
        .order_by(Message.created_at)
    )

    history_messages = (await db.exec(statement)).all()
    formatted_history = "\n".join(f"{m.role}: {m.content}" for m in history_messages)

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
    response = chat_sync(history=[compact_prompt], model=model)

    compacted_message = Message(
        session_id=session_id,
        role="system",
        content=response.message.content,
        display_content=f"Compaction complete. Tokens saved: {usage - response.eval_count}",
        tokens=response.eval_count,
    )
    db.add(compacted_message)
    for message in history_messages:
        message.is_compacted = True

    await db.commit()
    await db.refresh(compacted_message)
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
