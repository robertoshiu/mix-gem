"""Provenance tracking model."""
from datetime import date
from enum import Enum
from typing import Any

from sqlalchemy import Date, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base, TimestampMixin


class SourceType(str, Enum):
    """Type of data source."""

    SYNTHETIC = "synthetic"
    PUBLIC_DOC = "public_doc"
    SEMI_STANDARD = "semi_standard"


class Provenance(Base, TimestampMixin):
    """Tracks origin and generation details of all data."""

    __tablename__ = "provenance"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_type: Mapped[SourceType] = mapped_column(
        String(50),
        nullable=False,
    )
    source_url: Mapped[str | None] = mapped_column(Text)
    document_title: Mapped[str | None] = mapped_column(Text)
    access_date: Mapped[date | None] = mapped_column(Date)
    generation_params: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    license_notes: Mapped[str | None] = mapped_column(Text)
