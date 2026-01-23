"""Alarm model with SEMI E30 compliance."""
from enum import Enum
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base, TimestampMixin


class AlarmCategory(int, Enum):
    """SEMI E30 ALCD values."""

    PERSONAL_SAFETY = 1
    EQUIPMENT_SAFETY = 2
    PARAMETER_LIMIT = 3
    PARAMETER_CHANGE = 4
    EQUIPMENT_STATUS_CHANGE = 5
    ATTENTION_FLAG = 6
    DATA_INTEGRITY = 7
    OTHER = 8


class DataLayer(str, Enum):
    """Synthetic data generation layer."""

    SCHEMA_ONLY = "schema_only"
    VENDOR_FLAVORED = "vendor_flavored"
    PHYSICS_GROUNDED = "physics_grounded"


class Alarm(Base, TimestampMixin):
    """Equipment alarm (SEMI E30 S5F1 compliant)."""

    __tablename__ = "alarms"

    id: Mapped[int] = mapped_column(primary_key=True)
    equipment_model_id: Mapped[int | None] = mapped_column(
        ForeignKey("equipment_models.id")
    )

    # SEMI E30 fields
    alid: Mapped[int] = mapped_column(Integer, nullable=False)
    alcd: Mapped[AlarmCategory] = mapped_column(Integer, nullable=False)
    altx: Mapped[str] = mapped_column(Text, nullable=False)

    # Search vectors (populated by triggers/application)
    altx_tsv: Mapped[Any | None] = mapped_column(TSVECTOR)
    altx_embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))

    # Extended fields
    module_name: Mapped[str | None] = mapped_column(String(100))
    severity: Mapped[str | None] = mapped_column(String(50))
    probable_causes: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    recommended_actions: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    physics_context: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    # Metadata
    data_layer: Mapped[DataLayer] = mapped_column(String(50), nullable=False)
    provenance_id: Mapped[int | None] = mapped_column(ForeignKey("provenance.id"))

    __table_args__ = (
        Index("idx_alarms_altx_tsv", "altx_tsv", postgresql_using="gin"),
        Index(
            "idx_alarms_embedding",
            "altx_embedding",
            postgresql_using="hnsw",
            postgresql_ops={"altx_embedding": "vector_cosine_ops"},
            postgresql_with={"m": 16, "ef_construction": 64},
        ),
        Index("idx_alarms_alid", "alid"),
        Index("idx_alarms_equipment", "equipment_model_id"),
    )
