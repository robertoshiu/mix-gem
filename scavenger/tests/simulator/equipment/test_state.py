"""Tests for equipment state manager."""
import pytest

from scavenger.simulator.equipment.state import (
    AlarmState,
    EquipmentState,
    ProcessState,
    VariableType,
)


def test_equipment_state_init():
    """EquipmentState initializes with defaults."""
    state = EquipmentState(equipment_id=1)

    assert state.equipment_id == 1
    assert state.process_state == ProcessState.IDLE
    assert state.control_state == "OFFLINE"


def test_equipment_state_set_sv():
    """Can set and get status variables."""
    state = EquipmentState(equipment_id=1)

    state.set_variable(VariableType.SV, 1, 100)
    assert state.get_variable(VariableType.SV, 1) == 100


def test_equipment_state_set_alarm():
    """Can set alarms with ALID/ALCD/ALTX."""
    state = EquipmentState(equipment_id=1)

    state.set_alarm(alid=1001, alcd=2, altx="Chuck vacuum low")

    alarm = state.get_alarm(1001)
    assert alarm is not None
    assert alarm.alcd == 2
    assert alarm.altx == "Chuck vacuum low"
    assert alarm.is_set is True


def test_equipment_state_clear_alarm():
    """Can clear an alarm."""
    state = EquipmentState(equipment_id=1)

    state.set_alarm(alid=1001, alcd=2, altx="Test alarm")
    state.clear_alarm(1001)

    alarm = state.get_alarm(1001)
    assert alarm.is_set is False


def test_equipment_state_get_all_alarms():
    """Can get all set alarms."""
    state = EquipmentState(equipment_id=1)

    state.set_alarm(1001, 2, "Alarm 1")
    state.set_alarm(1002, 3, "Alarm 2")

    alarms = state.get_set_alarms()
    assert len(alarms) == 2


def test_equipment_state_to_dict():
    """Can serialize state to dict for snapshots."""
    state = EquipmentState(equipment_id=1)
    state.set_variable(VariableType.SV, 1, 100)
    state.set_alarm(1001, 2, "Test")

    snapshot = state.to_dict()

    assert "svs" in snapshot
    assert "alarms" in snapshot
    assert snapshot["svs"][1] == 100


def test_equipment_state_from_dict():
    """Can deserialize state from dict."""
    state = EquipmentState(equipment_id=1)
    state.set_variable(VariableType.SV, 1, 100)
    state.set_alarm(1001, 2, "Test")

    snapshot = state.to_dict()
    restored = EquipmentState.from_dict(snapshot)

    assert restored.equipment_id == 1
    assert restored.get_variable(VariableType.SV, 1) == 100
    assert restored.get_alarm(1001).altx == "Test"
