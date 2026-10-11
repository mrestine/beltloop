from sqlmodel import SQLModel, Field
from datetime import datetime, timezone

class Session(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    model: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
