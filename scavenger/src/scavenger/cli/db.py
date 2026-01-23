"""Database management CLI commands."""
import asyncio
import click


@click.group()
def db() -> None:
    """Database management commands."""
    pass


@db.command()
def init() -> None:
    """Initialize database tables (development only)."""
    from scavenger.db.session import init_db

    click.echo("Initializing database tables...")
    asyncio.run(init_db())
    click.echo("Done.")


@db.command()
@click.option("--message", "-m", required=True, help="Migration message")
def migrate(message: str) -> None:
    """Create a new Alembic migration."""
    import subprocess

    result = subprocess.run(
        ["alembic", "revision", "--autogenerate", "-m", message],
        capture_output=True,
        text=True,
    )
    click.echo(result.stdout)
    if result.returncode != 0:
        click.echo(result.stderr, err=True)
        raise SystemExit(result.returncode)


@db.command()
def upgrade() -> None:
    """Apply pending migrations."""
    import subprocess

    result = subprocess.run(
        ["alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    click.echo(result.stdout)
    if result.returncode != 0:
        click.echo(result.stderr, err=True)
        raise SystemExit(result.returncode)
