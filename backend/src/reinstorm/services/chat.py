import json

from sqlmodel import select

from ..integrations.ollama import MAX_CONTEXT, chat_sync, stream_chat_completion
from ..models import Message
from .context import read_all_files


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


async def compact_if_needed(db, session_id: int, model: str):
    last_with_tokens = (
        await db.exec(
            select(Message)
            .where(Message.session_id == session_id, Message.tokens.is_not(None))
            .order_by(Message.created_at.desc())
            .limit(1)
        )
    ).first()

    if last_with_tokens and last_with_tokens.tokens > MAX_CONTEXT:
        await compact_chat_messages(db, session_id, model)


async def compact_chat_messages(db, session_id: int, model: str):
    statement = (
        select(Message)
        .where(Message.session_id == session_id, Message.is_compacted == False)
        .order_by(Message.created_at)
    )

    compact_prompt = {
        "role": "system",
        "content": "You are running out of context space. Summarize the following messages into a single message to free up space.",
    }
    history_messages = (await db.exec(statement)).all()
    history = [{"role": m.role, "content": m.content} for m in history_messages]
    history_with_prompt = [compact_prompt, *history]
    response = chat_sync(history=history_with_prompt, model=model)

    compacted_message = Message(
        session_id=session_id,
        role="system",
        content=response.message.content,
        tokens=response.eval_count,
    )
    db.add(compacted_message)
    for message in history_messages:
        message.is_compacted = True

    await db.commit()
    await db.refresh(compacted_message)
