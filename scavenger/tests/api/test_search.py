import pytest
from httpx import ASGITransport, AsyncClient
from scavenger.api.main import app


@pytest.mark.asyncio
async def test_search_alarms_endpoint_exists():
    """POST /api/search/alarms endpoint exists."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/search/alarms",
            json={"query": "vacuum pressure"},
        )

    assert response.status_code != 404
