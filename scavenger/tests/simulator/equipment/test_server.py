# scavenger/tests/simulator/equipment/test_server.py
"""Tests for HSMS passive server."""
import asyncio

import pytest

from scavenger.simulator.equipment.server import EquipmentServer


def test_equipment_server_init():
    """EquipmentServer initializes with config."""
    server = EquipmentServer(
        equipment_id=1,
        host="0.0.0.0",
        port=5000,
        device_id=1,
    )

    assert server.equipment_id == 1
    assert server.port == 5000
    assert server.is_running is False


@pytest.mark.asyncio
async def test_equipment_server_start_stop():
    """EquipmentServer can start and stop."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15000,  # Use high port for tests
        device_id=1,
    )

    await server.start()
    assert server.is_running is True

    await server.stop()
    assert server.is_running is False


@pytest.mark.asyncio
async def test_equipment_server_get_state():
    """EquipmentServer provides equipment state."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15001,
        device_id=1,
    )

    state = server.get_state()
    assert state.equipment_id == 1


@pytest.mark.asyncio
async def test_equipment_server_inject_alarm():
    """Can inject alarm into running server."""
    server = EquipmentServer(
        equipment_id=1,
        host="127.0.0.1",
        port=15002,
        device_id=1,
    )

    await server.start()
    try:
        await server.inject_alarm(alid=1001, alcd=2, altx="Test alarm")
        alarm = server.get_state().get_alarm(1001)
        assert alarm is not None
        assert alarm.is_set is True
    finally:
        await server.stop()
