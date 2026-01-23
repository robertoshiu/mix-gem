import pytest
from unittest.mock import AsyncMock, patch
from scavenger.search.embeddings import EmbeddingService


@pytest.fixture
def embedding_service():
    return EmbeddingService(api_key="test-key", model="text-embedding-3-small")


def test_embedding_service_init(embedding_service):
    """EmbeddingService initializes with model config."""
    assert embedding_service.model == "text-embedding-3-small"
    assert embedding_service.dimensions == 1536


@pytest.mark.asyncio
async def test_embed_text_returns_vector(embedding_service):
    """embed_text returns vector of correct dimensions."""
    mock_response = AsyncMock()
    mock_response.data = [AsyncMock(embedding=[0.1] * 1536)]

    with patch.object(embedding_service._client.embeddings, "create", return_value=mock_response):
        result = await embedding_service.embed_text("test text")

    assert len(result) == 1536


@pytest.mark.asyncio
async def test_embed_batch_returns_vectors(embedding_service):
    """embed_batch returns list of vectors."""
    mock_response = AsyncMock()
    mock_response.data = [
        AsyncMock(embedding=[0.1] * 1536),
        AsyncMock(embedding=[0.2] * 1536),
    ]

    with patch.object(embedding_service._client.embeddings, "create", return_value=mock_response):
        result = await embedding_service.embed_batch(["text1", "text2"])

    assert len(result) == 2
