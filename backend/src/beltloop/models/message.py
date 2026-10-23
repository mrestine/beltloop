from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Role(StrEnum):
    system = "system"
    user = "user"
    assistant = "assistant"
    tool = "tool"


class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="session.id", ondelete="CASCADE")
    role: Role
    content: str | dict = Field(default="", sa_column=Column(JSON))
    display_content: str | None = None
    is_compacted: bool = False
    tokens: int | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
