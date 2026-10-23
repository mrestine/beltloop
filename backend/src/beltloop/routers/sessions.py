from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from ..db import AsyncSession, get_session
from ..integrations.ollama import DEFAULT_MODEL
from ..models import Session

router = APIRouter(prefix="/sessions")


class SessionUpsert(BaseModel):
    title: str
    model: str | None = None


@router.get("/")
async def get_sessions(db: AsyncSession = Depends(get_session)):
    statement = select(Session).order_by(Session.created_at)
    sessions = (await db.exec(statement)).all()
    return sessions


@router.put("/{id}")
async def update_session(id: int, payload: SessionUpsert, db: AsyncSession = Depends(get_session)):
    session = await db.get(Session, id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, key, value)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/")
async def create_session(payload: SessionUpsert, db: AsyncSession = Depends(get_session)):
    session = Session(title=payload.title, model=payload.model or DEFAULT_MODEL)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.delete("/{id}", status_code=204)
async def delete_session(id: int, db: AsyncSession = Depends(get_session)):
    session = await db.get(Session, id)
    if session is None:
        raise HTTPException(status_code=404, detail="session not found")
    await db.delete(session)
    await db.commit()
