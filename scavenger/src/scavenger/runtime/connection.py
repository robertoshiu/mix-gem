"""HSMS connection configuration and state."""
from dataclasses import dataclass
from enum import Enum
from typing import Literal


class ConnectionState(str, Enum):
    """HSMS connection state machine states."""

    NOT_CONNECTED = "not_connected"
    CONNECTED = "connected"
    SELECTED = "selected"


@dataclass
class HsmsConnectionConfig:
    """HSMS connection configuration."""

    host: str
    port: int
    mode: Literal["active", "passive"] = "passive"
    device_id: int = 1

    t3_timeout: float = 45.0
    t5_timeout: float = 10.0
    t6_timeout: float = 5.0
    t7_timeout: float = 10.0
    t8_timeout: float = 5.0
