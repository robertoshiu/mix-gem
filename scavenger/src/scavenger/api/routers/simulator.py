"""API router for simulator control.

Provides REST endpoints for:
- Simulator status and control
- Replay session management
- Scenario execution
"""
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/simulator", tags=["simulator"])


# =============================================================================
# Request/Response Models
# =============================================================================


class SimulatorStatus(BaseModel):
    """Simulator status response."""

    running: bool
    equipment_id: str | None = None
    hsms_port: int | None = None
    device_id: int | None = None
    connections: int = 0
    uptime_seconds: float | None = None
    current_scenario: str | None = None
    message_count: int = 0


class ReplayCreateRequest(BaseModel):
    """Request to create a replay session."""

    recording_session_id: str = Field(..., description="UUID of recorded session")
    speed: float = Field(default=1.0, ge=0.1, le=100.0, description="Playback speed")
    loop: bool = Field(default=False, description="Loop playback")
    start_time: datetime | None = Field(default=None, description="Start from timestamp")
    end_time: datetime | None = Field(default=None, description="End at timestamp")


class ReplaySessionResponse(BaseModel):
    """Replay session information."""

    session_id: str
    recording_session_id: str
    state: str
    progress: float
    current_index: int
    message_count: int
    speed: float
    loop: bool
    created_at: datetime


class ReplayControlRequest(BaseModel):
    """Request to control replay playback."""

    action: str = Field(..., description="Action: pause, resume, stop")


class SeekRequest(BaseModel):
    """Request to seek within replay."""

    index: int | None = Field(default=None, description="Seek to message index")
    timestamp: datetime | None = Field(default=None, description="Seek to timestamp")


class SpeedRequest(BaseModel):
    """Request to change playback speed."""

    speed: float = Field(..., ge=0.1, le=100.0, description="Playback speed multiplier")


class ScenarioRunRequest(BaseModel):
    """Request to run a scenario."""

    name: str = Field(..., description="Scenario name or path")
    equipment_id: str | None = Field(default=None, description="Target equipment ID")


class ScenarioStatus(BaseModel):
    """Scenario execution status."""

    name: str
    state: str
    current_step: int
    total_steps: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error: str | None = None


# =============================================================================
# Simulator Status Endpoints
# =============================================================================


@router.get("/status", response_model=SimulatorStatus)
async def get_simulator_status() -> SimulatorStatus:
    """Get current simulator status.

    Returns information about the running simulator including
    connection count, uptime, and active scenario.
    """
    # TODO: Query actual simulator state
    return SimulatorStatus(
        running=False,
        equipment_id=None,
        hsms_port=None,
        device_id=None,
        connections=0,
        uptime_seconds=None,
        current_scenario=None,
        message_count=0,
    )


# =============================================================================
# Replay Endpoints
# =============================================================================


@router.post("/replay", response_model=ReplaySessionResponse, status_code=status.HTTP_201_CREATED)
async def create_replay_session(request: ReplayCreateRequest) -> ReplaySessionResponse:
    """Create a new replay session.

    Loads messages from the specified recording session and creates
    a replay session that can be controlled via the replay endpoints.
    """
    try:
        recording_uuid = uuid.UUID(request.recording_session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid recording_session_id: {e}",
        )

    # TODO: Create actual replay session via ReplayService
    # For now, return a mock response
    session_id = uuid.uuid4()

    return ReplaySessionResponse(
        session_id=str(session_id),
        recording_session_id=str(recording_uuid),
        state="STOPPED",
        progress=0.0,
        current_index=0,
        message_count=0,
        speed=request.speed,
        loop=request.loop,
        created_at=datetime.utcnow(),
    )


@router.get("/replay", response_model=list[ReplaySessionResponse])
async def list_replay_sessions() -> list[ReplaySessionResponse]:
    """List all active replay sessions."""
    # TODO: Get from ReplayService
    return []


@router.get("/replay/{session_id}", response_model=ReplaySessionResponse)
async def get_replay_session(session_id: str) -> ReplaySessionResponse:
    """Get replay session status."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session_id: {e}",
        )

    # TODO: Get from ReplayService
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Replay session not found: {session_id}",
    )


@router.post("/replay/{session_id}/play")
async def play_replay(session_id: str) -> dict[str, Any]:
    """Start or resume replay playback."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session_id: {e}",
        )

    # TODO: Call ReplayService.play()
    return {"status": "playing", "session_id": session_id}


