"""FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI

from scavenger import __version__
from scavenger.api.routers import search_router, runtime_router, scenarios_router, websocket_router
from scavenger.db.session import close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    yield
    await close_db()


app = FastAPI(
    title="Scavenger API",
    description="Semiconductor equipment knowledge base with HSMS runtime",
    version=__version__,
    lifespan=lifespan,
)

app.include_router(search_router, prefix="/api")
app.include_router(runtime_router, prefix="/api")
app.include_router(scenarios_router, prefix="/api")
app.include_router(websocket_router, prefix="/api")


@app.get("/")
async def root():
    """API root information."""
    return {
        "name": "Scavenger API",
        "version": __version__,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}
