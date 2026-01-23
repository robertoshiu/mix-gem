"""Event API schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ExecutionEventMessage(BaseModel):
    """WebSocket message for execution events."""

    model_config = ConfigDict(from_attributes=True)

    event_id: int
    run_id: int
    timestamp: datetime
    event_type: str
    direction: str | None
    raw_sml: str | None
    parsed_data: dict | None
