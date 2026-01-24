# rag-engine/app/main.py
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import os

import redis.asyncio as redis
import structlog
from fastapi import FastAPI
from psycopg_pool import AsyncConnectionPool

from app.config import settings

logger = structlog.get_logger()

# Startup completion flag
startup_complete = False


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle: startup and shutdown."""
    global startup_complete

    # Startup
    logger.info("starting_up", postgres_host=settings.postgres_host)

    # PostgreSQL pool for LangGraph checkpointer
    app.state.pg_pool = AsyncConnectionPool(
        conninfo=settings.postgres_url,
        min_size=2,
        max_size=10,
        open=False,
    )
    await app.state.pg_pool.open()

    # Redis for equipment state
    app.state.redis = redis.from_url(settings.redis_url)

    # LightRAG initialization (deferred to avoid blocking startup)
    # Set environment for LightRAG PostgreSQL
    os.environ["POSTGRES_HOST"] = settings.postgres_host
    os.environ["POSTGRES_PORT"] = str(settings.postgres_port)
    os.environ["POSTGRES_USER"] = settings.postgres_user
    os.environ["POSTGRES_PASSWORD"] = settings.postgres_password
    os.environ["POSTGRES_DATABASE"] = settings.postgres_database

    # LightRAG will be initialized on first use via get_lightrag()
    app.state.lightrag = None

    # LangGraph agent will be initialized on first use via get_agent()
    app.state.agent = None
    app.state.checkpointer = None

    startup_complete = True
    logger.info("startup_complete")

    yield

    # Shutdown
    logger.info("shutting_down")
    await app.state.pg_pool.close()
    await app.state.redis.close()

    if app.state.lightrag is not None:
        await app.state.lightrag.finalize_storages()

    logger.info("shutdown_complete")


app = FastAPI(
    title="RAG Engine v2",
    version="0.2.0",
    description="ACE Context Engineering + Agentic RAG with LangGraph + LightRAG",
    lifespan=lifespan,
)

# Register routers
from app.routers.health import router as health_router

app.include_router(health_router)


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

    return JSONResponse(status_code=503, content={"status": "starting"})  # type: ignore[return-value]
