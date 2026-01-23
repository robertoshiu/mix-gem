"""Tests for embedding population jobs."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from scavenger.jobs.embeddings import populate_alarm_embeddings, populate_recipe_embeddings


@pytest.mark.asyncio
async def test_populate_alarm_embeddings():
    """populate_alarm_embeddings updates alarm embedding vectors."""
    # Mock database session
    mock_session = AsyncMock()
    mock_alarm1 = MagicMock(id=1, altx="Vacuum pressure low", altx_embedding=None)
    mock_alarm2 = MagicMock(id=2, altx="Temperature high", altx_embedding=None)

    # Mock query result - scalars().all() is synchronous after await execute()
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_alarm1, mock_alarm2]
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_session.execute = AsyncMock(return_value=mock_result)

    # Mock embedding service
    mock_embedding_service = AsyncMock()
    mock_embedding_service.embed_batch.return_value = [
        [0.1] * 1536,  # Embedding for alarm 1
        [0.2] * 1536,  # Embedding for alarm 2
    ]

    # Run function
    count = await populate_alarm_embeddings(mock_session, mock_embedding_service)

    # Verify
    assert count == 2
    assert mock_alarm1.altx_embedding == [0.1] * 1536
    assert mock_alarm2.altx_embedding == [0.2] * 1536
    assert mock_session.commit.called


@pytest.mark.asyncio
async def test_populate_alarm_embeddings_empty():
    """populate_alarm_embeddings handles no alarms gracefully."""
    mock_session = AsyncMock()

    # Mock empty result
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = []
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_session.execute = AsyncMock(return_value=mock_result)

    mock_embedding_service = AsyncMock()

    count = await populate_alarm_embeddings(mock_session, mock_embedding_service)

    assert count == 0
    assert not mock_embedding_service.embed_batch.called
    assert not mock_session.commit.called


@pytest.mark.asyncio
async def test_populate_recipe_embeddings():
    """populate_recipe_embeddings updates recipe embedding vectors."""
    mock_session = AsyncMock()
    mock_recipe = MagicMock(id=1, description="Litho exposure step", description_embedding=None)

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = [mock_recipe]
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_session.execute = AsyncMock(return_value=mock_result)

    mock_embedding_service = AsyncMock()
    mock_embedding_service.embed_batch.return_value = [[0.3] * 1536]

    count = await populate_recipe_embeddings(mock_session, mock_embedding_service)

    assert count == 1
    assert mock_recipe.description_embedding == [0.3] * 1536
    assert mock_session.commit.called


@pytest.mark.asyncio
async def test_populate_recipe_embeddings_empty():
    """populate_recipe_embeddings handles no recipes gracefully."""
    mock_session = AsyncMock()

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = []
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_session.execute = AsyncMock(return_value=mock_result)

    mock_embedding_service = AsyncMock()

    count = await populate_recipe_embeddings(mock_session, mock_embedding_service)

    assert count == 0
    assert not mock_embedding_service.embed_batch.called
    assert not mock_session.commit.called


@pytest.mark.asyncio
async def test_populate_alarm_embeddings_batch_processing():
    """populate_alarm_embeddings processes in batches."""
    mock_session = AsyncMock()

    # Create 250 mock alarms to test batching (batch_size=100)
    mock_alarms = [
        MagicMock(id=i, altx=f"Alarm {i}", altx_embedding=None)
        for i in range(250)
    ]

    mock_scalars = MagicMock()
    mock_scalars.all.return_value = mock_alarms
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_session.execute = AsyncMock(return_value=mock_result)

    # Mock embedding service to track batch calls
    mock_embedding_service = AsyncMock()
    mock_embedding_service.embed_batch.side_effect = [
        [[0.1] * 1536] * 100,  # First batch
        [[0.2] * 1536] * 100,  # Second batch
        [[0.3] * 1536] * 50,   # Third batch
    ]

    count = await populate_alarm_embeddings(mock_session, mock_embedding_service, batch_size=100)

    assert count == 250
    assert mock_embedding_service.embed_batch.call_count == 3
    assert mock_session.commit.called
