"""Message dataclasses for simulator."""
import base64
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

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary for JSON encoding."""
        return {
            "stream": self.stream,
            "function": self.function,
            "wbit": self.wbit,
            "system_bytes": (
                base64.b64encode(self.system_bytes).decode("utf-8")
                if self.system_bytes is not None
                else None
            ),
            "body": self.body,
            "raw_sml": self.raw_sml,
            "raw_binary": (
                base64.b64encode(self.raw_binary).decode("utf-8")
                if self.raw_binary is not None
                else None
            ),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SecsMessageData":
        """Deserialize from dictionary."""
        return cls(
            stream=data["stream"],
            function=data["function"],
            wbit=data["wbit"],
            system_bytes=(
                base64.b64decode(data["system_bytes"])
                if data["system_bytes"] is not None
                else None
            ),
            body=data["body"],
            raw_sml=data["raw_sml"],
            raw_binary=(
                base64.b64decode(data["raw_binary"])
                if data["raw_binary"] is not None
                else None
            ),
        )


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

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dictionary for JSON encoding."""
        return {
            "session_id": str(self.session_id),
            "timestamp": self.timestamp.isoformat(),
            "direction": self.direction,
            "message_type": int(self.message_type),
            "data": self.data.to_dict() if self.data is not None else None,
            "sequence_num": self.sequence_num,
            "transaction_id": self.transaction_id,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "HsmsMessage":
        """Deserialize from dictionary."""
        return cls(
            session_id=uuid.UUID(data["session_id"]),
            timestamp=datetime.fromisoformat(data["timestamp"]),
            direction=data["direction"],
            message_type=HsmsMessageType(data["message_type"]),
            data=(
                SecsMessageData.from_dict(data["data"])
                if data["data"] is not None
                else None
            ),
            sequence_num=data["sequence_num"],
            transaction_id=data["transaction_id"],
        )


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
