"""Fixtures for recorder service tests."""
import os
import shutil

import docker
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from testcontainers.postgres import PostgresContainer

from scavenger.db.base import Base
from scavenger.db.session import close_db, init_db, get_session


def _docker_available() -> bool:
    """Check if Docker is available."""
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
    """Start a Postgres container for recorder tests."""
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


# Alternative SQLite-based fixtures for when Docker is not available
@pytest_asyncio.fixture(scope="session")
async def sqlite_engine():
    """Create an in-memory SQLite engine for testing."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest_asyncio.fixture
async def sqlite_session(sqlite_engine):
    """Provide a SQLite session for testing (fallback when Docker unavailable)."""
    session_factory = async_sessionmaker(
        bind=sqlite_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
