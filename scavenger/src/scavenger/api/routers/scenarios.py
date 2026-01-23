"""Scenario and execution API router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.api.schemas.scenarios import (
    ScenarioCreate,
    ScenarioResponse,
    ScenarioListResponse,
    ExecutionStartResponse,
    ExecutionStatusResponse,
)
from scavenger.db.models.scenario import Scenario
from scavenger.db.models.execution import ExecutionRun, RunStatus
from scavenger.db.session import get_session

# Main router
router = APIRouter(tags=["scenarios", "executions"])

# Sub-routers
scenarios_router = APIRouter(prefix="/scenarios")
executions_router = APIRouter(prefix="/executions")


async def get_db_session():
    """Dependency for database session."""
    async with get_session() as session:
        yield session


# Scenario endpoints
@scenarios_router.get("", response_model=ScenarioListResponse)
async def list_scenarios(
    session: AsyncSession = Depends(get_db_session),
):
    """List all scenarios."""
    stmt = select(Scenario).order_by(Scenario.created_at.desc())
    result = await session.execute(stmt)
    scenarios = result.scalars().all()

    return ScenarioListResponse(
        scenarios=[ScenarioResponse.model_validate(s) for s in scenarios],
        total=len(scenarios),
    )


@scenarios_router.post("", response_model=ScenarioResponse, status_code=201)
async def create_scenario(
    scenario_data: ScenarioCreate,
    session: AsyncSession = Depends(get_db_session),
):
    """Create a new scenario."""
    scenario = Scenario(
        name=scenario_data.name,
        description=scenario_data.description,
        steps=[step.model_dump() for step in scenario_data.steps],
        expected_alarms=scenario_data.expected_alarms,
        expected_ceids=scenario_data.expected_ceids,
    )

    session.add(scenario)
    await session.commit()
    await session.refresh(scenario)

    return ScenarioResponse.model_validate(scenario)


@scenarios_router.post("/{scenario_id}/execute", response_model=ExecutionStartResponse, status_code=202)
async def start_execution(
    scenario_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Start scenario execution."""
    # Verify scenario exists
    stmt = select(Scenario).where(Scenario.id == scenario_id)
    result = await session.execute(stmt)
    scenario = result.scalar_one_or_none()

    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Create execution run
    run = ExecutionRun(
        scenario_id=scenario_id,
        status=RunStatus.PENDING,
    )

    session.add(run)
    await session.commit()
    await session.refresh(run)

    # NOTE: Actual execution will be triggered asynchronously in later phases
    # For now, just create the run record

    return ExecutionStartResponse(
        run_id=run.id,
        status=run.status,
        scenario_id=scenario_id,
    )


# Execution endpoints
@executions_router.get("/{run_id}", response_model=ExecutionStatusResponse)
async def get_execution_status(
    run_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get execution run status."""
    stmt = select(ExecutionRun).where(ExecutionRun.id == run_id)
    result = await session.execute(stmt)
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Execution run not found")

    return ExecutionStatusResponse.model_validate(run)


# Include sub-routers
router.include_router(scenarios_router)
router.include_router(executions_router)
