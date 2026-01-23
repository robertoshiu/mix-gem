"""Alarm search with hybrid RRF."""
from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.db.models.alarm import Alarm
from scavenger.search.embeddings import EmbeddingService
from scavenger.search.hybrid import reciprocal_rank_fusion


@dataclass
class AlarmSearchQuery:
    """Search query parameters."""

    text: str
    vendor: str | None = None
    process_type: str | None = None
    limit: int = 20
    keyword_weight: float = 0.4
    semantic_weight: float = 0.6


@dataclass
class AlarmSearchResult:
    """Alarm search result with scores."""

    alarm: Alarm
    rrf_score: float
    keyword_rank: int | None = None
    semantic_rank: int | None = None


class AlarmSearcher:
    """Hybrid search for alarms."""

    def __init__(
        self,
        session: AsyncSession,
        embedding_service: EmbeddingService,
    ):
        self._session = session
        self._embedding_service = embedding_service

    async def search(
        self,
        query: AlarmSearchQuery,
    ) -> list[AlarmSearchResult]:
        """Execute hybrid search."""
        keyword_ids = await self._keyword_search(query)
        semantic_ids = await self._semantic_search(query)

        rrf_results = reciprocal_rank_fusion(
            keyword_ids=keyword_ids,
            semantic_ids=semantic_ids,
            keyword_weight=query.keyword_weight,
            semantic_weight=query.semantic_weight,
        )

        top_ids = [r.id for r in rrf_results[: query.limit]]
        if not top_ids:
            return []

        alarms_query = select(Alarm).where(Alarm.id.in_(top_ids))
        result = await self._session.execute(alarms_query)
        alarms_by_id = {a.id: a for a in result.scalars()}

        return [
            AlarmSearchResult(
                alarm=alarms_by_id[r.id],
                rrf_score=r.rrf_score,
                keyword_rank=r.keyword_rank,
                semantic_rank=r.semantic_rank,
            )
            for r in rrf_results[: query.limit]
            if r.id in alarms_by_id
        ]

    async def _keyword_search(self, query: AlarmSearchQuery) -> list[int]:
        """Full-text search using tsvector."""
        stmt = (
            select(Alarm.id)
            .where(
                Alarm.altx_tsv.op("@@")(
                    func.websearch_to_tsquery("english", query.text)
                )
            )
            .order_by(
                func.ts_rank(
                    Alarm.altx_tsv,
                    func.websearch_to_tsquery("english", query.text),
                ).desc()
            )
            .limit(query.limit * 2)
        )

        result = await self._session.execute(stmt)
        return list(result.scalars())

    async def _semantic_search(self, query: AlarmSearchQuery) -> list[int]:
        """Vector similarity search."""
        query_embedding = await self._embedding_service.embed_text(query.text)

        stmt = (
            select(Alarm.id)
            .where(Alarm.altx_embedding.isnot(None))
            .order_by(Alarm.altx_embedding.cosine_distance(query_embedding))
            .limit(query.limit * 2)
        )

        result = await self._session.execute(stmt)
        return list(result.scalars())
