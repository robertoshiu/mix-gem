"""SECS-II message storage for recording and replay."""
import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base


class Direction(str, Enum):
    """Message direction."""

    H2E = "H2E"  # Host to Equipment
    E2H = "E2H"  # Equipment to Host


class SecsMessage(Base):
    """Recorded SECS-II message."""

    __tablename__ = "secs_messages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hsms_sessions.id"), nullable=False
    )
    sequence_num: Mapped[int] = mapped_column(BigInteger, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    direction: Mapped[Direction] = mapped_column(String(5), nullable=False)
    stream: Mapped[int] = mapped_column(Integer, nullable=False)
    function: Mapped[int] = mapped_column(Integer, nullable=False)
    wbit: Mapped[bool] = mapped_column(Boolean, nullable=False)
    system_bytes: Mapped[bytes | None] = mapped_column(LargeBinary)
    raw_sml: Mapped[str | None] = mapped_column(Text)
    raw_binary: Mapped[bytes | None] = mapped_column(LargeBinary)
    parsed_body: Mapped[dict | None] = mapped_column(JSONB)
    transaction_id: Mapped[int | None] = mapped_column(Integer)
    latency_ms: Mapped[float | None] = mapped_column(Float)

    __table_args__ = (
        Index("idx_secs_messages_session_seq", "session_id", "sequence_num"),
        Index("idx_secs_messages_stream_function", "stream", "function"),
        Index("idx_secs_messages_timestamp", "timestamp"),
    )
