"""Scenario model for HSMS message sequences."""
from typing import Any

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base, TimestampMixin


class Scenario(Base, TimestampMixin):
    """HSMS message sequence scenario."""

    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Scenario steps: [{sxfy, direction, data, delay_ms}, ...]
    steps: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)

    # Expected outcomes
    expected_alarms: Mapped[list[int] | None] = mapped_column(ARRAY(Integer))
    expected_ceids: Mapped[list[int] | None] = mapped_column(ARRAY(Integer))

    # Provenance
    provenance_id: Mapped[int | None] = mapped_column(ForeignKey("provenance.id"))
