# tests/api/test_runtime.py
import pytest
from httpx import AsyncClient, ASGITransport
from scavenger.api.main import app


@pytest.mark.asyncio
async def test_runtime_status_endpoint():
    """GET /api/runtime/status returns connection state."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/runtime/status")

    assert response.status_code == 200
    data = response.json()

    # Validate state field
    assert "state" in data
    assert data["state"] in ["not_connected", "connected", "selected"]

    # Validate config object structure
    assert "config" in data
    config = data["config"]
    assert "host" in config
    assert "port" in config
    assert "mode" in config
    assert "device_id" in config

    # Validate config field types and values
    assert isinstance(config["port"], int)
    assert config["port"] > 0
    assert config["mode"] in ["active", "passive"]
    assert isinstance(config["device_id"], int)
