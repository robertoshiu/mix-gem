"""Integration tests for RecorderService.

These tests require Docker to be running to start a PostgreSQL container.
For unit tests that don't require Docker, see test_service_unit.py.

Run with: pytest tests/simulator/recorder/test_service.py -v
"""
import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.db.models.hsms_session import (
    ConnectionState,
    HsmsSession,
    LocalRole,
    SessionType,
)
from scavenger.db.models.secs_message import Direction, SecsMessage
from scavenger.db.models.state_snapshot import SnapshotType, StateSnapshot
from scavenger.db.session import get_session
from scavenger.simulator.common.messages import HsmsMessage, SecsMessageData
from scavenger.simulator.recorder.service import RecorderService


@pytest_asyncio.fixture
async def db_session(sqlite_session):
    """Provide a database session for testing."""
    # Use SQLite session for unit tests (no Docker required)
    yield sqlite_session


@pytest_asyncio.fixture
async def recorder_service(db_session):
    """Create a RecorderService instance for testing."""
    service = RecorderService(db_session)
    yield service
    # Stop service if running
    if service.is_running:
        await service.stop()


@pytest.mark.asyncio
async def test_recorder_service_init(db_session):
    """RecorderService initializes with database session."""
    service = RecorderService(db_session)

    assert service.is_running is False
    assert service.message_count == 0
    assert service._db_session == db_session


@pytest.mark.asyncio
async def test_recorder_service_init_with_redis_url(db_session):
    """RecorderService accepts custom Redis URL."""
    service = RecorderService(db_session, redis_url="redis://custom:6380")

    assert service.is_running is False
    assert service._redis_url == "redis://custom:6380"


@pytest.mark.asyncio
async def test_recorder_service_start_stop(recorder_service):
    """RecorderService can start and stop."""
    # Initial state
    assert recorder_service.is_running is False

    # Start service
    await recorder_service.start()
    assert recorder_service.is_running is True

    # Stop service
    await recorder_service.stop()
    assert recorder_service.is_running is False


@pytest.mark.asyncio
async def test_recorder_service_double_start(recorder_service):
    """Starting service twice is idempotent."""
    await recorder_service.start()
    await recorder_service.start()  # Should not raise
    assert recorder_service.is_running is True
    await recorder_service.stop()


@pytest.mark.asyncio
async def test_recorder_service_double_stop(recorder_service):
    """Stopping service twice is idempotent."""
    await recorder_service.start()
    await recorder_service.stop()
    await recorder_service.stop()  # Should not raise
    assert recorder_service.is_running is False


@pytest.mark.asyncio
async def test_record_session(recorder_service, db_session):
    """RecorderService can record HSMS session information."""
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "remote_address": "192.168.1.100",
        "local_port": 5000,
        "started_at": datetime.now(timezone.utc),
        "connection_state": ConnectionState.CONNECTED,
        "metadata_": {"test": "data"},
    }

    # Record session
    result = await recorder_service.record_session(session_data)

    # Verify result
    assert result.id == session_id
    assert result.equipment_id == 1
    assert result.session_type == SessionType.SIMULATION

    # Verify in database
    stmt = select(HsmsSession).where(HsmsSession.id == session_id)
    db_result = await db_session.execute(stmt)
    db_session_obj = db_result.scalar_one()

    assert db_session_obj.id == session_id
    assert db_session_obj.local_role == LocalRole.EQUIPMENT
    assert db_session_obj.remote_address == "192.168.1.100"


@pytest.mark.asyncio
async def test_record_message(recorder_service, db_session):
    """RecorderService can record a SECS message."""
    # First create a session
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "started_at": datetime.now(timezone.utc),
    }
    await recorder_service.record_session(session_data)

    # Create message data
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
        message_type=0,  # DATA_MESSAGE
        data=message_data,
        sequence_num=1,
        transaction_id=100,
    )

    # Record message
    initial_count = recorder_service.message_count
    result = await recorder_service.record_message(session_id, message)

    # Verify result
    assert result.session_id == session_id
    assert result.stream == 1
    assert result.function == 1
    assert result.wbit is True
    assert result.direction == Direction.H2E
    assert result.transaction_id == 100
    assert recorder_service.message_count == initial_count + 1

    # Verify in database
    stmt = select(SecsMessage).where(SecsMessage.session_id == session_id)
    db_result = await db_session.execute(stmt)
    db_message = db_result.scalar_one()

    assert db_message.stream == 1
    assert db_message.function == 1
    assert db_message.raw_sml == "S1F1 W <L [1] [2] [3]>."
    assert db_message.parsed_body == {"item": [1, 2, 3]}


