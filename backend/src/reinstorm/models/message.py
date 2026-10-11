from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from enum import StrEnum

class Role(StrEnum):
    system = "system"
    user = "user"
    assistant = "assistant"

class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="session.id")
    role: Role
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))