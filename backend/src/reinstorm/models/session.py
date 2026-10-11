from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class Session(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    model: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
