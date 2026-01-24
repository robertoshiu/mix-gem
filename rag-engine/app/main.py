# rag-engine/app/main.py
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import asyncpg
import redis.asyncio as redis
import structlog
from fastapi import FastAPI

from app.config import settings

logger = structlog.get_logger()

# Startup completion flag
startup_complete = False


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle: startup and shutdown."""
    global startup_complete

    # Startup
    logger.info("starting_up", postgres_url=settings.postgres_url[:20] + "...")

    app.state.db_pool = await asyncpg.create_pool(
        settings.postgres_url.replace("+asyncpg", ""),
        min_size=2,
        max_size=10,
    )
    app.state.redis = redis.from_url(settings.redis_url)

    startup_complete = True
    logger.info("startup_complete")

    yield

    # Shutdown
    logger.info("shutting_down")
    await app.state.db_pool.close()
    await app.state.redis.close()
    logger.info("shutdown_complete")


app = FastAPI(
    title="RAG Engine",
    version="0.1.0",
    description="ACE Context Engineering + Agentic RAG for lithography process engineering",
    lifespan=lifespan,
)


@app.get("/health/live")
async def liveness() -> dict[str, str]:
    """Liveness probe - process is running."""
    return {"status": "alive"}


@app.get("/health/startup")
async def startup_check() -> dict[str, str]:
    """Startup probe - initialization complete."""
    if startup_complete:
        return {"status": "started"}
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=503, content={"status": "starting"})
