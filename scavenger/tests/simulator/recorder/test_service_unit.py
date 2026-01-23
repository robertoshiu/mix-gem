"""Unit tests for RecorderService (no database required)."""
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, Mock

import pytest

from scavenger.db.models.hsms_session import LocalRole, SessionType
from scavenger.simulator.common.messages import HsmsMessage, SecsMessageData
from scavenger.simulator.recorder.service import RecorderService


@pytest.fixture
def mock_db_session():
    """Create a mock database session."""
    session = AsyncMock()
    session.add = Mock()
    session.flush = AsyncMock()
    session.execute = AsyncMock()
    session.rollback = AsyncMock()
    return session


def test_recorder_service_init(mock_db_session):
    """RecorderService initializes with database session."""
    service = RecorderService(mock_db_session)

    assert service.is_running is False
    assert service.message_count == 0
    assert service._db_session == mock_db_session


def test_recorder_service_init_with_redis_url(mock_db_session):
    """RecorderService accepts custom Redis URL."""
    service = RecorderService(mock_db_session, redis_url="redis://custom:6380")

    assert service.is_running is False
    assert service._redis_url == "redis://custom:6380"


@pytest.mark.asyncio
async def test_recorder_service_start_stop(mock_db_session):
    """RecorderService can start and stop."""
    service = RecorderService(mock_db_session)

    # Initial state
    assert service.is_running is False

    # Start service
    await service.start()
    assert service.is_running is True

    # Stop service
    await service.stop()
    assert service.is_running is False


@pytest.mark.asyncio
async def test_recorder_service_double_start(mock_db_session):
    """Starting service twice is idempotent."""
    service = RecorderService(mock_db_session)

    await service.start()
    await service.start()  # Should not raise
    assert service.is_running is True
    await service.stop()


@pytest.mark.asyncio
async def test_recorder_service_double_stop(mock_db_session):
    """Stopping service twice is idempotent."""
    service = RecorderService(mock_db_session)

    await service.start()
    await service.stop()
    await service.stop()  # Should not raise
    assert service.is_running is False


@pytest.mark.asyncio
async def test_record_session(mock_db_session):
    """RecorderService can record HSMS session information."""
    service = RecorderService(mock_db_session)

    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "remote_address": "192.168.1.100",
        "local_port": 5000,
        "started_at": datetime.now(timezone.utc),
        "metadata_": {"test": "data"},
    }

    # Record session
    result = await service.record_session(session_data)

    # Verify result
    assert result.id == session_id
    assert result.equipment_id == 1
    assert result.session_type == SessionType.SIMULATION

    # Verify database calls
    assert mock_db_session.add.called
    assert mock_db_session.flush.called


@pytest.mark.asyncio
async def test_record_message(mock_db_session):
    """RecorderService can queue a SECS message for batch writing."""
    service = RecorderService(mock_db_session)

    session_id = uuid.uuid4()
    message_data = SecsMessageData(
        stream=1,
        function=1,
        wbit=True,
        system_bytes=b"\x00\x01\x00\x02",
        body={"item": [1, 2, 3]},
        raw_sml="S1F1 W <L [1] [2] [3]>.",
    )

    message = HsmsMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc),
        direction="H2E",
        message_type=0,
        data=message_data,
        sequence_num=1,
        transaction_id=100,
    )

    # Record message (queues for batch writing)
    initial_count = service.message_count
    await service.record_message(session_id, message)

    # Verify message count incremented
    assert service.message_count == initial_count + 1

    # Verify batch writer has the message queued
    stats = service.get_batch_statistics()
    assert stats["messages_queued"] == 1
    assert stats["current_queue_size"] == 1


