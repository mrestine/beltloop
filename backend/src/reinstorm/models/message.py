from datetime import UTC, datetime
from enum import StrEnum

from sqlmodel import Field, SQLModel


class Role(StrEnum):
    system = "system"
    user = "user"
    assistant = "assistant"


class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="session.id")
    role: Role
    content: str
    display_content: str | None = None
    is_compacted: bool = False
    tokens: int | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
