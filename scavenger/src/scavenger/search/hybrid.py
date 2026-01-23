"""Reciprocal Rank Fusion for hybrid search."""
from dataclasses import dataclass


@dataclass
class HybridSearchResult:
    """Result with combined RRF score."""

    id: int
    keyword_rank: int | None
    semantic_rank: int | None
    rrf_score: float


def reciprocal_rank_fusion(
    keyword_ids: list[int],
    semantic_ids: list[int],
    keyword_weight: float = 0.4,
    semantic_weight: float = 0.6,
    k: int = 60,
) -> list[HybridSearchResult]:
    """
    Combine keyword and semantic search results using RRF.

    RRF formula: score = weight / (k + rank)
    """
    scores: dict[int, HybridSearchResult] = {}

    for rank, doc_id in enumerate(keyword_ids, start=1):
        score = keyword_weight / (k + rank)
        if doc_id not in scores:
            scores[doc_id] = HybridSearchResult(
                id=doc_id,
                keyword_rank=rank,
                semantic_rank=None,
                rrf_score=0.0,
            )
        scores[doc_id].keyword_rank = rank
        scores[doc_id].rrf_score += score

    for rank, doc_id in enumerate(semantic_ids, start=1):
        score = semantic_weight / (k + rank)
        if doc_id not in scores:
            scores[doc_id] = HybridSearchResult(
                id=doc_id,
                keyword_rank=None,
                semantic_rank=rank,
                rrf_score=0.0,
            )
        scores[doc_id].semantic_rank = rank
        scores[doc_id].rrf_score += score

    return sorted(scores.values(), key=lambda x: x.rrf_score, reverse=True)
