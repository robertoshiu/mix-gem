"""Equipment vendor and model tables."""
from enum import Enum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from scavenger.db.base import Base, TimestampMixin


class EquipmentType(str, Enum):
    """Type of semiconductor equipment."""

    LITHO = "litho"
    ETCH = "etch"
    CVD = "cvd"
    PVD = "pvd"
    CMP = "cmp"
    IMPLANT = "implant"
    METROLOGY = "metrology"
    OTHER = "other"


class EquipmentVendor(Base, TimestampMixin):
    """Equipment manufacturer."""

    __tablename__ = "equipment_vendors"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    naming_convention_notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    models: Mapped[list["EquipmentModel"]] = relationship(back_populates="vendor")


class EquipmentModel(Base, TimestampMixin):
    """Specific equipment model."""

    __tablename__ = "equipment_models"

    id: Mapped[int] = mapped_column(primary_key=True)
    vendor_id: Mapped[int] = mapped_column(ForeignKey("equipment_vendors.id"))
    model_name: Mapped[str] = mapped_column(String(200), nullable=False)
    equipment_type: Mapped[EquipmentType | None] = mapped_column(String(50))
    module_names: Mapped[list[str] | None] = mapped_column(ARRAY(String(100)))

    # Relationships
    vendor: Mapped["EquipmentVendor"] = relationship(back_populates="models")
