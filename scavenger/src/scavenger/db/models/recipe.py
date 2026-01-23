"""Recipe model for golden process recipes."""
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from scavenger.db.base import Base, TimestampMixin


class Recipe(Base, TimestampMixin):
    """Golden process recipe."""

    __tablename__ = "recipes"

    id: Mapped[int] = mapped_column(primary_key=True)
    equipment_model_id: Mapped[int | None] = mapped_column(
        ForeignKey("equipment_models.id")
    )

    # Recipe identification
    recipe_name: Mapped[str] = mapped_column(String(200), nullable=False)
    process_type: Mapped[str | None] = mapped_column(String(50))

    # Recipe content
    parameters: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    description: Mapped[str | None] = mapped_column(Text)
    description_embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))

    # Flags
    is_golden: Mapped[bool] = mapped_column(Boolean, default=False)

    # Provenance
    provenance_id: Mapped[int | None] = mapped_column(ForeignKey("provenance.id"))

    __table_args__ = (
        Index(
            "idx_recipes_embedding",
            "description_embedding",
            postgresql_using="hnsw",
            postgresql_ops={"description_embedding": "vector_cosine_ops"},
            postgresql_with={"m": 16, "ef_construction": 64},
        ),
        Index("idx_recipes_process", "process_type"),
        Index("idx_recipes_golden", "is_golden"),
    )
