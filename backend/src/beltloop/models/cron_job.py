from datetime import UTC, datetime
from enum import StrEnum

from sqlmodel import Field, SQLModel


class Status(StrEnum):
    complete = "complete"
    error = "error"
    timeout = "timeout"
    running = "running"


class CronJobRun(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    cron_job_id: int = Field(foreign_key="cronjob.id", ondelete="CASCADE")
    started_at: datetime
    status: Status
    finished_at: datetime | None
    output: str | None


class CronJob(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    enabled: bool = Field(default=False)
    cron: str
    target_session_id: int | None = Field(
        default=None, foreign_key="session.id", ondelete="SET NULL"
    )
    prompt: str
    model: str | None  # none for default model
    timeout: int | None  # seconds. none for default timeout, 120s
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
