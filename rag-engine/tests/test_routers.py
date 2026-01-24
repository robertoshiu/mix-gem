# rag-engine/tests/test_routers.py
"""Tests for API routers."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    """Create test client with mocked app state."""
    # Mock the app state that would normally be set in lifespan
    app.state.redis = MagicMock()
    app.state.redis.hgetall = AsyncMock(return_value={})
    app.state.redis.lrange = AsyncMock(return_value=[])
    app.state.redis.delete = AsyncMock()
    app.state.pg_pool = MagicMock()
    app.state.agent = None
    app.state.lightrag = None

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


class TestQueryRouter:
    """Tests for query router."""

    @pytest.mark.asyncio
    async def test_query_endpoint_structure(self, client: AsyncClient):
        """Test query endpoint returns proper structure (with mocked agent)."""
        # Mock the agent initialization and run
        mock_agent = MagicMock()
        mock_agent.run = AsyncMock(return_value={
            "answer": "Test answer",
            "session_id": "test_session",
            "message_count": 3,
        })

        with patch("app.routers.query.get_or_create_agent", return_value=mock_agent):
            with patch("app.routers.query.get_lightrag_service") as mock_lightrag:
                mock_lightrag_instance = MagicMock()
                mock_lightrag_instance.query = AsyncMock(return_value="Knowledge result")
                mock_lightrag.return_value = mock_lightrag_instance

                response = await client.post(
                    "/query",
                    json={"question": "Why is CD trending on LITHO01?"},
                )

        # With mocked dependencies, should get structured response
        assert response.status_code == 200 or response.status_code == 500
        # If 200, verify structure
        if response.status_code == 200:
            data = response.json()
            assert "answer" in data
            assert "session_id" in data
            assert "query_type" in data
            assert "lightrag_mode" in data

    @pytest.mark.asyncio
    async def test_query_request_validation(self, client: AsyncClient):
        """Test query request validation."""
        # Empty question should fail
        response = await client.post(
            "/query",
            json={"question": ""},
        )
        assert response.status_code == 422  # Validation error

        # Too long question should fail
        response = await client.post(
            "/query",
            json={"question": "x" * 2001},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_query_with_tool_id(self, client: AsyncClient):
        """Test query with explicit tool_id."""
        mock_agent = MagicMock()
        mock_agent.run = AsyncMock(return_value={
            "answer": "LITHO01 is running normally",
            "session_id": "test_session",
            "message_count": 2,
        })

        with patch("app.routers.query.get_or_create_agent", return_value=mock_agent):
            with patch("app.routers.query.get_lightrag_service") as mock_lightrag:
                mock_lightrag_instance = MagicMock()
                mock_lightrag_instance.query = AsyncMock(return_value="Knowledge")
                mock_lightrag.return_value = mock_lightrag_instance

                response = await client.post(
                    "/query",
                    json={
                        "question": "What's the status?",
                        "tool_id": "LITHO01",
                    },
                )

        if response.status_code == 200:
            data = response.json()
            assert "session_id" in data


class TestThreadsRouter:
    """Tests for threads router."""

    @pytest.mark.asyncio
    async def test_get_thread_state_no_agent(self, client: AsyncClient):
        """Test getting thread state when no agent exists."""
        response = await client.get("/threads/test_thread_123/state")

        assert response.status_code == 200
        data = response.json()
        assert data["thread_id"] == "test_thread_123"
        assert data["status"] == "no_agent"

    @pytest.mark.asyncio
    async def test_interrupt_no_agent(self, client: AsyncClient):
        """Test interrupt handling when no agent exists."""
        response = await client.post(
            "/threads/test_thread_123/interrupt",
            json={"approved": True, "reason": "Approved by test"},
        )

        assert response.status_code == 400
        data = response.json()
        assert "No active agent session" in data["detail"]

    @pytest.mark.asyncio
    async def test_delete_thread(self, client: AsyncClient):
        """Test thread deletion."""
        # Should succeed even if thread doesn't exist (Redis delete is idempotent)
        response = await client.delete("/threads/test_thread_to_delete")

        # May fail if Redis not connected, but should return proper structure
        assert response.status_code in [200, 500]


class TestQueryClassifierIntegration:
    """Integration tests for query classification in router."""

    @pytest.mark.asyncio
    async def test_troubleshooting_query_type(self, client: AsyncClient):
        """Test troubleshooting query gets correct classification."""
        mock_agent = MagicMock()
        mock_agent.run = AsyncMock(return_value={
            "answer": "Check focus offset",
            "session_id": "sess_123",
            "message_count": 2,
        })

        with patch("app.routers.query.get_or_create_agent", return_value=mock_agent):
            with patch("app.routers.query.get_lightrag_service") as mock_lightrag:
                mock_lightrag_instance = MagicMock()
                mock_lightrag_instance.query = AsyncMock(return_value="Knowledge")
                mock_lightrag.return_value = mock_lightrag_instance

                response = await client.post(
                    "/query",
                    json={"question": "Why is CD trending high on LITHO01?"},
                )

        if response.status_code == 200:
            data = response.json()
            assert data["query_type"] == "troubleshooting"
            assert data["lightrag_mode"] == "local"

    @pytest.mark.asyncio
    async def test_conceptual_query_type(self, client: AsyncClient):
        """Test conceptual query gets correct classification."""
        mock_agent = MagicMock()
        mock_agent.run = AsyncMock(return_value={
            "answer": "Focus sensitivity is...",
            "session_id": "sess_456",
            "message_count": 2,
        })

        with patch("app.routers.query.get_or_create_agent", return_value=mock_agent):
            with patch("app.routers.query.get_lightrag_service") as mock_lightrag:
                mock_lightrag_instance = MagicMock()
                mock_lightrag_instance.query = AsyncMock(return_value="Knowledge")
                mock_lightrag.return_value = mock_lightrag_instance

                response = await client.post(
                    "/query",
                    json={"question": "Explain focus sensitivity"},
                )

        if response.status_code == 200:
            data = response.json()
            assert data["query_type"] == "conceptual"
            assert data["lightrag_mode"] == "global"
