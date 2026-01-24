# rag-engine/tests/test_agent.py
"""Tests for LangGraph agent orchestrator."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


class MockAsyncPostgresSaver:
    """Mock AsyncPostgresSaver that passes isinstance checks for InMemorySaver."""

    def __init__(self, pool):
        self.pool = pool
        self._memory_saver = None

    async def setup(self):
        """Mock setup - no-op for testing."""
        pass

    # Delegate to InMemorySaver for actual checkpointing
    def __getattr__(self, name):
        if self._memory_saver is None:
            from langgraph.checkpoint.memory import InMemorySaver
            self._memory_saver = InMemorySaver()
        return getattr(self._memory_saver, name)


@pytest.mark.asyncio
async def test_agent_initialization():
    """Test agent initializes correctly with mocked checkpointer."""
    from langgraph.checkpoint.memory import InMemorySaver

    from app.core.agent import RAGAgentOrchestrator

    mock_pool = MagicMock()
    mock_lightrag = MagicMock()
    mock_redis = MagicMock()

    # Create a real InMemorySaver with setup method added
    real_saver = InMemorySaver()
    real_saver.setup = AsyncMock()  # Add setup method

    # Patch AsyncPostgresSaver to return our patched saver
    with patch("app.core.agent.AsyncPostgresSaver") as mock_checkpointer_class:
        mock_checkpointer_class.return_value = real_saver

        orchestrator = RAGAgentOrchestrator(mock_pool, mock_lightrag, mock_redis)

        # Patch ChatAnthropic to avoid real API calls
        with patch("app.core.agent.ChatAnthropic") as mock_llm_class:
            mock_llm = MagicMock()
            mock_llm.bind_tools.return_value = mock_llm
            mock_llm_class.return_value = mock_llm

            await orchestrator.initialize()

            # Verify AsyncPostgresSaver was instantiated with the pool
            mock_checkpointer_class.assert_called_once_with(mock_pool)

            # Verify setup was called
            real_saver.setup.assert_called_once()

            # Verify graph was built
            assert orchestrator._graph is not None


@pytest.mark.asyncio
async def test_resolve_lightrag_query():
    """Test LightRAG marker resolution."""
    from app.core.agent import RAGAgentOrchestrator

    mock_pool = MagicMock()
    mock_lightrag = MagicMock()
    mock_lightrag.query = AsyncMock(return_value="LightRAG result")
    mock_redis = MagicMock()

    orchestrator = RAGAgentOrchestrator(mock_pool, mock_lightrag, mock_redis)

    result = await orchestrator._resolve_tool_result(
        "__LIGHTRAG_QUERY__|hybrid|test query",
        "search_knowledge",
        {"query": "test query"},
    )

    assert result == "LightRAG result"
    mock_lightrag.query.assert_called_once_with("test query", mode="hybrid")


@pytest.mark.asyncio
async def test_resolve_redis_equipment():
    """Test Redis equipment state marker resolution."""
    from app.core.agent import RAGAgentOrchestrator

    mock_pool = MagicMock()
    mock_lightrag = MagicMock()
    mock_redis = MagicMock()
    mock_redis.hgetall = AsyncMock(return_value={
        b"focus_offset": b"10",
        b"dose": b"25.5",
        b"status": b"running",
    })

    orchestrator = RAGAgentOrchestrator(mock_pool, mock_lightrag, mock_redis)

    result = await orchestrator._resolve_tool_result(
        "__REDIS_EQUIPMENT__|LITHO01",
        "get_equipment_state",
        {"tool_id": "LITHO01"},
    )

    assert "focus_offset" in result
    assert "10" in result
    mock_redis.hgetall.assert_called_once_with("equipment:state:LITHO01")


@pytest.mark.asyncio
async def test_resolve_log_insight():
    """Test insight logging marker resolution."""
    from app.core.agent import RAGAgentOrchestrator

    mock_pool = MagicMock()
    mock_lightrag = MagicMock()
    mock_redis = MagicMock()

    orchestrator = RAGAgentOrchestrator(mock_pool, mock_lightrag, mock_redis)

    result = await orchestrator._resolve_tool_result(
        "__LOG_INSIGHT__|diagnosis|Focus drift detected on LITHO01 due to thermal instability",
        "log_insight",
        {"insight": "Focus drift detected", "category": "diagnosis"},
    )

    assert "Insight logged" in result
    assert "diagnosis" in result