@pytest.mark.asyncio
async def test_record_message_with_latency(mock_db_session):
    """RecorderService queues message with latency for batch writing."""
    service = RecorderService(mock_db_session)

    session_id = uuid.uuid4()
    message_data = SecsMessageData(stream=1, function=2, wbit=False)
    message = HsmsMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc),
        direction="H2E",
        message_type=0,
        data=message_data,
        sequence_num=1,
    )

    # Record with latency (queues for batch writing)
    await service.record_message(session_id, message, latency_ms=125.5)

    # Verify message was queued
    stats = service.get_batch_statistics()
    assert stats["messages_queued"] == 1
    assert stats["current_queue_size"] == 1


@pytest.mark.asyncio
async def test_record_message_without_data_raises_error(mock_db_session):
    """Recording message without data raises ValueError."""
    service = RecorderService(mock_db_session)

    session_id = uuid.uuid4()
    message = HsmsMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc),
        direction="E2H",
        message_type=0,
        data=None,  # No data
        sequence_num=1,
    )

    with pytest.raises(ValueError, match="Message data is required"):
        await service.record_message(session_id, message)


@pytest.mark.asyncio
async def test_get_session_messages(mock_db_session):
    """RecorderService can retrieve messages for a session."""
    service = RecorderService(mock_db_session)

    session_id = uuid.uuid4()

    # Mock the query result
    mock_scalars = Mock()
    mock_scalars.all.return_value = []
    mock_result = Mock()
    mock_result.scalars.return_value = mock_scalars
    mock_db_session.execute.return_value = mock_result

    # Retrieve messages
    messages = await service.get_session_messages(session_id)

    assert isinstance(messages, list)
    assert mock_db_session.execute.called


@pytest.mark.asyncio
async def test_get_session_messages_with_limit(mock_db_session):
    """RecorderService respects limit when retrieving messages."""
    service = RecorderService(mock_db_session)

    session_id = uuid.uuid4()

    # Mock the query result
    mock_scalars = Mock()
    mock_scalars.all.return_value = []
    mock_result = Mock()
    mock_result.scalars.return_value = mock_scalars
    mock_db_session.execute.return_value = mock_result

    # Retrieve with limit
    await service.get_session_messages(session_id, limit=5)

    assert mock_db_session.execute.called


@pytest.mark.asyncio
async def test_create_snapshot(mock_db_session):
    """RecorderService can create state snapshots."""
    from scavenger.db.models.state_snapshot import SnapshotType

    service = RecorderService(mock_db_session)

    session_id = uuid.uuid4()
    equipment_state = {
        "control_state": "REMOTE",
        "processing_state": "IDLE",
        "variables": {"PPID": "RECIPE001", "LOTID": "LOT123"},
    }

    snapshot = await service.create_snapshot(
        session_id=session_id,
        snapshot_type=SnapshotType.CHECKPOINT,
        equipment_state=equipment_state,
    )

    # Verify result
    assert snapshot.session_id == session_id
    assert snapshot.snapshot_type == SnapshotType.CHECKPOINT
    assert snapshot.equipment_state == equipment_state

    # Verify database calls
    assert mock_db_session.add.called
    assert mock_db_session.flush.called


@pytest.mark.asyncio
async def test_get_session(mock_db_session):
    """RecorderService can retrieve session information."""
    service = RecorderService(mock_db_session)

    session_id = uuid.uuid4()

    # Mock the query result
    mock_result = Mock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db_session.execute.return_value = mock_result

    # Retrieve session
    session = await service.get_session(session_id)

    assert session is None
    assert mock_db_session.execute.called


@pytest.mark.asyncio
async def test_message_count_tracking(mock_db_session):
    """RecorderService accurately tracks message count."""
    service = RecorderService(mock_db_session)

    # Initial count
    assert service.message_count == 0

    # Record messages
    session_id = uuid.uuid4()
    for i in range(3):
        message_data = SecsMessageData(stream=1, function=1, wbit=False)
        message = HsmsMessage(
            session_id=session_id,
            timestamp=datetime.now(timezone.utc),
            direction="E2H",
            message_type=0,
            data=message_data,
            sequence_num=i + 1,
        )
        await service.record_message(session_id, message)
        assert service.message_count == i + 1
