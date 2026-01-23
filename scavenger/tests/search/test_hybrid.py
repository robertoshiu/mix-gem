import pytest
from scavenger.search.hybrid import reciprocal_rank_fusion, HybridSearchResult


def test_rrf_combines_rankings():
    """RRF combines keyword and semantic rankings."""
    keyword_ids = [1, 2, 3, 4, 5]
    semantic_ids = [3, 1, 6, 2, 7]

    results = reciprocal_rank_fusion(
        keyword_ids=keyword_ids,
        semantic_ids=semantic_ids,
        keyword_weight=0.4,
        semantic_weight=0.6,
        k=60,
    )

    result_ids = [r.id for r in results]
    assert 1 in result_ids[:3]
    assert 3 in result_ids[:3]


def test_rrf_respects_weights():
    """RRF respects weight configuration."""
    keyword_ids = [1, 2, 3]
    semantic_ids = [4, 5, 6]

    results = reciprocal_rank_fusion(
        keyword_ids=keyword_ids,
        semantic_ids=semantic_ids,
        keyword_weight=0.1,
        semantic_weight=0.9,
        k=60,
    )

    top_3 = [r.id for r in results[:3]]
    assert 4 in top_3


def test_hybrid_search_result_dataclass():
    """HybridSearchResult holds combined scores."""
    result = HybridSearchResult(
        id=1,
        keyword_rank=2,
        semantic_rank=1,
        rrf_score=0.032,
    )
    assert result.id == 1
    assert result.rrf_score == 0.032
