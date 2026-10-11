from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
from ..services.chat import stream_and_persist_reply
from ..integrations.ollama import DEFAULT_MODEL
from ..db import AsyncSession, get_session
from ..models import Message, Session

router = APIRouter()

class MessageCreate(BaseModel):
    session_id: int
    content: str
    model: str

@router.get("/messages-for-session/{session_id}")
async def get_messages_for_session(session_id: int, db: AsyncSession = Depends(get_session)):
    statement = select(Message).where(Message.session_id == session_id).order_by(Message.created_at)
    messages = (await db.exec(statement)).all()
    return messages

@router.post("/chat")
async def chat(payload: MessageCreate, db: AsyncSession = Depends(get_session)):
    session = await db.get(Session, payload.session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")

    if session.model != payload.model:
        setattr(session, "model", payload.model or DEFAULT_MODEL)

    message = Message(**payload.model_dump(exclude={"model"}), role="user")
    db.add(message)
    await db.commit()
    await db.refresh(message)

    statement = select(Message).where(Message.session_id == payload.session_id).order_by(Message.created_at)
    messages = (await db.exec(statement)).all()

    history = [{"role": m.role, "content": m.content} for m in messages]
    return StreamingResponse(
        stream_and_persist_reply(db, payload.session_id, history, payload.model, message.id),
        media_type="application/x-ndjson"
    )
