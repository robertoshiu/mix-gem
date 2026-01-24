# rag-engine/tests/test_health.py
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, MagicMock

from app.main import app


@pytest.fixture
async def client():
    # Initialize app state for testing (lifespan events don't run in test client)
    # Mock PostgreSQL pool
    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock(return_value=None)
    mock_pool = MagicMock()
    mock_pool.connection = MagicMock(
        return_value=AsyncMock(
            __aenter__=AsyncMock(return_value=mock_conn),
            __aexit__=AsyncMock(return_value=None),
        )
    )
    app.state.pg_pool = mock_pool

    # Mock Redis client
    mock_redis = AsyncMock()
    mock_redis.ping = AsyncMock(return_value=True)
    app.state.redis = mock_redis

    # LightRAG not initialized during tests
    app.state.lightrag = None

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.mark.asyncio
async def test_liveness(client: AsyncClient):
    response = await client.get("/health/live")
    assert response.status_code == 200
    assert response.json()["status"] == "alive"


@pytest.mark.asyncio
async def test_readiness_returns_components(client: AsyncClient):
    response = await client.get("/health/ready")
    # May be 200 or 503 depending on deps, but should have structure
    data = response.json()
    assert "status" in data
    assert "components" in data
    assert "version" in data
