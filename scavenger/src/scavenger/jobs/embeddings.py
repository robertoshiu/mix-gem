"""Embedding population jobs."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.db.models.alarm import Alarm
from scavenger.db.models.recipe import Recipe
from scavenger.search.embeddings import EmbeddingService


async def populate_alarm_embeddings(
    session: AsyncSession,
    embedding_service: EmbeddingService,
    batch_size: int = 100,
) -> int:
    """Populate embedding vectors for alarms without embeddings.

    Args:
        session: Database session
        embedding_service: OpenAI embedding service
        batch_size: Number of alarms to process per batch

    Returns:
        Number of alarms updated
    """
    # Find alarms without embeddings
    stmt = select(Alarm).where(Alarm.altx_embedding.is_(None))
    result = await session.execute(stmt)
    alarms = result.scalars().all()

    if not alarms:
        return 0

    # Generate embeddings in batches
    count = 0
    for i in range(0, len(alarms), batch_size):
        batch = alarms[i : i + batch_size]
        texts = [alarm.altx for alarm in batch]

        embeddings = await embedding_service.embed_batch(texts)

        for alarm, embedding in zip(batch, embeddings):
            alarm.altx_embedding = embedding
            count += 1

    await session.commit()
    return count


async def populate_recipe_embeddings(
    session: AsyncSession,
    embedding_service: EmbeddingService,
    batch_size: int = 100,
) -> int:
    """Populate embedding vectors for recipes without embeddings.

    Args:
        session: Database session
        embedding_service: OpenAI embedding service
        batch_size: Number of recipes to process per batch

    Returns:
        Number of recipes updated
    """
    # Find recipes without embeddings and with descriptions
    stmt = select(Recipe).where(
        Recipe.description_embedding.is_(None),
        Recipe.description.isnot(None),
    )
    result = await session.execute(stmt)
    recipes = result.scalars().all()

    if not recipes:
        return 0

    # Generate embeddings in batches
    count = 0
    for i in range(0, len(recipes), batch_size):
        batch = recipes[i : i + batch_size]
        texts = [recipe.description for recipe in batch]

        embeddings = await embedding_service.embed_batch(texts)

        for recipe, embedding in zip(batch, embeddings):
            recipe.description_embedding = embedding
            count += 1

    await session.commit()
    return count
