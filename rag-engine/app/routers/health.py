# rag-engine/app/routers/health.py
import time
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(tags=["Health"])


class ComponentHealth(BaseModel):
    """Health status of a single component."""

    status: str  # healthy, degraded, unhealthy
    latency_ms: float | None = None
    message: str | None = None


class HealthResponse(BaseModel):
    """Overall health response."""

    status: str
    components: dict[str, ComponentHealth]
    version: str


async def check_postgres(pool: Any) -> float:
    """Check PostgreSQL connectivity, return latency in ms."""
    start = time.time()
    async with pool.connection() as conn:
        await conn.execute("SELECT 1")
    return (time.time() - start) * 1000


async def check_redis(redis_client: Any) -> float:
    """Check Redis connectivity, return latency in ms."""
    start = time.time()
    await redis_client.ping()
    return (time.time() - start) * 1000


@router.get("/health/ready", response_model=HealthResponse)
async def readiness(request: Request) -> JSONResponse:
    """Readiness probe - all dependencies available."""
    components: dict[str, ComponentHealth] = {}
    overall_status = "healthy"

    # Check PostgreSQL (psycopg pool)
    try:
        latency = await check_postgres(request.app.state.pg_pool)
        components["postgres"] = ComponentHealth(status="healthy", latency_ms=latency)
    except Exception as e:
        components["postgres"] = ComponentHealth(status="unhealthy", message=str(e))
        overall_status = "unhealthy"

    # Check Redis
    try:
        latency = await check_redis(request.app.state.redis)
        components["redis"] = ComponentHealth(status="healthy", latency_ms=latency)
    except Exception as e:
        components["redis"] = ComponentHealth(status="unhealthy", message=str(e))
        overall_status = "unhealthy"

    # Check LightRAG (if initialized)
    if request.app.state.lightrag:
        components["lightrag"] = ComponentHealth(status="healthy", message="initialized")
    else:
        components["lightrag"] = ComponentHealth(status="degraded", message="not initialized")

    response = HealthResponse(
        status=overall_status,
        components=components,
        version="0.2.0",
    )

    status_code = 200 if overall_status == "healthy" else 503
    return JSONResponse(content=response.model_dump(), status_code=status_code)
