"""Batch writer for optimized message persistence.

This module provides a BatchWriter that buffers SECS messages and performs
bulk database inserts for improved throughput and reduced database load.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.db.models.secs_message import SecsMessage

logger = logging.getLogger(__name__)


class BatchWriter:
    """Batch writer for buffering and bulk-inserting SECS messages.

    The BatchWriter accumulates messages in a queue and flushes them to the
    database in batches based on:
    - Batch size threshold (number of messages)
    - Time interval (milliseconds since last flush)
    - Manual flush request

    This reduces database load and improves write throughput.
    """

    def __init__(
        self,
        db_session: AsyncSession,
        batch_size: int = 100,
        flush_interval_ms: int = 500,
    ):
        """Initialize the batch writer.

        Args:
            db_session: Async SQLAlchemy session for database operations
            batch_size: Number of messages to buffer before auto-flush (default 100)
            flush_interval_ms: Time in milliseconds before auto-flush (default 500)
        """
        self._db_session = db_session
        self._batch_size = batch_size
        self._flush_interval_ms = flush_interval_ms

        # Message queue
        self._queue: list[dict[str, Any]] = []
        self._queue_lock = asyncio.Lock()

        # Background task
        self._flush_task: asyncio.Task | None = None
        self._is_running = False

        # Statistics
        self._messages_queued = 0
        self._batches_written = 0
        self._messages_written = 0
        self._last_flush_time: datetime | None = None

        logger.info(
            "BatchWriter initialized: batch_size=%d, flush_interval_ms=%d",
            batch_size,
            flush_interval_ms,
        )

    @property
    def queue_size(self) -> int:
        """Get current number of queued messages."""
        return len(self._queue)

    @property
    def is_running(self) -> bool:
        """Check if background flush task is running."""
        return self._is_running

    async def queue_message(self, message_data: dict[str, Any]) -> None:
        """Add a message to the batch queue (async version).

        This async version allows for automatic flushing when batch size is reached.

        Args:
            message_data: Dictionary containing message fields for SecsMessage model
        """
        async with self._queue_lock:
            self._queue.append(message_data)
            self._messages_queued += 1

            logger.debug(
                "Message queued: queue_size=%d, batch_size=%d",
                len(self._queue),
                self._batch_size,
            )

            # Auto-flush if batch size reached
            if len(self._queue) >= self._batch_size:
                logger.debug("Batch size reached, triggering flush")
                await self._flush_internal()

    async def flush(self) -> None:
        """Manually flush all queued messages to the database.

        This method writes all pending messages immediately, regardless of
        batch size or time interval.
        """
        async with self._queue_lock:
            await self._flush_internal()

    async def _flush_internal(self) -> None:
        """Internal flush implementation (must be called with lock held).

        This performs the actual database write operation.
        """
        if not self._queue:
            logger.debug("Flush called but queue is empty")
            return

        batch_size = len(self._queue)
        logger.debug("Flushing %d messages to database", batch_size)

        try:
            # Create SecsMessage objects from queued data
            messages = [SecsMessage(**msg_data) for msg_data in self._queue]

            # Bulk insert
            self._db_session.add_all(messages)
            await self._db_session.flush()

            # Update statistics
            self._batches_written += 1
            self._messages_written += batch_size
            self._last_flush_time = datetime.now(timezone.utc)

            # Clear queue
            self._queue.clear()

            logger.info(
                "Flushed batch: size=%d, total_batches=%d, total_messages=%d",
                batch_size,
                self._batches_written,
                self._messages_written,
            )

        except Exception as e:
            logger.error("Error flushing batch: %s", e, exc_info=True)
            raise

    async def _auto_flush_loop(self) -> None:
        """Background task for automatic periodic flushing.

        This task runs while is_running is True and flushes pending messages
        based on the configured flush interval.
        """
        logger.info("Auto-flush loop started")

        try:
            while self._is_running:
                # Wait for flush interval
                await asyncio.sleep(self._flush_interval_ms / 1000.0)

                # Flush if there are pending messages
                async with self._queue_lock:
                    if self._queue:
                        logger.debug(
                            "Auto-flush triggered: %d messages pending",
                            len(self._queue),
                        )
                        await self._flush_internal()

        except asyncio.CancelledError:
            logger.info("Auto-flush loop cancelled")
            raise
        except Exception as e:
            logger.error("Error in auto-flush loop: %s", e, exc_info=True)
            raise

    async def start(self) -> None:
        """Start the background auto-flush task.

        This method is idempotent - calling it multiple times is safe.
        """
        if self._is_running:
            logger.warning("BatchWriter already running")
            return

        self._is_running = True
        self._flush_task = asyncio.create_task(self._auto_flush_loop())

        logger.info("BatchWriter started")

    async def stop(self) -> None:
        """Stop the background task and flush remaining messages.

        This method is idempotent - calling it multiple times is safe.
        Ensures all pending messages are written before stopping.
        """
        if not self._is_running:
            logger.warning("BatchWriter already stopped")
            return

        self._is_running = False

        # Cancel background task
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
            self._flush_task = None

        # Flush remaining messages
        await self.flush()

        logger.info("BatchWriter stopped")

    def get_statistics(self) -> dict[str, Any]:
        """Get batch writer statistics.

        Returns:
            Dictionary containing:
                - messages_queued: Total messages queued since start
                - batches_written: Total number of batches written
                - messages_written: Total messages written to database
                - avg_batch_size: Average batch size (0 if no batches)
                - last_flush_time: Timestamp of last flush (None if no flushes)
                - current_queue_size: Current number of queued messages
        """
        avg_batch_size = (
            self._messages_written / self._batches_written
            if self._batches_written > 0
            else 0
        )

        return {
            "messages_queued": self._messages_queued,
            "batches_written": self._batches_written,
            "messages_written": self._messages_written,
            "avg_batch_size": avg_batch_size,
            "last_flush_time": self._last_flush_time,
            "current_queue_size": len(self._queue),
        }
