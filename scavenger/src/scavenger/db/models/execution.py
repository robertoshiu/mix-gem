"""Execution run and event logging models."""
from datetime import datetime
from enum import Enum
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from scavenger.db.base import Base


class RunStatus(str, Enum):
    """Execution run status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ExecutionRun(Base):
    """Tracks a scenario execution run."""

    __tablename__ = "execution_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario_id: Mapped[int] = mapped_column(ForeignKey("scenarios.id"))

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[RunStatus] = mapped_column(String(20), nullable=False)

    events: Mapped[list["ExecutionEvent"]] = relationship(back_populates="run")

    __table_args__ = (
        Index("idx_runs_scenario", "scenario_id"),
        Index("idx_runs_status", "status"),
    )


class ExecutionEvent(Base):
    """Individual HSMS message or event log entry."""

    __tablename__ = "execution_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey("execution_runs.id"))

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    direction: Mapped[str | None] = mapped_column(String(10))

    raw_sml: Mapped[str | None] = mapped_column(Text)
    parsed_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    matched_alarm_id: Mapped[int | None] = mapped_column(ForeignKey("alarms.id"))
    matched_recipe_id: Mapped[int | None] = mapped_column(ForeignKey("recipes.id"))

    run: Mapped["ExecutionRun"] = relationship(back_populates="events")

    __table_args__ = (
        Index("idx_events_run", "run_id"),
        Index("idx_events_timestamp", "timestamp"),
    )
