"""HSMS session tracking for simulator."""
import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base


class SessionType(str, Enum):
    """Type of HSMS session."""

    SIMULATION = "simulation"
    EXTERNAL = "external"
    REPLAY = "replay"


class LocalRole(str, Enum):
    """Local side role in HSMS connection."""

    EQUIPMENT = "equipment"
    HOST = "host"


class ConnectionState(str, Enum):
    """HSMS connection state."""

    NOT_CONNECTED = "not_connected"
    CONNECTED = "connected"
    SELECTED = "selected"


class HsmsSession(Base):
    """HSMS connection session record."""

    __tablename__ = "hsms_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    equipment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("equipment_models.id")
    )
    session_type: Mapped[SessionType] = mapped_column(String(20), nullable=False)
    local_role: Mapped[LocalRole] = mapped_column(String(20), nullable=False)
    remote_address: Mapped[str | None] = mapped_column(String(255))
    local_port: Mapped[int | None] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    connection_state: Mapped[ConnectionState | None] = mapped_column(String(20))
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
