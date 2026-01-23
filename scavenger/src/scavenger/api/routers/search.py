"""Search API router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.api.schemas.search import (
    AlarmResult,
    AlarmSearchRequest,
    AlarmSearchResponse,
)
from scavenger.config import get_settings
from scavenger.db.session import get_session
from scavenger.search.alarm_search import AlarmSearchQuery, AlarmSearcher
from scavenger.search.embeddings import EmbeddingService

router = APIRouter(prefix="/search", tags=["search"])


async def get_db_session():
    """Dependency for database session."""
    async with get_session() as session:
        yield session


@router.post("/alarms", response_model=AlarmSearchResponse)
async def search_alarms(
    request: AlarmSearchRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Hybrid search for equipment alarms."""
    settings = get_settings()

    if not settings.openai_api_key.get_secret_value():
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured",
        )

    embedding_service = EmbeddingService(
        api_key=settings.openai_api_key.get_secret_value(),
        model=settings.embedding_model,
    )

    searcher = AlarmSearcher(session=session, embedding_service=embedding_service)

    query = AlarmSearchQuery(
        text=request.query,
        vendor=request.vendor,
        process_type=request.process_type,
        limit=request.limit,
        keyword_weight=request.rrf_weights.keyword,
        semantic_weight=request.rrf_weights.semantic,
    )

    results = await searcher.search(query)

    return AlarmSearchResponse(
        results=[
            AlarmResult(
                id=r.alarm.id,
                alid=r.alarm.alid,
                alcd=r.alarm.alcd.value,
                altx=r.alarm.altx,
                module_name=r.alarm.module_name,
                severity=r.alarm.severity,
                probable_causes=r.alarm.probable_causes,
                rrf_score=r.rrf_score,
                keyword_rank=r.keyword_rank,
                semantic_rank=r.semantic_rank,
            )
            for r in results
        ],
        total=len(results),
        query=request.query,
    )