@router.post("/replay/{session_id}/pause")
async def pause_replay(session_id: str) -> dict[str, Any]:
    """Pause replay playback."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session_id: {e}",
        )

    # TODO: Call ReplayService.pause()
    return {"status": "paused", "session_id": session_id}


@router.post("/replay/{session_id}/stop")
async def stop_replay(session_id: str) -> dict[str, Any]:
    """Stop replay playback."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session_id: {e}",
        )

    # TODO: Call ReplayService.stop()
    return {"status": "stopped", "session_id": session_id}


@router.post("/replay/{session_id}/seek")
async def seek_replay(session_id: str, request: SeekRequest) -> dict[str, Any]:
    """Seek to a position in the replay."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session_id: {e}",
        )

    if request.index is None and request.timestamp is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must specify either index or timestamp",
        )

    # TODO: Call ReplayService.seek() or seek_to_time()
    return {
        "status": "seeked",
        "session_id": session_id,
        "index": request.index,
        "timestamp": request.timestamp.isoformat() if request.timestamp else None,
    }


@router.put("/replay/{session_id}/speed")
async def set_replay_speed(session_id: str, request: SpeedRequest) -> dict[str, Any]:
    """Set replay playback speed."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session_id: {e}",
        )

    # TODO: Call ReplayService.set_speed()
    return {"status": "speed_changed", "session_id": session_id, "speed": request.speed}


@router.delete("/replay/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_replay_session(session_id: str) -> None:
    """Delete a replay session."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session_id: {e}",
        )

    # TODO: Call ReplayService.delete_session()


# =============================================================================
# Scenario Endpoints
# =============================================================================


@router.get("/scenarios")
async def list_scenarios() -> list[dict[str, Any]]:
    """List available scenarios.

    Scans the scenarios directory for YAML and Python DSL files.
    """
    # TODO: Scan scenarios directory
    return []


@router.post("/scenarios/run", response_model=ScenarioStatus)
async def run_scenario(request: ScenarioRunRequest) -> ScenarioStatus:
    """Run a scenario.

    Loads and executes the specified scenario on the simulator.
    """
    # TODO: Load and run scenario via ScenarioEngine
    return ScenarioStatus(
        name=request.name,
        state="pending",
        current_step=0,
        total_steps=0,
        started_at=None,
        completed_at=None,
        error="Not implemented",
    )


@router.get("/scenarios/status", response_model=ScenarioStatus | None)
async def get_scenario_status() -> ScenarioStatus | None:
    """Get current scenario execution status."""
    # TODO: Get from ScenarioEngine
    return None


@router.post("/scenarios/stop")
async def stop_scenario() -> dict[str, Any]:
    """Stop the currently running scenario."""
    # TODO: Stop ScenarioEngine
    return {"status": "stopped"}


# =============================================================================
# Snapshot Endpoints
# =============================================================================


@router.get("/replay/{session_id}/snapshots")
async def list_snapshots(session_id: str) -> list[dict[str, Any]]:
    """List snapshots for a replay session."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session_id: {e}",
        )

    # TODO: Get from SnapshotManager
    return []


@router.post("/replay/{session_id}/snapshots")
async def create_snapshot(session_id: str, name: str | None = None) -> dict[str, Any]:
    """Create a snapshot at current position."""
    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid session_id: {e}",
        )

    # TODO: Create via SnapshotManager
    snapshot_id = uuid.uuid4()
    return {
        "snapshot_id": str(snapshot_id),
        "session_id": session_id,
        "name": name or f"snapshot_{snapshot_id.hex[:8]}",
        "created_at": datetime.utcnow().isoformat(),
    }


@router.post("/replay/{session_id}/snapshots/{snapshot_id}/seek")
async def seek_to_snapshot(session_id: str, snapshot_id: str) -> dict[str, Any]:
    """Seek to a snapshot position."""
    try:
        session_uuid = uuid.UUID(session_id)
        snapshot_uuid = uuid.UUID(snapshot_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID: {e}",
        )

    # TODO: Call SnapshotManager.seek_to_snapshot()
    return {"status": "seeked", "snapshot_id": snapshot_id}


@router.post("/replay/{session_id}/snapshots/{snapshot_id}/fork")
async def fork_from_snapshot(session_id: str, snapshot_id: str) -> dict[str, Any]:
    """Create a new replay session from a snapshot."""
    try:
        session_uuid = uuid.UUID(session_id)
        snapshot_uuid = uuid.UUID(snapshot_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID: {e}",
        )

    # TODO: Call SnapshotManager.fork_from_snapshot()
    new_session_id = uuid.uuid4()
    return {
        "new_session_id": str(new_session_id),
        "forked_from": snapshot_id,
    }
