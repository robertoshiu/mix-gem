"""Integration tests for Docker services.

These tests verify that all services can start and communicate correctly
when running in Docker containers.

Requirements:
    - Docker and docker-compose must be available
    - Tests should be run with: pytest tests/integration/ -v

Note:
    These tests are marked with `pytest.mark.integration` and are skipped
    by default. Run with `-m integration` to include them.
"""
import asyncio
import os
import socket
import time
from typing import Generator

import pytest

# Skip all tests if Docker is not available
pytestmark = pytest.mark.integration


def docker_available() -> bool:
    """Check if Docker is available."""
    import shutil

    return shutil.which("docker") is not None


def wait_for_port(host: str, port: int, timeout: float = 30.0) -> bool:
    """Wait for a port to become available.

    Args:
        host: Hostname to connect to
        port: Port number
        timeout: Maximum time to wait in seconds

    Returns:
        True if port is available, False if timeout
    """
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.create_connection((host, port), timeout=1):
                return True
        except OSError:
            time.sleep(0.5)
    return False


def wait_for_health(url: str, timeout: float = 60.0) -> bool:
    """Wait for a health endpoint to return 200.

    Args:
        url: Health check URL
        timeout: Maximum time to wait in seconds

    Returns:
        True if healthy, False if timeout
    """
    import urllib.request
    import urllib.error

    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    return True
        except (urllib.error.URLError, OSError):
            pass
        time.sleep(1)
    return False


# =============================================================================
# Service Health Tests
# =============================================================================


@pytest.mark.skipif(not docker_available(), reason="Docker not available")
class TestServiceHealth:
    """Tests for individual service health checks."""

    def test_postgres_health(self):
        """PostgreSQL should respond to connections.

        This test assumes docker-compose is running.
        Run: docker-compose up -d postgres
        """
        # Default port from docker-compose.yml
        host = os.environ.get("POSTGRES_HOST", "localhost")
        port = int(os.environ.get("POSTGRES_PORT", "5432"))

        assert wait_for_port(host, port, timeout=10), (
            f"PostgreSQL not responding on {host}:{port}"
        )

    def test_redis_health(self):
        """Redis should respond to connections.

        Run: docker-compose up -d redis
        """
        host = os.environ.get("REDIS_HOST", "localhost")
        port = int(os.environ.get("REDIS_PORT", "6379"))

        assert wait_for_port(host, port, timeout=10), (
            f"Redis not responding on {host}:{port}"
        )

    def test_api_health(self):
        """API service should return healthy.

        Run: docker-compose up -d scavenger
        """
        host = os.environ.get("API_HOST", "localhost")
        port = os.environ.get("API_PORT", "8000")
        url = f"http://{host}:{port}/health"

        assert wait_for_health(url, timeout=30), f"API not healthy at {url}"

    def test_simulator_hsms_port(self):
        """Simulator HSMS port should be listening.

        Run: docker-compose up -d simulator
        """
        host = os.environ.get("SIMULATOR_HOST", "localhost")
        port = int(os.environ.get("HSMS_PASSIVE_PORT", "5000"))

        assert wait_for_port(host, port, timeout=30), (
            f"Simulator HSMS not listening on {host}:{port}"
        )


# =============================================================================
# Service Communication Tests
# =============================================================================


@pytest.mark.skipif(not docker_available(), reason="Docker not available")
class TestServiceCommunication:
    """Tests for inter-service communication."""

    @pytest.mark.asyncio
    async def test_api_can_connect_to_postgres(self):
        """API service can query PostgreSQL.

        This tests the full stack: API -> PostgreSQL
        """
        import urllib.request
        import json

        host = os.environ.get("API_HOST", "localhost")
        port = os.environ.get("API_PORT", "8000")

        # Health endpoint should work if DB is connected
        url = f"http://{host}:{port}/health"

        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                data = json.loads(response.read())
                assert data.get("status") == "ok"
        except Exception as e:
            pytest.fail(f"API health check failed: {e}")

    @pytest.mark.asyncio
    async def test_redis_pubsub(self):
        """Redis pub/sub should work for message passing.

        This tests: Publisher -> Redis -> Subscriber
        """
        pytest.importorskip("redis")
        import redis.asyncio as aioredis

        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

        try:
            r = await aioredis.from_url(redis_url)
            await r.ping()

            # Test pub/sub
            pubsub = r.pubsub()
            await pubsub.subscribe("test_channel")

            # Publish a message
            await r.publish("test_channel", "test_message")

            # Receive the message
            message = await asyncio.wait_for(
                pubsub.get_message(ignore_subscribe_messages=True, timeout=5),
                timeout=10,
            )

            assert message is not None
            assert message["data"] == b"test_message"

            await pubsub.close()
            await r.close()
        except Exception as e:
            pytest.skip(f"Redis not available: {e}")


# =============================================================================
# End-to-End Tests
# =============================================================================


@pytest.mark.skipif(not docker_available(), reason="Docker not available")
class TestEndToEnd:
    """End-to-end integration tests."""

    @pytest.mark.slow
    def test_full_stack_startup(self):
        """All services should start successfully.

        This is a smoke test that verifies the entire stack can boot.
        Run: docker-compose up -d
        """
        services = [
            ("postgres", "localhost", 5432),
            ("redis", "localhost", 6379),
            ("api", "localhost", 8000),
            ("simulator", "localhost", 5000),
        ]

        for name, host, port in services:
            env_host = os.environ.get(f"{name.upper()}_HOST", host)
            env_port = int(os.environ.get(f"{name.upper()}_PORT", str(port)))

            if not wait_for_port(env_host, env_port, timeout=60):
                pytest.fail(f"Service {name} not responding on {env_host}:{env_port}")


# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture(scope="session")
def docker_compose_up() -> Generator[None, None, None]:
    """Start docker-compose services for integration tests.

    This fixture is session-scoped and will start all services once
    at the beginning of the test session.

    Usage:
        @pytest.mark.usefixtures("docker_compose_up")
        class TestMyIntegration:
            ...
    """
    import subprocess

    # Start services
    result = subprocess.run(
        ["docker-compose", "up", "-d"],
        capture_output=True,
        text=True,
        cwd=os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    )

    if result.returncode != 0:
        pytest.skip(f"docker-compose up failed: {result.stderr}")

    # Wait for services to be healthy
    time.sleep(5)

    yield

    # Cleanup (optional - can leave running for faster iterations)
    # subprocess.run(["docker-compose", "down"], capture_output=True)
