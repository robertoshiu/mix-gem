"""Tests for WebSocket API endpoints."""
import pytest
from starlette.testclient import TestClient
from scavenger.api.main import app


def test_websocket_endpoint_exists():
    """WebSocket endpoint /api/ws/executions/{run_id}/events exists."""
    # Verify the WebSocket route is registered in the app
    # by checking the routes list
    routes = [r.path for r in app.routes]
    assert "/api/ws/executions/{run_id}/events" in routes
