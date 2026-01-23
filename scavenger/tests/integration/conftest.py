"""Integration fixtures using testcontainers."""
import os
import shutil

import pytest
import pytest_asyncio
import docker
from testcontainers.postgres import PostgresContainer

from scavenger.db.session import close_db, init_db


def _docker_available() -> bool:
    if shutil.which("docker") is None:
        return False
    try:
        client = docker.from_env()
        client.ping()
    except Exception:
        return False
    return True


@pytest.fixture(scope="session")
def postgres_container():
    """Start a Postgres container for integration tests."""
    if not _docker_available():
        pytest.skip("Docker daemon is not available")
    with PostgresContainer("pgvector/pgvector:pg17") as postgres:
        yield postgres


@pytest_asyncio.fixture(scope="session")
async def initialized_db(postgres_container):
    """Initialize database schema in the container."""
    database_url = postgres_container.get_connection_url().replace(
        "postgresql://",
        "postgresql+asyncpg://",
    )
    os.environ["DATABASE_URL"] = database_url

    await close_db()
    await init_db()

    yield database_url

    await close_db()
    os.environ.pop("DATABASE_URL", None)
