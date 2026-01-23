# scavenger/src/scavenger/simulator/equipment/server.py
"""HSMS passive server for equipment simulation."""
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
)
from scavenger.simulator.common.timers import HsmsTimers, TimerType
from scavenger.simulator.equipment.handlers import default_handlers
from scavenger.simulator.equipment.state import EquipmentState

logger = logging.getLogger(__name__)


class EquipmentServer:
    """HSMS passive mode equipment simulator.

    Listens for host connections and responds to SECS messages.
    """

    def __init__(
        self,
        equipment_id: int,
        host: str = "0.0.0.0",
        port: int = 5000,
        device_id: int = 1,
        t3: float = 45.0,
        t6: float = 5.0,
        t7: float = 10.0,
    ) -> None:
        """Initialize equipment server.

        Args:
            equipment_id: Equipment identifier for state tracking
            host: Interface to bind to
            port: TCP port for HSMS passive mode
            device_id: SECS device ID
            t3: Reply timeout
            t6: Control timeout
            t7: Not selected timeout
        """
        self.equipment_id = equipment_id
        self.host = host
        self.port = port
        self.device_id = device_id

        self._state = EquipmentState(equipment_id=equipment_id)
        self._timers = HsmsTimers(t3=t3, t6=t6, t7=t7)

        self._server: asyncio.Server | None = None
        self._clients: dict[str, asyncio.StreamWriter] = {}
        self._session_id: uuid.UUID | None = None
        self._selected: bool = False
        self._sequence_num: int = 0

        # Message queue for outbound messages (alarms, events)
        self._outbound_queue: asyncio.Queue[HsmsMessage] = asyncio.Queue()

        # Callbacks for message recording
        self._on_message_callbacks: list[Any] = []

    @property
    def is_running(self) -> bool:
        """Check if server is running."""
        return self._server is not None and self._server.is_serving()

    def get_state(self) -> EquipmentState:
        """Get current equipment state."""
        return self._state

    async def start(self) -> None:
        """Start the HSMS server."""
        self._server = await asyncio.start_server(
            self._handle_client,
            self.host,
            self.port,
        )
        self._session_id = uuid.uuid4()
        logger.info(f"Equipment server started on {self.host}:{self.port}")

    async def stop(self) -> None:
        """Stop the HSMS server."""
        if self._server:
            self._server.close()
            await self._server.wait_closed()
            self._server = None

        # Close all client connections
        for writer in self._clients.values():
            writer.close()
            await writer.wait_closed()
        self._clients.clear()

        self._timers.cancel_all()
        logger.info("Equipment server stopped")

    async def inject_alarm(self, alid: int, alcd: int, altx: str) -> None:
        """Inject an alarm and send S5F1 to connected hosts.

        Args:
            alid: Alarm ID
            alcd: Alarm code (1-8 per SEMI E30)
            altx: Alarm text
        """
        self._state.set_alarm(alid, alcd, altx)

        # Create S5F1 alarm report
        alarm_msg = SecsMessageData(
            stream=5,
            function=1,
            wbit=True,
            body={"ALCD": alcd, "ALID": alid, "ALTX": altx},
        )

        # Queue for sending to connected hosts
        hsms_msg = HsmsMessage(
            session_id=self._session_id or uuid.uuid4(),
            timestamp=datetime.now(timezone.utc),
            direction="E2H",
            message_type=HsmsMessageType.DATA_MESSAGE,
            data=alarm_msg,
            sequence_num=self._next_sequence(),
        )

        await self._outbound_queue.put(hsms_msg)

    async def trigger_event(self, ceid: int, dvs: dict[int, Any] | None = None) -> None:
        """Trigger a collection event and send S6F11.

        Args:
            ceid: Collection event ID
            dvs: Data values to report
        """
        if not self._state.is_ceid_enabled(ceid):
            return

        event_msg = SecsMessageData(
            stream=6,
            function=11,
            wbit=True,
            body={"DATAID": 0, "CEID": ceid, "RPT": dvs or {}},
        )

        hsms_msg = HsmsMessage(
            session_id=self._session_id or uuid.uuid4(),
            timestamp=datetime.now(timezone.utc),
            direction="E2H",
            message_type=HsmsMessageType.DATA_MESSAGE,
            data=event_msg,
            sequence_num=self._next_sequence(),
        )

        await self._outbound_queue.put(hsms_msg)

    def _next_sequence(self) -> int:
        """Get next sequence number."""
        self._sequence_num += 1
        return self._sequence_num

    async def _handle_client(
        self,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
    ) -> None:
        """Handle a connected HSMS client."""
        addr = writer.get_extra_info("peername")
        client_id = f"{addr[0]}:{addr[1]}"
        self._clients[client_id] = writer

        logger.info(f"Client connected: {client_id}")

        try:
            # Start T7 timer (not selected timeout)
            self._timers.start_timer(TimerType.T7, self._on_t7_timeout)

            # Start outbound message sender
            sender_task = asyncio.create_task(self._send_outbound(writer))

            while True:
                # Read HSMS header (10 bytes minimum)
                header = await reader.read(10)
                if not header:
                    break

                # Parse and handle message
                await self._handle_message(header, reader, writer)

            sender_task.cancel()

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error handling client {client_id}: {e}")
        finally:
            self._clients.pop(client_id, None)
            writer.close()
            await writer.wait_closed()
            logger.info(f"Client disconnected: {client_id}")

    async def _handle_message(
        self,
        header: bytes,
        reader: asyncio.StreamReader,
        writer: asyncio.StreamWriter,
    ) -> None:
        """Parse and handle an incoming HSMS message."""
        # Simplified - real implementation needs full HSMS parsing
        # For now, dispatch to handlers based on stream/function

        # This is a placeholder - full implementation would:
        # 1. Parse HSMS header to get message length, type
        # 2. Read message body
        # 3. For DATA_MESSAGE, dispatch to SECS handlers
        # 4. For control messages (SELECT, LINKTEST), handle directly

        pass

    async def _send_outbound(self, writer: asyncio.StreamWriter) -> None:
        """Send queued outbound messages to client."""
        while True:
            msg = await self._outbound_queue.get()
            # Encode and send
            # writer.write(encoded_msg)
            # await writer.drain()
            for callback in self._on_message_callbacks:
                await callback(msg)

    async def _on_t7_timeout(self) -> None:
        """Handle T7 (not selected) timeout."""
        logger.warning("T7 timeout - closing unselected connection")
        # Close connections that haven't been selected
