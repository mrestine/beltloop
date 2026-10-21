from datetime import UTC, datetime

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class ToolConfig(SQLModel, table=True):
    id: int | None = Field(primary_key=True)
    enabled: bool
    name: str = Field(unique=True)
    config: dict = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
