"""API server CLI command."""
import click
import uvicorn

from scavenger.config import get_settings


@click.command()
@click.option("--host", default=None, help="Host to bind")
@click.option("--port", type=int, default=None, help="Port to bind")
@click.option("--reload/--no-reload", default=False, help="Enable auto-reload")
def serve(host: str | None, port: int | None, reload: bool) -> None:
    """Run the FastAPI server."""
    settings = get_settings()
    uvicorn.run(
        "scavenger.api.main:app",
        host=host or settings.api_host,
        port=port or settings.api_port,
        reload=reload,
    )