@pytest.mark.asyncio
async def test_record_multiple_messages(recorder_service, db_session):
    """RecorderService can record multiple messages in sequence."""
    # Create session
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "started_at": datetime.now(timezone.utc),
    }
    await recorder_service.record_session(session_data)

    # Record multiple messages
    for i in range(5):
        message_data = SecsMessageData(
            stream=1,
            function=i + 1,
            wbit=False,
        )

        message = HsmsMessage(
            session_id=session_id,
            timestamp=datetime.now(timezone.utc),
            direction="E2H",
            message_type=0,
            data=message_data,
            sequence_num=i + 1,
        )

        await recorder_service.record_message(session_id, message)

    assert recorder_service.message_count == 5

    # Verify all messages in database
    stmt = select(SecsMessage).where(SecsMessage.session_id == session_id)
    db_result = await db_session.execute(stmt)
    messages = db_result.scalars().all()

    assert len(messages) == 5
    for i, msg in enumerate(messages):
        assert msg.function == i + 1
        assert msg.sequence_num == i + 1


@pytest.mark.asyncio
async def test_get_session_messages(recorder_service, db_session):
    """RecorderService can retrieve messages for a session."""
    # Create session and messages
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "started_at": datetime.now(timezone.utc),
    }
    await recorder_service.record_session(session_data)

    # Record 3 messages
    for i in range(3):
        message_data = SecsMessageData(stream=1, function=i + 1, wbit=False)
        message = HsmsMessage(
            session_id=session_id,
            timestamp=datetime.now(timezone.utc),
            direction="E2H",
            message_type=0,
            data=message_data,
            sequence_num=i + 1,
        )
        await recorder_service.record_message(session_id, message)

    # Retrieve messages
    messages = await recorder_service.get_session_messages(session_id)

    assert len(messages) == 3
    assert messages[0].function == 1
    assert messages[1].function == 2
    assert messages[2].function == 3


@pytest.mark.asyncio
async def test_get_session_messages_with_limit(recorder_service, db_session):
    """RecorderService respects limit when retrieving messages."""
    # Create session and messages
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "started_at": datetime.now(timezone.utc),
    }
    await recorder_service.record_session(session_data)

    # Record 10 messages
    for i in range(10):
        message_data = SecsMessageData(stream=1, function=1, wbit=False)
        message = HsmsMessage(
            session_id=session_id,
            timestamp=datetime.now(timezone.utc),
            direction="E2H",
            message_type=0,
            data=message_data,
            sequence_num=i + 1,
        )
        await recorder_service.record_message(session_id, message)

    # Retrieve with limit
    messages = await recorder_service.get_session_messages(session_id, limit=5)

    assert len(messages) == 5


@pytest.mark.asyncio
async def test_create_snapshot(recorder_service, db_session):
    """RecorderService can create state snapshots."""
    # Create session
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "started_at": datetime.now(timezone.utc),
    }
    await recorder_service.record_session(session_data)

    # Create snapshot
    equipment_state = {
        "control_state": "REMOTE",
        "processing_state": "IDLE",
        "variables": {"PPID": "RECIPE001", "LOTID": "LOT123"},
    }

    snapshot = await recorder_service.create_snapshot(
        session_id=session_id,
        snapshot_type=SnapshotType.CHECKPOINT,
        equipment_state=equipment_state,
    )

    # Verify result
    assert snapshot.session_id == session_id
    assert snapshot.snapshot_type == SnapshotType.CHECKPOINT
    assert snapshot.equipment_state == equipment_state

    # Verify in database
    stmt = select(StateSnapshot).where(StateSnapshot.session_id == session_id)
    db_result = await db_session.execute(stmt)
    db_snapshot = db_result.scalar_one()

    assert db_snapshot.equipment_state["control_state"] == "REMOTE"
    assert db_snapshot.equipment_state["variables"]["PPID"] == "RECIPE001"


