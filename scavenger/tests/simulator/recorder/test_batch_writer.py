"""Tests for message batch writer."""
import asyncio
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.db.models.secs_message import Direction, SecsMessage
from scavenger.simulator.recorder.batch_writer import BatchWriter


class TestBatchWriterInit:
    """Test BatchWriter initialization."""

    @pytest.mark.asyncio
    async def test_batch_writer_init(self):
        """Test BatchWriter initializes with correct defaults."""
        db_session = AsyncMock(spec=AsyncSession)

        batch_writer = BatchWriter(
            db_session=db_session,
            batch_size=100,
            flush_interval_ms=500,
        )

        assert batch_writer.queue_size == 0
        assert not batch_writer.is_running
        assert batch_writer._batch_size == 100
        assert batch_writer._flush_interval_ms == 500
        assert batch_writer._db_session is db_session

    @pytest.mark.asyncio
    async def test_batch_writer_custom_config(self):
        """Test BatchWriter with custom configuration."""
        db_session = AsyncMock(spec=AsyncSession)

        batch_writer = BatchWriter(
            db_session=db_session,
            batch_size=50,
            flush_interval_ms=1000,
        )

        assert batch_writer._batch_size == 50
        assert batch_writer._flush_interval_ms == 1000


class TestQueueMessage:
    """Test queuing messages."""

    @pytest.mark.asyncio
    async def test_queue_message(self):
        """Test adding a message to the queue."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(db_session=db_session, batch_size=100)

        message_data = {
            "session_id": uuid.uuid4(),
            "sequence_num": 1,
            "timestamp": datetime.now(timezone.utc),
            "direction": Direction.H2E,
            "stream": 1,
            "function": 1,
            "wbit": False,
        }

        await batch_writer.queue_message(message_data)

        assert batch_writer.queue_size == 1

    @pytest.mark.asyncio
    async def test_queue_multiple_messages(self):
        """Test queuing multiple messages."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(db_session=db_session, batch_size=100)

        for i in range(5):
            message_data = {
                "session_id": uuid.uuid4(),
                "sequence_num": i,
                "timestamp": datetime.now(timezone.utc),
                "direction": Direction.H2E,
                "stream": 1,
                "function": 1,
                "wbit": False,
            }
            await batch_writer.queue_message(message_data)

        assert batch_writer.queue_size == 5


class TestAutoFlushOnBatchSize:
    """Test automatic flushing when batch size is reached."""

    @pytest.mark.asyncio
    async def test_auto_flush_on_batch_size(self):
        """Test that flush happens automatically when batch size is reached."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(
            db_session=db_session,
            batch_size=3,
            flush_interval_ms=10000,  # High interval to prevent time-based flush
        )

        # Queue 2 messages (below batch size)
        for i in range(2):
            message_data = {
                "session_id": uuid.uuid4(),
                "sequence_num": i,
                "timestamp": datetime.now(timezone.utc),
                "direction": Direction.H2E,
                "stream": 1,
                "function": 1,
                "wbit": False,
            }
            await batch_writer.queue_message(message_data)

        # No flush yet
        assert batch_writer.queue_size == 2
        db_session.add_all.assert_not_called()

        # Add 3rd message - should trigger flush
        message_data = {
            "session_id": uuid.uuid4(),
            "sequence_num": 3,
            "timestamp": datetime.now(timezone.utc),
            "direction": Direction.H2E,
            "stream": 1,
            "function": 1,
            "wbit": False,
        }
        await batch_writer.queue_message(message_data)

        # Queue should be empty after flush
        assert batch_writer.queue_size == 0

        # Verify flush was called
        db_session.add_all.assert_called_once()
        args = db_session.add_all.call_args[0][0]
        assert len(args) == 3


class TestAutoFlushOnInterval:
    """Test automatic flushing after time interval."""

    @pytest.mark.asyncio
    async def test_auto_flush_on_interval(self):
        """Test that flush happens after time interval with pending messages."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(
            db_session=db_session,
            batch_size=100,  # High batch size to prevent size-based flush
            flush_interval_ms=100,  # 100ms interval
        )

        await batch_writer.start()

        # Queue a message
        message_data = {
            "session_id": uuid.uuid4(),
            "sequence_num": 1,
            "timestamp": datetime.now(timezone.utc),
            "direction": Direction.H2E,
            "stream": 1,
            "function": 1,
            "wbit": False,
        }
        await batch_writer.queue_message(message_data)

        assert batch_writer.queue_size == 1

        # Wait for flush interval
        await asyncio.sleep(0.15)

        # Queue should be flushed
        assert batch_writer.queue_size == 0
        db_session.add_all.assert_called()

        await batch_writer.stop()

    @pytest.mark.asyncio
    async def test_no_flush_when_queue_empty(self):
        """Test that flush does not happen when queue is empty."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(
            db_session=db_session,
            batch_size=100,
            flush_interval_ms=100,
        )

        await batch_writer.start()

        # Wait for more than flush interval
        await asyncio.sleep(0.15)

        # No flush should happen
        db_session.add_all.assert_not_called()

        await batch_writer.stop()


class TestManualFlush:
    """Test manual flush operation."""

    @pytest.mark.asyncio
    async def test_manual_flush(self):
        """Test manual flush writes all queued messages."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(db_session=db_session, batch_size=100)

        # Queue some messages
        for i in range(5):
            message_data = {
                "session_id": uuid.uuid4(),
                "sequence_num": i,
                "timestamp": datetime.now(timezone.utc),
                "direction": Direction.H2E,
                "stream": 1,
                "function": 1,
                "wbit": False,
            }
            await batch_writer.queue_message(message_data)

        assert batch_writer.queue_size == 5

        # Manual flush
        await batch_writer.flush()

        # Queue should be empty
        assert batch_writer.queue_size == 0

        # Verify database write
        db_session.add_all.assert_called_once()
        args = db_session.add_all.call_args[0][0]
        assert len(args) == 5


