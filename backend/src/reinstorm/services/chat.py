import json
from ..integrations.ollama import stream_chat_completion
from ..models import Message

async def stream_and_persist_reply(
    db, 
    session_id: int, 
    history: list[dict], 
    model: str,
    user_message_id: str
):
    yield json.dumps({"user_message_id": user_message_id}) + '\n'

    full_reply = ""
    for line in stream_chat_completion(history, model):
        event = json.loads(line)
        if "data" in event:
            full_reply += event["data"]
        elif "error" in event:
            full_reply += f"\n\n[error: {event['error']}]"
        yield line

    assistant_message = Message(session_id=session_id, role="assistant", content=full_reply)
    db.add(assistant_message)
    await db.commit()
    await db.refresh(assistant_message)
    yield json.dumps({"assistant_message_id": assistant_message.id}) + '\n'
