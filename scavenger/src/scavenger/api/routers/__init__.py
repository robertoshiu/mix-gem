"""API routers package."""
from scavenger.api.routers.search import router as search_router
from scavenger.api.routers.runtime import router as runtime_router
from scavenger.api.routers.scenarios import router as scenarios_router
from scavenger.api.routers.websocket import router as websocket_router

__all__ = ["search_router", "runtime_router", "scenarios_router", "websocket_router"]
