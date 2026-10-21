from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class Memory(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    key: str = Field(unique=True)
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