class TestFlushEmptyQueue:
    """Test flushing when queue is empty."""

    @pytest.mark.asyncio
    async def test_flush_empty_queue(self):
        """Test that flushing empty queue is safe and does nothing."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(db_session=db_session)

        assert batch_writer.queue_size == 0

        # Flush empty queue
        await batch_writer.flush()

        # Should not call database
        db_session.add_all.assert_not_called()


class TestStatistics:
    """Test statistics tracking."""

    @pytest.mark.asyncio
    async def test_get_statistics(self):
        """Test statistics tracking for batch writer."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(
            db_session=db_session,
            batch_size=3,
        )

        # Queue and flush first batch
        for i in range(3):
            message_data = {
                "session_id": uuid.uuid4(),
                "sequence_num": i,
                "timestamp": datetime.now(timezone.utc),
                "direction": Direction.H2E,
                "stream": 1,
                "function": 1,
                "wbit": False,
            }
            await batch_writer.queue_message(message_data)

        # Queue and flush second batch
        for i in range(2):
            message_data = {
                "session_id": uuid.uuid4(),
                "sequence_num": i + 3,
                "timestamp": datetime.now(timezone.utc),
                "direction": Direction.E2H,
                "stream": 1,
                "function": 2,
                "wbit": False,
            }
            await batch_writer.queue_message(message_data)

        await batch_writer.flush()

        # Get statistics
        stats = batch_writer.get_statistics()

        assert stats["messages_queued"] == 5
        assert stats["batches_written"] == 2
        assert stats["messages_written"] == 5
        assert stats["avg_batch_size"] == 2.5
        assert "last_flush_time" in stats
        assert stats["current_queue_size"] == 0

    @pytest.mark.asyncio
    async def test_statistics_no_flushes(self):
        """Test statistics when no flushes have occurred."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(db_session=db_session)

        stats = batch_writer.get_statistics()

        assert stats["messages_queued"] == 0
        assert stats["batches_written"] == 0
        assert stats["messages_written"] == 0
        assert stats["avg_batch_size"] == 0
        assert stats["last_flush_time"] is None
        assert stats["current_queue_size"] == 0


class TestLifecycle:
    """Test start/stop lifecycle."""

    @pytest.mark.asyncio
    async def test_start_stop(self):
        """Test starting and stopping the batch writer."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(db_session=db_session)

        assert not batch_writer.is_running

        await batch_writer.start()
        assert batch_writer.is_running

        await batch_writer.stop()
        assert not batch_writer.is_running

    @pytest.mark.asyncio
    async def test_stop_flushes_remaining(self):
        """Test that stop flushes remaining messages."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(
            db_session=db_session,
            batch_size=100,
        )

        await batch_writer.start()

        # Queue some messages
        for i in range(5):
            message_data = {
                "session_id": uuid.uuid4(),
                "sequence_num": i,
                "timestamp": datetime.now(timezone.utc),
                "direction": Direction.H2E,
                "stream": 1,
                "function": 1,
                "wbit": False,
            }
            await batch_writer.queue_message(message_data)

        assert batch_writer.queue_size == 5

        # Stop should flush remaining messages
        await batch_writer.stop()

        assert batch_writer.queue_size == 0
        db_session.add_all.assert_called_once()

    @pytest.mark.asyncio
    async def test_double_start_is_safe(self):
        """Test that calling start twice is safe."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(db_session=db_session)

        await batch_writer.start()
        await batch_writer.start()  # Should not raise

        assert batch_writer.is_running
        await batch_writer.stop()

    @pytest.mark.asyncio
    async def test_double_stop_is_safe(self):
        """Test that calling stop twice is safe."""
        db_session = AsyncMock(spec=AsyncSession)
        batch_writer = BatchWriter(db_session=db_session)

        await batch_writer.start()
        await batch_writer.stop()
        await batch_writer.stop()  # Should not raise

        assert not batch_writer.is_running
