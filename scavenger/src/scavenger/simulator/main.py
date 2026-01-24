"""Main entry point for SECS/GEM simulator service.

This module provides the CLI entry point for running the equipment simulator.
It starts an HSMS passive server that accepts connections from host applications.

Usage:
    python -m scavenger.simulator.main [OPTIONS]

Environment Variables:
    HSMS_PASSIVE_PORT: Port for passive HSMS connections (default: 5000)
    HSMS_DEVICE_ID: SECS device ID (default: 1)
    EQUIPMENT_ID: Equipment identifier (default: SIM001)
    DATABASE_URL: PostgreSQL connection URL
    REDIS_URL: Redis connection URL for pub/sub
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


class SimulatorService:
    """Main simulator service orchestrator.

    Manages the lifecycle of:
    - HSMS passive server (equipment mode)
    - Equipment state machine
    - Scenario engine
    - Message recording (via Redis pub/sub)
    """

    def __init__(self) -> None:
        """Initialize simulator service from environment."""
        self.passive_port = int(os.environ.get("HSMS_PASSIVE_PORT", "5000"))
        self.device_id = int(os.environ.get("HSMS_DEVICE_ID", "1"))
        self.equipment_id = os.environ.get("EQUIPMENT_ID", "SIM001")
        self.database_url = os.environ.get("DATABASE_URL", "")
        self.redis_url = os.environ.get("REDIS_URL", "")

        self._running = False
        self._shutdown_event = asyncio.Event()

    async def start(self) -> None:
        """Start the simulator service."""
        logger.info(
            "Starting SECS/GEM simulator: equipment_id=%s, port=%d, device_id=%d",
            self.equipment_id,
            self.passive_port,
            self.device_id,
        )

        self._running = True

        # TODO: Initialize components when they're ready
        # - EquipmentServer from simulator.equipment.server
        # - ScenarioEngine from simulator.scenario.engine
        # - RecorderService from simulator.recorder.service

        logger.info("Simulator started successfully")

        # Wait for shutdown signal
        await self._shutdown_event.wait()

    async def stop(self) -> None:
        """Stop the simulator service gracefully."""
        logger.info("Stopping simulator...")
        self._running = False
        self._shutdown_event.set()

        # TODO: Cleanup components
        # - Stop HSMS server
        # - Flush pending recordings
        # - Close database connections

        logger.info("Simulator stopped")

    def request_shutdown(self) -> None:
        """Request graceful shutdown from signal handler."""
        logger.info("Shutdown requested")
        self._shutdown_event.set()


def setup_signal_handlers(service: SimulatorService) -> None:
    """Configure signal handlers for graceful shutdown."""
    loop = asyncio.get_running_loop()

    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, service.request_shutdown)


async def main() -> None:
    """Main async entry point."""
    service = SimulatorService()

    # Setup signal handlers
    setup_signal_handlers(service)

    try:
        await service.start()
    except Exception:
        logger.exception("Simulator failed with error")
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
