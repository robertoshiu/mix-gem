"""Scenario API schemas."""
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field


class ExecutionStatusEnum(str, Enum):
    """Execution run status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ScenarioStep(BaseModel):
    """Single step in a scenario."""

    sxfy: str = Field(..., description="SECS message (e.g., S1F13)")
    direction: str = Field(..., description="H2E or E2H")
    delay_ms: int = Field(default=0, ge=0, description="Delay before step in ms")
    data: dict | None = Field(default=None, description="Message data")


class ScenarioCreate(BaseModel):
    """Create scenario request."""

    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    steps: list[ScenarioStep] = Field(..., min_length=1)
    expected_alarms: list[int] | None = None
    expected_ceids: list[int] | None = None


class ScenarioResponse(BaseModel):
    """Scenario response."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    steps: list[dict]
    expected_alarms: list[int] | None
    expected_ceids: list[int] | None
    created_at: datetime


class ScenarioListResponse(BaseModel):
    """List scenarios response."""

    scenarios: list[ScenarioResponse]
    total: int


class ExecutionStartResponse(BaseModel):
    """Start execution response."""

    run_id: int
    status: ExecutionStatusEnum
    scenario_id: int


class ExecutionStatusResponse(BaseModel):
    """Execution status response."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    run_id: int = Field(alias="id", description="Execution run ID")
    scenario_id: int
    status: ExecutionStatusEnum
    started_at: datetime
    ended_at: datetime | None