@pytest.mark.asyncio
async def test_create_snapshot_with_pending_transactions(recorder_service, db_session):
    """RecorderService can create snapshots with pending transactions."""
    # Create session
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "started_at": datetime.now(timezone.utc),
    }
    await recorder_service.record_session(session_data)

    # Create snapshot with pending transactions
    equipment_state = {"control_state": "REMOTE"}
    pending_transactions = {
        "100": {"stream": 1, "function": 13, "sent_at": "2025-01-01T00:00:00Z"}
    }
    scenario_context = {"step": 5, "scenario_id": "TEST_001"}

    snapshot = await recorder_service.create_snapshot(
        session_id=session_id,
        snapshot_type=SnapshotType.SCENARIO_STEP,
        equipment_state=equipment_state,
        pending_transactions=pending_transactions,
        scenario_context=scenario_context,
    )

    assert snapshot.pending_transactions == pending_transactions
    assert snapshot.scenario_context == scenario_context


@pytest.mark.asyncio
async def test_get_session(recorder_service, db_session):
    """RecorderService can retrieve session information."""
    # Create session
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "remote_address": "192.168.1.100",
        "local_port": 5000,
        "started_at": datetime.now(timezone.utc),
    }
    await recorder_service.record_session(session_data)

    # Retrieve session
    session = await recorder_service.get_session(session_id)

    assert session is not None
    assert session.id == session_id
    assert session.equipment_id == 1
    assert session.local_role == LocalRole.EQUIPMENT


@pytest.mark.asyncio
async def test_get_session_not_found(recorder_service):
    """RecorderService returns None for non-existent session."""
    session_id = uuid.uuid4()
    session = await recorder_service.get_session(session_id)

    assert session is None


@pytest.mark.asyncio
async def test_record_message_without_session(recorder_service):
    """Recording message without session raises appropriate error."""
    session_id = uuid.uuid4()
    message_data = SecsMessageData(stream=1, function=1, wbit=False)
    message = HsmsMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc),
        direction="E2H",
        message_type=0,
        data=message_data,
        sequence_num=1,
    )

    # This should raise an error or handle gracefully
    with pytest.raises(Exception):  # Will need to specify exact exception type
        await recorder_service.record_message(session_id, message)


@pytest.mark.asyncio
async def test_message_count_tracking(recorder_service, db_session):
    """RecorderService accurately tracks message count."""
    # Create session
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "started_at": datetime.now(timezone.utc),
    }
    await recorder_service.record_session(session_data)

    # Initial count
    assert recorder_service.message_count == 0

    # Record messages
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
        await recorder_service.record_message(session_id, message)
        assert recorder_service.message_count == i + 1


@pytest.mark.asyncio
async def test_record_message_with_latency(recorder_service, db_session):
    """RecorderService records message latency."""
    # Create session
    session_id = uuid.uuid4()
    session_data = {
        "id": session_id,
        "equipment_id": 1,
        "session_type": SessionType.SIMULATION,
        "local_role": LocalRole.EQUIPMENT,
        "started_at": datetime.now(timezone.utc),
    }
    await recorder_service.record_session(session_data)

    # Create message with latency
    message_data = SecsMessageData(stream=1, function=2, wbit=False)
    message = HsmsMessage(
        session_id=session_id,
        timestamp=datetime.now(timezone.utc),
        direction="H2E",
        message_type=0,
        data=message_data,
        sequence_num=1,
    )

    # Record with latency
    result = await recorder_service.record_message(
        session_id, message, latency_ms=125.5
    )

    assert result.latency_ms == 125.5

    # Verify in database
    stmt = select(SecsMessage).where(SecsMessage.id == result.id)
    db_result = await db_session.execute(stmt)
    db_message = db_result.scalar_one()

    assert db_message.latency_ms == 125.5
