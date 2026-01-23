"""SECS message handlers for equipment simulator."""
from typing import Any, Awaitable, Callable

from scavenger.simulator.common.messages import SecsMessageData
from scavenger.simulator.equipment.state import EquipmentState, VariableType


HandlerFunc = Callable[[EquipmentState, SecsMessageData], Awaitable[SecsMessageData | None]]


class MessageHandlerRegistry:
    """Registry of SECS message handlers."""

    def __init__(self) -> None:
        self._handlers: dict[tuple[int, int], HandlerFunc] = {}

    def handler(self, stream: int, function: int) -> Callable[[HandlerFunc], HandlerFunc]:
        """Decorator to register a handler for stream/function."""
        def decorator(func: HandlerFunc) -> HandlerFunc:
            self._handlers[(stream, function)] = func
            return func
        return decorator

    def has_handler(self, stream: int, function: int) -> bool:
        """Check if handler exists for stream/function."""
        return (stream, function) in self._handlers

    async def dispatch(
        self,
        state: EquipmentState,
        request: SecsMessageData,
    ) -> SecsMessageData | None:
        """Dispatch message to appropriate handler.

        Returns reply message or None if no reply needed.
        """
        handler = self._handlers.get((request.stream, request.function))
        if handler is None:
            # Unknown message - return S9F7 (Illegal Data)
            return SecsMessageData(stream=9, function=7, body=request.sf)

        return await handler(state, request)


# Default handlers for common GEM messages
default_handlers = MessageHandlerRegistry()


@default_handlers.handler(1, 1)
async def handle_s1f1(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S1F1 Are You There - reply S1F2."""
    return SecsMessageData(stream=1, function=2, body=None)


@default_handlers.handler(1, 13)
async def handle_s1f13(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S1F13 Establish Communication - reply S1F14."""
    # COMMACK = 0 (accepted)
    # MDLN, SOFTREV from equipment
    return SecsMessageData(
        stream=1,
        function=14,
        body={
            "COMMACK": 0,
            "MDLN": f"SimEquip-{state.equipment_id}",
            "SOFTREV": "1.0.0",
        },
    )


@default_handlers.handler(1, 3)
async def handle_s1f3(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S1F3 Selected Equipment Status Request - reply S1F4 with SV values."""
    svids = request.body if isinstance(request.body, list) else []
    values = state.get_variables(VariableType.SV, svids)
    return SecsMessageData(stream=1, function=4, body=values)


@default_handlers.handler(1, 11)
async def handle_s1f11(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S1F11 Status Variable Namelist Request - reply S1F12."""
    # Return list of SV definitions
    svids = request.body if isinstance(request.body, list) else []
    # For each SVID, return [SVID, SVNAME, UNITS]
    sv_info = []
    for svid in svids:
        sv_info.append([svid, f"SV{svid}", ""])
    return SecsMessageData(stream=1, function=12, body=sv_info)


@default_handlers.handler(2, 13)
async def handle_s2f13(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S2F13 Equipment Constant Request - reply S2F14 with ECV values."""
    ecids = request.body if isinstance(request.body, list) else []
    values = state.get_variables(VariableType.ECV, ecids)
    return SecsMessageData(stream=2, function=14, body=values)


@default_handlers.handler(2, 15)
async def handle_s2f15(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S2F15 New Equipment Constant Send - reply S2F16."""
    # request.body = [[ECID, ECV], ...]
    if isinstance(request.body, list):
        for item in request.body:
            if isinstance(item, list) and len(item) >= 2:
                ecid, ecv = item[0], item[1]
                state.set_variable(VariableType.ECV, ecid, ecv)
    # EAC = 0 (accepted)
    return SecsMessageData(stream=2, function=16, body=0)


@default_handlers.handler(5, 3)
async def handle_s5f3(state: EquipmentState, request: SecsMessageData) -> SecsMessageData:
    """S5F3 Enable/Disable Alarm Send - reply S5F4."""
    # request.body = {ALED, ALID}
    # ALED bit 7: 0=disable, 1=enable
    body = request.body if isinstance(request.body, dict) else {}
    aled = body.get("ALED", 0)
    alid = body.get("ALID", 0)

    # ALED bit 7 indicates enable/disable
    enabled = bool(aled & 0x80)

    if alid == 0:
        # All alarms
        pass  # Would enable/disable all
    else:
        if not enabled:
            state.clear_alarm(alid)

    # ACKC5 = 0 (accepted)
    return SecsMessageData(stream=5, function=4, body=0)


# Add state.VariableType reference for tests
EquipmentState.VariableType = VariableType
