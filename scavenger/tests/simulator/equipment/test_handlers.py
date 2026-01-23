"""Tests for SECS message handlers."""
import pytest

from scavenger.simulator.common.messages import SecsMessageData
from scavenger.simulator.equipment.handlers import MessageHandlerRegistry
from scavenger.simulator.equipment.state import EquipmentState


def test_handler_registry_registers():
    """@handler decorator registers functions."""
    registry = MessageHandlerRegistry()

    @registry.handler(1, 1)
    async def handle_s1f1(state, msg):
        return SecsMessageData(stream=1, function=2, body=None)

    assert registry.has_handler(1, 1)
    assert not registry.has_handler(1, 3)


@pytest.mark.asyncio
async def test_handler_s1f1_returns_s1f2():
    """S1F1 handler returns S1F2."""
    from scavenger.simulator.equipment.handlers import default_handlers

    state = EquipmentState(equipment_id=1)
    request = SecsMessageData(stream=1, function=1, wbit=True)

    reply = await default_handlers.dispatch(state, request)

    assert reply is not None
    assert reply.stream == 1
    assert reply.function == 2


@pytest.mark.asyncio
async def test_handler_s1f13_returns_s1f14():
    """S1F13 (Establish Comm) returns S1F14."""
    from scavenger.simulator.equipment.handlers import default_handlers

    state = EquipmentState(equipment_id=1)
    request = SecsMessageData(
        stream=1, function=13, wbit=True,
        body={"MDLN": "TestHost", "SOFTREV": "1.0"}
    )

    reply = await default_handlers.dispatch(state, request)

    assert reply is not None
    assert reply.stream == 1
    assert reply.function == 14


@pytest.mark.asyncio
async def test_handler_s1f3_returns_svs():
    """S1F3 (Selected Equipment Status) returns SV values."""
    from scavenger.simulator.equipment.handlers import default_handlers

    state = EquipmentState(equipment_id=1)
    state.set_variable(state.VariableType.SV, 1, 100)
    state.set_variable(state.VariableType.SV, 2, 200)

    request = SecsMessageData(stream=1, function=3, wbit=True, body=[1, 2])

    reply = await default_handlers.dispatch(state, request)

    assert reply.stream == 1
    assert reply.function == 4
    assert reply.body == [100, 200]
