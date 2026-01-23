"""Message recording service for SECS/GEM simulator.

This service coordinates message persistence, listening for messages from simulators
and managing database connections. Messages are recorded to PostgreSQL for replay
and analysis.
"""
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.db.models.hsms_session import HsmsSession
from scavenger.db.models.secs_message import Direction, SecsMessage
from scavenger.db.models.state_snapshot import SnapshotType, StateSnapshot
from scavenger.simulator.common.messages import HsmsMessage
from scavenger.simulator.recorder.batch_writer import BatchWriter

logger = logging.getLogger(__name__)


class RecorderService:
    """Service for recording SECS/GEM messages and session data.

    This service provides the main coordinator/facade for message persistence.
    It handles recording of:
    - HSMS session information
    - SECS-II messages
    - Equipment state snapshots

    Redis integration and batch processing will be added in later tasks.
    """

    def __init__(
        self,
        db_session: AsyncSession,
        redis_url: str = "redis://localhost:6379",
        batch_size: int = 100,
        flush_interval_ms: int = 500,
    ):
        """Initialize the recorder service.

        Args:
            db_session: Async SQLAlchemy session for database operations
            redis_url: Redis connection URL (for future use in Task 4.3)
            batch_size: Number of messages to buffer before auto-flush (default 100)
            flush_interval_ms: Time in milliseconds before auto-flush (default 500)
        """
        self._db_session = db_session
        self._redis_url = redis_url
        self._is_running = False
        self._message_count = 0
        self._message_queue: asyncio.Queue[HsmsMessage] = asyncio.Queue()

        # Initialize batch writer for optimized message persistence
        self._batch_writer = BatchWriter(
            db_session=db_session,
            batch_size=batch_size,
            flush_interval_ms=flush_interval_ms,
        )

        logger.info(
            "RecorderService initialized (redis_url=%s, batch_size=%d, flush_interval_ms=%d)",
            redis_url,
            batch_size,
            flush_interval_ms,
        )

    @property
    def is_running(self) -> bool:
        """Return whether the service is running."""
        return self._is_running

    @property
    def message_count(self) -> int:
        """Return total number of messages recorded."""
        return self._message_count

    async def start(self) -> None:
        """Start the recording service.

        This method is idempotent - calling it multiple times is safe.
        Redis subscription and background processing will be added in Task 4.3.
        """
        if self._is_running:
            logger.warning("RecorderService already running")
            return

        self._is_running = True

        # Start batch writer for automatic flushing
        await self._batch_writer.start()

        logger.info("RecorderService started")

    async def stop(self) -> None:
        """Stop the recording service.

        This method is idempotent - calling it multiple times is safe.
        """
        if not self._is_running:
            logger.warning("RecorderService already stopped")
            return

        self._is_running = False

        # Stop batch writer and flush remaining messages
        await self._batch_writer.stop()

        logger.info("RecorderService stopped")

    async def record_session(self, session_data: dict[str, Any]) -> HsmsSession:
        """Record HSMS session information.

        Args:
            session_data: Dictionary containing session fields:
                - id: Session UUID
                - equipment_id: Equipment model ID (optional)
                - session_type: SessionType enum value
                - local_role: LocalRole enum value
                - remote_address: Remote IP address (optional)
                - local_port: Local port number (optional)
                - started_at: Session start timestamp
                - ended_at: Session end timestamp (optional)
                - connection_state: ConnectionState enum value (optional)
                - metadata_: Additional metadata as JSONB (optional)

        Returns:
            The created HsmsSession object

        Raises:
            IntegrityError: If session with same ID already exists
        """
        try:
            # Create session object
            session = HsmsSession(
                id=session_data["id"],
                equipment_id=session_data.get("equipment_id"),
                session_type=session_data["session_type"],
                local_role=session_data["local_role"],
                remote_address=session_data.get("remote_address"),
                local_port=session_data.get("local_port"),
                started_at=session_data["started_at"],
                ended_at=session_data.get("ended_at"),
                connection_state=session_data.get("connection_state"),
                metadata_=session_data.get("metadata_"),
            )

            self._db_session.add(session)
            await self._db_session.flush()

            logger.info(
                "Recorded HSMS session: id=%s, role=%s, type=%s",
                session.id,
                session.local_role,
                session.session_type,
            )

            return session

        except IntegrityError:
            await self._db_session.rollback()
            logger.error("Session %s already exists", session_data["id"])
            raise

    async def record_message(
        self,
        session_id: uuid.UUID,
        message: HsmsMessage,
        latency_ms: float | None = None,
    ) -> None:
        """Record a SECS-II message using batch writer.

        Args:
            session_id: HSMS session UUID
            message: HsmsMessage object containing message data
            latency_ms: Optional message latency in milliseconds

        Note:
            Messages are queued for batch writing. To ensure immediate persistence,
            call flush_messages() or stop the service.
        """
        if message.data is None:
            raise ValueError("Message data is required")

        # Prepare message data for batch writer
        message_data = {
            "session_id": session_id,
            "sequence_num": message.sequence_num,
            "timestamp": message.timestamp,
            "direction": Direction(message.direction),
            "stream": message.data.stream,
            "function": message.data.function,
            "wbit": message.data.wbit,
            "system_bytes": message.data.system_bytes,
            "raw_sml": message.data.raw_sml,
            "raw_binary": message.data.raw_binary,
            "parsed_body": message.data.body if message.data.body else None,
            "transaction_id": message.transaction_id,
            "latency_ms": latency_ms,
        }

        # Queue message for batch writing
        await self._batch_writer.queue_message(message_data)

        # Increment counter
        self._message_count += 1

        logger.debug(
            "Queued message for recording: session=%s, S%dF%d, seq=%d",
            session_id,
            message.data.stream,
            message.data.function,
            message.sequence_num,
        )

    async def get_session_messages(
        self,
        session_id: uuid.UUID,
        limit: int = 100,
    ) -> list[SecsMessage]:
        """Retrieve messages for a session.

        Args:
            session_id: HSMS session UUID
            limit: Maximum number of messages to return (default 100)

        Returns:
            List of SecsMessage objects ordered by sequence number
        """
        stmt = (
            select(SecsMessage)
            .where(SecsMessage.session_id == session_id)
            .order_by(SecsMessage.sequence_num)
            .limit(limit)
        )

        result = await self._db_session.execute(stmt)
        messages = result.scalars().all()

        logger.debug(
            "Retrieved %d messages for session %s",
            len(messages),
            session_id,
        )

        return list(messages)

    async def create_snapshot(
        self,
        session_id: uuid.UUID,
        snapshot_type: SnapshotType,
        equipment_state: dict[str, Any],
        after_message_id: int | None = None,
        pending_transactions: dict[str, Any] | None = None,
        scenario_context: dict[str, Any] | None = None,
    ) -> StateSnapshot:
        """Create an equipment state snapshot.

        Args:
            session_id: HSMS session UUID
            snapshot_type: Type of snapshot (periodic, checkpoint, scenario_step)
            equipment_state: Equipment state as dictionary
            after_message_id: ID of message this snapshot follows (optional)
            pending_transactions: Pending transactions state (optional)
            scenario_context: Scenario execution context (optional)

        Returns:
            The created StateSnapshot object

        Raises:
            IntegrityError: If session does not exist
        """
        try:
            snapshot = StateSnapshot(
                session_id=session_id,
                after_message_id=after_message_id,
                snapshot_type=snapshot_type,
                equipment_state=equipment_state,
                pending_transactions=pending_transactions,
                scenario_context=scenario_context,
            )

            self._db_session.add(snapshot)
            await self._db_session.flush()

            logger.info(
                "Created snapshot: session=%s, type=%s",
                session_id,
                snapshot_type,
            )

            return snapshot

        except IntegrityError:
            await self._db_session.rollback()
            logger.error(
                "Failed to create snapshot: session %s may not exist",
                session_id,
            )
            raise

    async def get_session(self, session_id: uuid.UUID) -> HsmsSession | None:
        """Retrieve session information.

        Args:
            session_id: HSMS session UUID

        Returns:
            HsmsSession object or None if not found
        """
        stmt = select(HsmsSession).where(HsmsSession.id == session_id)
        result = await self._db_session.execute(stmt)
        session = result.scalar_one_or_none()

        if session:
            logger.debug("Retrieved session %s", session_id)
        else:
            logger.warning("Session %s not found", session_id)

        return session

    async def flush_messages(self) -> None:
        """Manually flush all pending messages to the database.

        This forces immediate persistence of all queued messages,
        bypassing the batch size and time interval thresholds.
        """
        await self._batch_writer.flush()
        logger.info("Manually flushed pending messages")

    def get_batch_statistics(self) -> dict[str, Any]:
        """Get batch writer statistics.

        Returns:
            Dictionary containing batch writer performance metrics:
                - messages_queued: Total messages queued
                - batches_written: Total batches written
                - messages_written: Total messages persisted
                - avg_batch_size: Average batch size
                - last_flush_time: Last flush timestamp
                - current_queue_size: Current queue size
        """
        return self._batch_writer.get_statistics()
