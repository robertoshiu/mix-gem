# rag-engine/tests/test_integration.py
"""
Integration tests - require running services.
Run with: RUN_INTEGRATION_TESTS=1 pytest tests/test_integration.py -v

Prerequisites:
- PostgreSQL running on localhost:5432
- Redis running on localhost:6379
- Ollama running on localhost:11434 with snowflake-arctic-embed2 model
- ANTHROPIC_API_KEY environment variable set
"""
import os

import pytest

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_INTEGRATION_TESTS") != "1",
    reason="Set RUN_INTEGRATION_TESTS=1 to run integration tests",
)


@pytest.mark.asyncio
async def test_health_check():
    """Test health endpoints."""
    import httpx

    async with httpx.AsyncClient(base_url="http://localhost:8001") as client:
        # Liveness
        response = await client.get("/health/live")
        assert response.status_code == 200
        assert response.json()["status"] == "alive"

        # Startup
        response = await client.get("/health/startup")
        assert response.status_code in [200, 503]

        # Readiness
        response = await client.get("/health/ready")
        assert response.status_code in [200, 503]  # May be degraded if LightRAG not init
        data = response.json()
        assert "components" in data
        assert "version" in data


@pytest.mark.asyncio
async def test_query_endpoint():
    """Test query with LangGraph agent."""
    import httpx

    async with httpx.AsyncClient(base_url="http://localhost:8001", timeout=60.0) as client:
        response = await client.post(
            "/query",
            json={
                "question": "What is focus sensitivity in lithography?",
                "tool_id": "LITHO01",
            },
        )

        assert response.status_code == 200
        data = response.json()

        assert "answer" in data
        assert "session_id" in data
        assert "query_type" in data
        assert "lightrag_mode" in data
        assert len(data["answer"]) > 0


@pytest.mark.asyncio
async def test_query_classification():
    """Test that query classification works correctly."""
    import httpx

    async with httpx.AsyncClient(base_url="http://localhost:8001", timeout=60.0) as client:
        # Troubleshooting query
        response = await client.post(
            "/query",
            json={"question": "Why is CD trending high on LITHO01?"},
        )
        assert response.status_code == 200
        assert response.json()["query_type"] == "troubleshooting"
        assert response.json()["lightrag_mode"] == "local"

        # Conceptual query
        response = await client.post(
            "/query",
            json={"question": "Explain the relationship between dose and CD"},
        )
        assert response.status_code == 200
        assert response.json()["query_type"] == "conceptual"
        assert response.json()["lightrag_mode"] == "global"


@pytest.mark.asyncio
async def test_conversation_continuity():
    """Test that session_id maintains conversation context."""
    import httpx

    async with httpx.AsyncClient(base_url="http://localhost:8001", timeout=60.0) as client:
        # First query
        response1 = await client.post(
            "/query",
            json={"question": "What affects CD in lithography?"},
        )
        assert response1.status_code == 200
        session_id = response1.json()["session_id"]
        assert session_id.startswith("sess_")

        # Follow-up with same session
        response2 = await client.post(
            "/query",
            json={
                "question": "How can we control it?",
                "session_id": session_id,
            },
        )
        assert response2.status_code == 200
        assert response2.json()["session_id"] == session_id


@pytest.mark.asyncio
async def test_thread_state():
    """Test thread state endpoint."""
    import httpx

    async with httpx.AsyncClient(base_url="http://localhost:8001") as client:
        response = await client.get("/threads/test_thread_123/state")
        assert response.status_code == 200
        data = response.json()
        assert data["thread_id"] == "test_thread_123"
        assert "status" in data


@pytest.mark.asyncio
async def test_streaming_endpoint():
    """Test streaming query endpoint."""
    import httpx

    async with httpx.AsyncClient(base_url="http://localhost:8001", timeout=120.0) as client:
        async with client.stream(
            "POST",
            "/query/stream",
            json={"question": "What is overlay in lithography?"},
        ) as response:
            assert response.status_code == 200
            assert response.headers.get("content-type") == "text/event-stream; charset=utf-8"

            chunks = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    chunks.append(line[6:])  # Remove "data: " prefix

            # Should have at least one chunk plus [DONE]
            assert len(chunks) >= 2
            assert chunks[-1] == "[DONE]"
