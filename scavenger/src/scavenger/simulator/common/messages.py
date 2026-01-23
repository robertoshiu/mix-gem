"""Message dataclasses for simulator."""
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import IntEnum
from typing import Any, Literal


class HsmsMessageType(IntEnum):
    """HSMS message types (SType)."""

    DATA_MESSAGE = 0
    SELECT_REQ = 1
    SELECT_RSP = 2
    DESELECT_REQ = 3
    DESELECT_RSP = 4
    LINKTEST_REQ = 5
    LINKTEST_RSP = 6
    REJECT_REQ = 7
    SEPARATE_REQ = 9


@dataclass
class SecsMessageData:
    """SECS-II message data."""

    stream: int
    function: int
    wbit: bool = False
    system_bytes: bytes | None = None
    body: Any = None
    raw_sml: str | None = None
    raw_binary: bytes | None = None

    @property
    def sf(self) -> str:
        """Stream/function string (e.g., 'S1F13')."""
        return f"S{self.stream}F{self.function}"


@dataclass
class HsmsMessage:
    """HSMS message with session context."""

    session_id: uuid.UUID
    timestamp: datetime
    direction: Literal["H2E", "E2H"]
    message_type: HsmsMessageType
    data: SecsMessageData | None = None
    sequence_num: int = 0
    transaction_id: int | None = None


@dataclass
class TransactionContext:
    """Tracks a request/reply transaction."""

    transaction_id: int
    request: HsmsMessage
    sent_at: datetime
    reply: HsmsMessage | None = None
    received_at: datetime | None = None

    @property
    def latency_ms(self) -> float | None:
        """Calculate latency if reply received."""
        if self.received_at is None:
            return None
        delta = self.received_at - self.sent_at
        return delta.total_seconds() * 1000
