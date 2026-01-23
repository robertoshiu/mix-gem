# scavenger/src/scavenger/simulator/eap/client.py
"""HSMS active mode client for EAP (Equipment Automation Program)."""
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from scavenger.runtime.connection import ConnectionState
from scavenger.simulator.common.codec import SecsCodec
from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
    TransactionContext,
)
from scavenger.simulator.common.timers import HsmsTimers, TimerType

logger = logging.getLogger(__name__)


class EapClient:
    """HSMS active mode client.

    Connects to equipment simulators (running in passive mode) and sends SECS messages.
    This is the inverse relationship: Client connects TO equipment.
    """

    def __init__(
        self,
        host: str,
        port: int,
        device_id: int,
        session_id: uuid.UUID,
        t3: float = 45.0,
        t5: float = 10.0,
        t6: float = 5.0,
    ) -> None:
        """Initialize EAP client.

        Args:
            host: Equipment host address
            port: Equipment TCP port
            device_id: SECS device ID
            session_id: Session UUID for tracking
            t3: Reply timeout (seconds)
            t5: Connect separation timeout (seconds)
            t6: Control transaction timeout (seconds)
        """
        self.host = host
        self.port = port
        self.device_id = device_id
        self.session_id = session_id

        self._timers = HsmsTimers(t3=t3, t5=t5, t6=t6)
        self._codec = SecsCodec()

        # Connection state
        self._state = ConnectionState.NOT_CONNECTED
        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None

        # Transaction tracking for request/reply matching
        self._transactions: dict[int, TransactionContext] = {}
        self._transaction_id_counter: int = 0
        self._sequence_num: int = 0

        # Background task for incoming messages
        self._receiver_task: asyncio.Task | None = None

        # Reply futures for awaiting responses
        self._reply_futures: dict[int, asyncio.Future] = {}

    @property
    def is_connected(self) -> bool:
        """Check if client is connected to equipment."""
        return self._state != ConnectionState.NOT_CONNECTED

    @property
    def connection_state(self) -> ConnectionState:
        """Get current connection state."""
        return self._state

    async def connect(self) -> None:
        """Connect to equipment server.

        Establishes TCP connection to equipment running in HSMS passive mode.
        """
        if self.is_connected:
            logger.warning("Already connected")
            return

        try:
            self._reader, self._writer = await asyncio.open_connection(
                self.host,
                self.port,
            )
            self._state = ConnectionState.CONNECTED

            # Start receiver task for incoming messages
            self._receiver_task = asyncio.create_task(self._handle_incoming())

            logger.info(f"Connected to equipment at {self.host}:{self.port}")

        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            self._state = ConnectionState.NOT_CONNECTED
            raise

    async def disconnect(self) -> None:
        """Disconnect from equipment server."""
        if not self.is_connected:
            logger.warning("Not connected")
            return

        # Cancel receiver task
        if self._receiver_task:
            self._receiver_task.cancel()
            try:
                await self._receiver_task
            except asyncio.CancelledError:
                pass
            self._receiver_task = None

        # Close writer
        if self._writer:
            self._writer.close()
            await self._writer.wait_closed()
            self._writer = None

        self._reader = None
        self._state = ConnectionState.NOT_CONNECTED

        # Cancel all pending timers
        self._timers.cancel_all()

        # Cancel all pending reply futures
        for future in self._reply_futures.values():
            if not future.done():
                future.cancel()
        self._reply_futures.clear()

        logger.info("Disconnected from equipment")

    async def send_message(
        self,
        stream: int,
        function: int,
        wbit: bool,
        body: Any = None,
    ) -> Any | None:
        """Send SECS message and await reply (if wbit=True).

        Args:
            stream: SECS stream number
            function: SECS function number
            wbit: Wait bit (True for request expecting reply)
            body: Message body (dict, list, or primitive)

        Returns:
            Reply message body if wbit=True, None otherwise
        """
        if not self.is_connected:
            raise RuntimeError("Not connected to equipment")

        # Create message
        msg_data = SecsMessageData(
            stream=stream,
            function=function,
            wbit=wbit,
            body=body,
        )

        transaction_id = self._next_transaction_id()

        hsms_msg = HsmsMessage(
            session_id=self.session_id,
            timestamp=datetime.now(timezone.utc),
            direction="H2E",
            message_type=HsmsMessageType.DATA_MESSAGE,
            data=msg_data,
            sequence_num=self._next_sequence(),
            transaction_id=transaction_id,
        )

        # Track transaction
        ctx = TransactionContext(
            transaction_id=transaction_id,
            request=hsms_msg,
            sent_at=hsms_msg.timestamp,
        )
        self._transactions[transaction_id] = ctx

        # Create reply future if expecting reply
        reply_future = None
        if wbit:
            reply_future = asyncio.Future()
            self._reply_futures[transaction_id] = reply_future

        # Send message (skeleton implementation - just log)
        logger.info(f"Sending {msg_data.sf} (transaction {transaction_id})")

        # In skeleton implementation, we don't actually encode/send
        # Real implementation would:
        # encoded = self._codec.encode(stream, function, wbit, body)
        # hsms_packet = self._build_hsms_packet(encoded.binary, transaction_id)
        # self._writer.write(hsms_packet)
        # await self._writer.drain()

        # Wait for reply if wbit set
        if wbit and reply_future:
            try:
                # Set T3 timeout
                reply = await asyncio.wait_for(
                    reply_future,
                    timeout=self._timers.t3,
                )
                return reply
            except asyncio.TimeoutError:
                logger.error(f"T3 timeout waiting for reply to {msg_data.sf}")
                raise
            finally:
                self._reply_futures.pop(transaction_id, None)

        return None

    async def send_select(self) -> None:
        """Send HSMS SELECT.req to establish communication.

        Transitions from CONNECTED to SELECTED state.
        """
        if self._state != ConnectionState.CONNECTED:
            logger.warning(f"Cannot send SELECT in state {self._state}")
            return

        logger.info("Sending HSMS SELECT.req")

        # In skeleton implementation, just transition state
        # Real implementation would send actual HSMS control message
        self._state = ConnectionState.SELECTED

        logger.info("Transitioned to SELECTED state")

    async def send_linktest(self) -> None:
        """Send HSMS LINKTEST.req.

        Used to verify connection is alive.
        """
        if not self.is_connected:
            raise RuntimeError("Not connected to equipment")

        logger.info("Sending HSMS LINKTEST.req")

        # In skeleton implementation, just log
        # Real implementation would send actual HSMS control message

    async def _handle_incoming(self) -> None:
        """Background task to handle incoming messages from equipment.

        Processes replies and matches them to pending transactions.
        """
        try:
            while self.is_connected and self._reader:
                # Read HSMS header (10 bytes minimum for HSMS)
                header = await self._reader.read(10)
                if not header:
                    # Connection closed
                    break

                # In skeleton implementation, we don't parse actual messages
                # Real implementation would:
                # 1. Parse HSMS header to get message length, type, transaction ID
                # 2. Read message body
                # 3. Decode SECS message
                # 4. Match to pending transaction
                # 5. Set reply future

                # For now, just log
                logger.debug("Received message header")

        except asyncio.CancelledError:
            logger.debug("Receiver task cancelled")
        except Exception as e:
            logger.error(f"Error in receiver task: {e}")
            # Connection error - disconnect
            await self.disconnect()

    def _next_transaction_id(self) -> int:
        """Get next transaction ID."""
        self._transaction_id_counter += 1
        return self._transaction_id_counter

    def _next_sequence(self) -> int:
        """Get next sequence number."""
        self._sequence_num += 1
        return self._sequence_num

    def _build_hsms_packet(self, secs_data: bytes, transaction_id: int) -> bytes:
        """Build HSMS packet with header.

        Args:
            secs_data: Encoded SECS-II message
            transaction_id: Transaction ID for request/reply matching

        Returns:
            Complete HSMS packet (header + data)

        Note:
            This is a placeholder for the skeleton implementation.
            Real implementation would build proper HSMS packet per SEMI E37.
        """
        # HSMS header format (10 bytes):
        # [0-3]: Message length (4 bytes, big endian)
        # [4]: Device ID (1 byte)
        # [5]: Message type (1 byte)
        # [6-9]: System bytes / Transaction ID (4 bytes)

        message_length = len(secs_data)
        header = bytearray(10)

        # Length (4 bytes, big endian)
        header[0:4] = message_length.to_bytes(4, byteorder='big')

        # Device ID
        header[4] = self.device_id

        # Message type (0 = DATA_MESSAGE)
        header[5] = HsmsMessageType.DATA_MESSAGE

        # Transaction ID (4 bytes)
        header[6:10] = transaction_id.to_bytes(4, byteorder='big')

        return bytes(header) + secs_data
