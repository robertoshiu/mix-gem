"""Embedding management CLI commands."""
import asyncio
import click

from scavenger.config import get_settings
from scavenger.db.session import get_session
from scavenger.jobs.embeddings import populate_alarm_embeddings, populate_recipe_embeddings
from scavenger.search.embeddings import EmbeddingService


@click.group()
def embeddings() -> None:
    """Embedding management commands."""
    pass


@embeddings.command()
@click.option("--batch-size", default=100, help="Batch size for processing")
@click.option("--alarms-only", is_flag=True, help="Only populate alarm embeddings")
@click.option("--recipes-only", is_flag=True, help="Only populate recipe embeddings")
def populate(batch_size: int, alarms_only: bool, recipes_only: bool) -> None:
    """Generate and populate embedding vectors."""
    settings = get_settings()

    # Validate API key
    if not settings.openai_api_key.get_secret_value():
        click.echo("Error: OPENAI_API_KEY environment variable not set", err=True)
        raise SystemExit(1)

    embedding_service = EmbeddingService(
        api_key=settings.openai_api_key.get_secret_value(),
        model=settings.embedding_model,
    )

    async def run():
        async with get_session() as session:
            if not recipes_only:
                click.echo("Populating alarm embeddings...")
                alarm_count = await populate_alarm_embeddings(
                    session, embedding_service, batch_size
                )
                click.echo(f"Updated {alarm_count} alarms")

            if not alarms_only:
                click.echo("Populating recipe embeddings...")
                recipe_count = await populate_recipe_embeddings(
                    session, embedding_service, batch_size
                )
                click.echo(f"Updated {recipe_count} recipes")

        click.echo("Done.")

    asyncio.run(run())
