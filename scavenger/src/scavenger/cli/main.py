"""Scavenger CLI entry point."""
import click

from scavenger import __version__
from scavenger.cli.db import db
from scavenger.cli.embeddings import embeddings
from scavenger.cli.generate import generate
from scavenger.cli.serve import serve
from scavenger.cli.simulator import simulator


@click.group()
@click.version_option(version=__version__, prog_name="scavenger")
def cli() -> None:
    """Scavenger: Semiconductor equipment knowledge base with HSMS runtime."""
    pass


cli.add_command(db)
cli.add_command(embeddings)
cli.add_command(generate)
cli.add_command(serve)
cli.add_command(simulator)


@cli.command()
def info() -> None:
    """Show configuration info."""
    from scavenger.config import get_settings

    settings = get_settings()
    click.echo(f"Database: {settings.database_url.split('@')[-1]}")
    click.echo(f"HSMS Port: {settings.hsms_port}")
    click.echo(f"API Port: {settings.api_port}")


def main() -> None:
    """Main entry point."""
    cli()


if __name__ == "__main__":
    main()
