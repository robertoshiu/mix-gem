"""Main entry point for message recording service.

This module provides the CLI entry point for the recorder service that
listens to Redis pub/sub for SECS/GEM messages and persists them to PostgreSQL.

Usage:
    python -m scavenger.simulator.recorder.main [OPTIONS]

Environment Variables:
    DATABASE_URL: PostgreSQL connection URL
    REDIS_URL: Redis connection URL for pub/sub
    BATCH_SIZE: Number of messages to batch before writing (default: 100)
    FLUSH_INTERVAL_MS: Max time between flushes in ms (default: 1000)
    LOG_LEVEL: Logging level (default: INFO)
"""
import asyncio
import logging
import os
import signal
import sys
from typing import NoReturn

# Configure logging
log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


class RecorderMain:
    """Main recorder service orchestrator.

    Manages the lifecycle of:
    - Redis pub/sub listener
    - Batch writer for PostgreSQL
    - Session tracking
    """

    def __init__(self) -> None:
        """Initialize recorder service from environment."""
        self.database_url = os.environ.get("DATABASE_URL", "")
        self.redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        self.batch_size = int(os.environ.get("BATCH_SIZE", "100"))
        self.flush_interval_ms = int(os.environ.get("FLUSH_INTERVAL_MS", "1000"))

        self._running = False
        self._shutdown_event = asyncio.Event()

    async def start(self) -> None:
        """Start the recorder service."""
        logger.info(
            "Starting recorder service: batch_size=%d, flush_interval=%dms",
            self.batch_size,
            self.flush_interval_ms,
        )

        self._running = True

        # TODO: Initialize components when ready
        # - RecorderService from simulator.recorder.service
        # - RedisListener from simulator.recorder.redis_listener
        # - BatchWriter from simulator.recorder.batch_writer

        logger.info("Recorder service started successfully")

        # Wait for shutdown signal
        await self._shutdown_event.wait()

    async def stop(self) -> None:
        """Stop the recorder service gracefully."""
        logger.info("Stopping recorder service...")
        self._running = False
        self._shutdown_event.set()

        # TODO: Cleanup
        # - Flush pending batches
        # - Close Redis connection
        # - Close database connections

        logger.info("Recorder service stopped")

    def request_shutdown(self) -> None:
        """Request graceful shutdown from signal handler."""
        logger.info("Shutdown requested")
        self._shutdown_event.set()


def setup_signal_handlers(service: RecorderMain) -> None:
    """Configure signal handlers for graceful shutdown."""
    loop = asyncio.get_running_loop()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, service.request_shutdown)


async def main() -> None:
    """Main async entry point."""
    service = RecorderMain()

    # Setup signal handlers
    setup_signal_handlers(service)

    try:
        await service.start()
    except Exception:
        logger.exception("Recorder failed with error")
        raise
    finally:
        await service.stop()


def run() -> NoReturn:
    """Synchronous entry point for CLI."""
    try:
        asyncio.run(main())
        sys.exit(0)
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(0)
    except Exception:
        logger.exception("Fatal error")
        sys.exit(1)


if __name__ == "__main__":
    run()
