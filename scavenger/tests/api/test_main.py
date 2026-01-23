import pytest
from httpx import AsyncClient, ASGITransport
from scavenger.api.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Health endpoint returns ok."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_root_endpoint():
    """Root endpoint returns API info."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")

    assert response.status_code == 200
    assert "Scavenger" in response.json()["name"]
