# tests/db/test_equipment.py
import pytest
from scavenger.db.models.equipment import EquipmentVendor, EquipmentModel, EquipmentType


def test_equipment_vendor_model():
    """EquipmentVendor has required fields."""
    vendor = EquipmentVendor(
        name="ASML",
        naming_convention_notes="Uses UPPER_SNAKE_CASE for alarms",
    )
    assert vendor.name == "ASML"


def test_equipment_model():
    """EquipmentModel has required fields."""
    model = EquipmentModel(
        vendor_id=1,
        model_name="TWINSCAN NXE:3400C",
        equipment_type=EquipmentType.LITHO,
        module_names=["Wafer Stage", "Reticle Stage", "Lens"],
    )
    assert model.equipment_type == EquipmentType.LITHO
    assert "Wafer Stage" in model.module_names


def test_equipment_type_enum():
    """EquipmentType has expected values."""
    assert EquipmentType.LITHO.value == "litho"
    assert EquipmentType.ETCH.value == "etch"
    assert EquipmentType.CVD.value == "cvd"
