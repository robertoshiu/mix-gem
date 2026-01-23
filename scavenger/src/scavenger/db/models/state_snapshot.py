"""State snapshots for deterministic replay."""
import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base


class SnapshotType(str, Enum):
    """Type of state snapshot."""

    PERIODIC = "periodic"
    CHECKPOINT = "checkpoint"
    SCENARIO_STEP = "scenario_step"


class StateSnapshot(Base):
    """Equipment state snapshot for replay."""

    __tablename__ = "state_snapshots"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hsms_sessions.id"), nullable=False
    )
    after_message_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("secs_messages.id")
    )
    snapshot_type: Mapped[SnapshotType | None] = mapped_column(String(20))
    equipment_state: Mapped[dict | None] = mapped_column(JSONB)
    pending_transactions: Mapped[dict | None] = mapped_column(JSONB)
    scenario_context: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
