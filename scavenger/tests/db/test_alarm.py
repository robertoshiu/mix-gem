# tests/db/test_alarm.py
import pytest
from scavenger.db.models.alarm import Alarm, AlarmCategory, DataLayer


def test_alarm_model():
    """Alarm has SEMI E30 compliant fields."""
    alarm = Alarm(
        alid=1001,
        alcd=AlarmCategory.EQUIPMENT_SAFETY,
        altx="Wafer chuck vacuum pressure low",
        module_name="Chuck",
        severity="warning",
        data_layer=DataLayer.SCHEMA_ONLY,
    )
    assert alarm.alid == 1001
    assert alarm.alcd == AlarmCategory.EQUIPMENT_SAFETY
    assert "vacuum" in alarm.altx


def test_alarm_category_enum():
    """AlarmCategory follows SEMI E30 ALCD values."""
    assert AlarmCategory.PERSONAL_SAFETY.value == 1
    assert AlarmCategory.EQUIPMENT_SAFETY.value == 2
    assert AlarmCategory.PARAMETER_LIMIT.value == 3


def test_data_layer_enum():
    """DataLayer has three tiers."""
    assert DataLayer.SCHEMA_ONLY.value == "schema_only"
    assert DataLayer.VENDOR_FLAVORED.value == "vendor_flavored"
    assert DataLayer.PHYSICS_GROUNDED.value == "physics_grounded"
