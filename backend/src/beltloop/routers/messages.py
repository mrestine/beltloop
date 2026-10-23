from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import select

from ..db import AsyncSession, get_session
from ..models import Message, Session
from ..services.chat import handle_chat_turn

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

    return StreamingResponse(
        handle_chat_turn(db, payload, session, True),
        media_type="application/x-ndjson",
    )
