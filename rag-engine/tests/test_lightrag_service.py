# rag-engine/tests/test_lightrag_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.mark.asyncio
async def test_lightrag_service_query_modes():
    """Test that LightRAG service supports all query modes."""
    from app.services.lightrag_service import LightRAGService

    with patch.object(LightRAGService, "initialize", new_callable=AsyncMock):
        service = LightRAGService()

        # Mock the internal rag
        mock_rag = MagicMock()
        mock_rag.aquery = AsyncMock(return_value="Test result")
        service._rag = mock_rag
        service._initialized = True

        # Test hybrid mode
        result = await service.query("test query", mode="hybrid")
        assert result == "Test result"

        # Verify query params
        mock_rag.aquery.assert_called_once()
        call_args = mock_rag.aquery.call_args
        assert call_args[1]["param"].mode == "hybrid"


@pytest.mark.asyncio
async def test_lightrag_service_insert():
    """Test document insertion."""
    from app.services.lightrag_service import LightRAGService

    with patch.object(LightRAGService, "initialize", new_callable=AsyncMock):
        service = LightRAGService()

        mock_rag = MagicMock()
        mock_rag.ainsert = AsyncMock()
        service._rag = mock_rag
        service._initialized = True

        await service.insert("Test document")
        mock_rag.ainsert.assert_called_once_with("Test document")
