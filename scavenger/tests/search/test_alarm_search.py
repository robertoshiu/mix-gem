import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from scavenger.search.alarm_search import (
    AlarmSearchQuery,
    AlarmSearchResult,
    AlarmSearcher,
)
from scavenger.db.models.alarm import Alarm, AlarmCategory, DataLayer


def test_alarm_search_query_dataclass():
    """AlarmSearchQuery validates input."""
    query = AlarmSearchQuery(
        text="vacuum pressure low",
        vendor="ASML",
        process_type="litho",
        limit=20,
        keyword_weight=0.4,
        semantic_weight=0.6,
    )
    assert query.text == "vacuum pressure low"
    assert query.limit == 20


def test_alarm_search_query_defaults():
    """AlarmSearchQuery has sensible defaults."""
    query = AlarmSearchQuery(text="test query")
    assert query.vendor is None
    assert query.process_type is None
    assert query.limit == 20
    assert query.keyword_weight == 0.4
    assert query.semantic_weight == 0.6


def test_alarm_searcher_init():
    """AlarmSearcher initializes with embedding service."""
    mock_embedding = MagicMock()
    searcher = AlarmSearcher(session=MagicMock(), embedding_service=mock_embedding)
    assert searcher._embedding_service == mock_embedding


@pytest.mark.asyncio
async def test_alarm_searcher_search_empty_results():
    """AlarmSearcher returns empty list when no results."""
    mock_session = AsyncMock()
    mock_embedding = AsyncMock()

    # Mock keyword and semantic search to return empty lists
    searcher = AlarmSearcher(session=mock_session, embedding_service=mock_embedding)

    with patch.object(searcher, "_keyword_search", return_value=[]), patch.object(
        searcher, "_semantic_search", return_value=[]
    ):
        query = AlarmSearchQuery(text="nonexistent alarm")
        results = await searcher.search(query)

    assert results == []


@pytest.mark.asyncio
async def test_alarm_searcher_search_with_results():
    """AlarmSearcher combines keyword and semantic results."""
    mock_session = AsyncMock()
    mock_embedding = AsyncMock()

    # Create mock alarms
    alarm1 = Alarm(
        id=1,
        alid=101,
        alcd=AlarmCategory.PARAMETER_LIMIT,
        altx="Vacuum pressure too low",
        data_layer=DataLayer.SCHEMA_ONLY,
    )
    alarm2 = Alarm(
        id=2,
        alid=102,
        alcd=AlarmCategory.EQUIPMENT_SAFETY,
        altx="Temperature exceeded limit",
        data_layer=DataLayer.SCHEMA_ONLY,
    )

    # Mock database query - scalars() is not async, but returns an iterable
    mock_scalars = MagicMock()
    mock_scalars.__iter__ = MagicMock(return_value=iter([alarm1, alarm2]))
    mock_result = AsyncMock()
    mock_result.scalars = MagicMock(return_value=mock_scalars)
    mock_session.execute.return_value = mock_result

    searcher = AlarmSearcher(session=mock_session, embedding_service=mock_embedding)

    with patch.object(searcher, "_keyword_search", return_value=[1, 2]), patch.object(
        searcher, "_semantic_search", return_value=[2, 1]
    ):
        query = AlarmSearchQuery(text="pressure")
        results = await searcher.search(query)

    assert len(results) == 2
    assert isinstance(results[0], AlarmSearchResult)
    assert results[0].alarm.id in [1, 2]
    assert results[0].rrf_score > 0


@pytest.mark.asyncio
async def test_alarm_searcher_keyword_search():
    """AlarmSearcher performs keyword search with tsvector."""
    mock_session = AsyncMock()
    mock_embedding = AsyncMock()

    # Mock database query result - scalars() returns an iterable, not async
    mock_scalars = MagicMock()
    mock_scalars.__iter__ = MagicMock(return_value=iter([1, 2, 3]))
    mock_result = AsyncMock()
    mock_result.scalars = MagicMock(return_value=mock_scalars)
    mock_session.execute.return_value = mock_result

    searcher = AlarmSearcher(session=mock_session, embedding_service=mock_embedding)
    query = AlarmSearchQuery(text="vacuum pressure")

    result_ids = await searcher._keyword_search(query)

    assert result_ids == [1, 2, 3]
    mock_session.execute.assert_called_once()


@pytest.mark.asyncio
async def test_alarm_searcher_semantic_search():
    """AlarmSearcher performs semantic search with embeddings."""
    mock_session = AsyncMock()
    mock_embedding = AsyncMock()
    mock_embedding.embed_text.return_value = [0.1] * 1536

    # Mock database query result - scalars() returns an iterable, not async
    mock_scalars = MagicMock()
    mock_scalars.__iter__ = MagicMock(return_value=iter([3, 1, 2]))
    mock_result = AsyncMock()
    mock_result.scalars = MagicMock(return_value=mock_scalars)
    mock_session.execute.return_value = mock_result

    searcher = AlarmSearcher(session=mock_session, embedding_service=mock_embedding)
    query = AlarmSearchQuery(text="vacuum pressure")

    result_ids = await searcher._semantic_search(query)

    assert result_ids == [3, 1, 2]
    mock_embedding.embed_text.assert_called_once_with("vacuum pressure")
    mock_session.execute.assert_called_once()
