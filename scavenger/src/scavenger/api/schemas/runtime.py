"""Runtime API schemas."""
from pydantic import BaseModel


class ConnectionConfig(BaseModel):
    """HSMS connection configuration."""

    host: str
    port: int
    mode: str
    device_id: int


class RuntimeStatus(BaseModel):
    """HSMS runtime status response."""

    state: str
    config: ConnectionConfig
