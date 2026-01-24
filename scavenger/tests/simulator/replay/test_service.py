"""Tests for ReplayService - API layer for replay management."""
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
)
from scavenger.simulator.replay.player import PlaybackState, ReplayConfig, ReplayPlayer
from scavenger.simulator.replay.service import (
    ReplayService,
    ReplaySession,
    ReplaySessionNotFoundError,
)


# ============================================================================
# Test Fixtures
# ============================================================================


def make_message(
    sequence_num: int,
    session_id: uuid.UUID | None = None,
    delta_seconds: float = 0.0,
) -> HsmsMessage:
    """Create a test HSMS message."""
    base_time = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    return HsmsMessage(
        session_id=session_id or uuid.UUID("00000000-0000-0000-0000-000000000001"),
        timestamp=base_time + timedelta(seconds=delta_seconds),
        direction="H2E",
        message_type=HsmsMessageType.DATA_MESSAGE,
        data=SecsMessageData(stream=1, function=1, wbit=True),
        sequence_num=sequence_num,
    )


@pytest.fixture
def mock_db_session():
    """Create a mock database session."""
    return AsyncMock()


@pytest.fixture
def sample_messages() -> list[HsmsMessage]:
    """Sample message sequence."""
    sid = uuid.UUID("00000000-0000-0000-0000-000000000001")
    return [
        make_message(1, sid, 0.0),
        make_message(2, sid, 0.1),
        make_message(3, sid, 0.5),
    ]


# ============================================================================
# ReplaySession Tests
# ============================================================================


class TestReplaySession:
    """Tests for ReplaySession dataclass."""

    def test_session_creation(self, sample_messages):
        """ReplaySession can be created with required fields."""
        player = ReplayPlayer(messages=sample_messages)
        session = ReplaySession(
            session_id=uuid.uuid4(),
            recording_session_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
            player=player,
            created_at=datetime.now(timezone.utc),
        )

        assert session.session_id is not None
        assert session.recording_session_id is not None
        assert session.player is player

    def test_session_to_dict(self, sample_messages):
        """ReplaySession serializes to dictionary."""
        player = ReplayPlayer(messages=sample_messages)
        session_id = uuid.uuid4()
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
        created = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

        session = ReplaySession(
            session_id=session_id,
            recording_session_id=recording_id,
            player=player,
            created_at=created,
        )

        data = session.to_dict()

        assert data["session_id"] == str(session_id)
        assert data["recording_session_id"] == str(recording_id)
        assert data["state"] == "STOPPED"
        assert data["progress"] == 0.0
        assert data["message_count"] == 3


# ============================================================================
# ReplayService Initialization Tests
# ============================================================================


class TestReplayServiceInit:
    """Tests for ReplayService initialization."""

    def test_service_init(self, mock_db_session):
        """ReplayService initializes with database session."""
        service = ReplayService(db=mock_db_session)
        assert service.db is mock_db_session
        assert len(service.sessions) == 0

    def test_service_has_sessions_dict(self, mock_db_session):
        """ReplayService maintains session dictionary."""
        service = ReplayService(db=mock_db_session)
        assert isinstance(service.sessions, dict)


# ============================================================================
# ReplayService Session Management Tests
# ============================================================================


class TestReplayServiceSessionManagement:
    """Tests for replay session lifecycle."""

    @pytest.mark.asyncio
    async def test_create_session(self, mock_db_session, sample_messages):
        """create_session() creates new replay session."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        # Mock the message loader
        with patch.object(
            service, "_load_messages", return_value=sample_messages
        ) as mock_load:
            session = await service.create_session(recording_id)

            mock_load.assert_called_once_with(recording_id, None, None)
            assert session.recording_session_id == recording_id
            assert session.session_id in service.sessions
            assert len(session.player.messages) == 3

    @pytest.mark.asyncio
    async def test_create_session_with_config(self, mock_db_session, sample_messages):
        """create_session() accepts custom config."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
        config = ReplayConfig(speed=2.0, loop=True)

        with patch.object(service, "_load_messages", return_value=sample_messages):
            session = await service.create_session(recording_id, config=config)

            assert session.player.config.speed == 2.0
            assert session.player.config.loop is True

    @pytest.mark.asyncio
    async def test_create_session_with_time_range(self, mock_db_session, sample_messages):
        """create_session() supports time range filtering."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
        start = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        end = datetime(2024, 1, 1, 12, 1, 0, tzinfo=timezone.utc)

        with patch.object(
            service, "_load_messages", return_value=sample_messages
        ) as mock_load:
            await service.create_session(recording_id, start_time=start, end_time=end)

            mock_load.assert_called_once_with(recording_id, start, end)

    @pytest.mark.asyncio
    async def test_get_session(self, mock_db_session, sample_messages):
        """get_session() retrieves existing session."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        with patch.object(service, "_load_messages", return_value=sample_messages):
            created = await service.create_session(recording_id)
            retrieved = service.get_session(created.session_id)

            assert retrieved is created

    def test_get_session_not_found(self, mock_db_session):
        """get_session() raises error for unknown session."""
        service = ReplayService(db=mock_db_session)

        with pytest.raises(ReplaySessionNotFoundError):
            service.get_session(uuid.uuid4())

    @pytest.mark.asyncio
    async def test_delete_session(self, mock_db_session, sample_messages):
        """delete_session() removes session."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        with patch.object(service, "_load_messages", return_value=sample_messages):
            session = await service.create_session(recording_id)
            session_id = session.session_id

            service.delete_session(session_id)

            assert session_id not in service.sessions

    def test_delete_session_not_found(self, mock_db_session):
        """delete_session() raises error for unknown session."""
        service = ReplayService(db=mock_db_session)

        with pytest.raises(ReplaySessionNotFoundError):
            service.delete_session(uuid.uuid4())

    @pytest.mark.asyncio
    async def test_list_sessions(self, mock_db_session, sample_messages):
        """list_sessions() returns all sessions."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        with patch.object(service, "_load_messages", return_value=sample_messages):
            await service.create_session(recording_id)
            await service.create_session(recording_id)

        sessions = service.list_sessions()

        assert len(sessions) == 2


# ============================================================================
# ReplayService Playback Control Tests
# ============================================================================


class TestReplayServicePlaybackControl:
    """Tests for playback control via service."""

    @pytest.mark.asyncio
    async def test_play(self, mock_db_session, sample_messages):
        """play() starts playback for session."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        with patch.object(service, "_load_messages", return_value=sample_messages):
            session = await service.create_session(
                recording_id, config=ReplayConfig(speed=100.0)
            )

        # Start playback (runs in background)
        task = service.play(session.session_id)
        assert task is not None

        # Wait for playback to complete (fast speed)
        await task

        assert session.player.state == PlaybackState.STOPPED

    @pytest.mark.asyncio
    async def test_pause(self, mock_db_session, sample_messages):
        """pause() pauses playback."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        with patch.object(service, "_load_messages", return_value=sample_messages):
            session = await service.create_session(recording_id)

        # Start and pause
        task = service.play(session.session_id)
        import asyncio
        await asyncio.sleep(0.01)

        service.pause(session.session_id)
        assert session.player.state == PlaybackState.PAUSED

        # Clean up
        service.stop(session.session_id)
        await task

    @pytest.mark.asyncio
    async def test_resume(self, mock_db_session, sample_messages):
        """resume() resumes paused playback."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        # Use slower speed so we can pause before completion
        with patch.object(service, "_load_messages", return_value=sample_messages):
            session = await service.create_session(
                recording_id, config=ReplayConfig(speed=1.0)
            )

        # Start, pause, resume
        task = service.play(session.session_id)
        import asyncio
        await asyncio.sleep(0.01)

        service.pause(session.session_id)
        assert session.player.state == PlaybackState.PAUSED

        service.resume(session.session_id)
        assert session.player.state == PlaybackState.PLAYING

        # Stop to clean up (don't wait for slow completion)
        service.stop(session.session_id)
        await task

    @pytest.mark.asyncio
    async def test_stop(self, mock_db_session, sample_messages):
        """stop() stops playback."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        with patch.object(service, "_load_messages", return_value=sample_messages):
            session = await service.create_session(recording_id)

        task = service.play(session.session_id)
        import asyncio
        await asyncio.sleep(0.01)

        service.stop(session.session_id)
        await task

        assert session.player.state == PlaybackState.STOPPED

    @pytest.mark.asyncio
    async def test_seek(self, mock_db_session, sample_messages):
        """seek() moves playback position."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        with patch.object(service, "_load_messages", return_value=sample_messages):
            session = await service.create_session(recording_id)

        service.seek(session.session_id, 2)

        assert session.player.current_index == 2

    @pytest.mark.asyncio
    async def test_set_speed(self, mock_db_session, sample_messages):
        """set_speed() changes playback speed."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        with patch.object(service, "_load_messages", return_value=sample_messages):
            session = await service.create_session(recording_id)

        service.set_speed(session.session_id, 5.0)

        assert session.player.config.speed == 5.0


# ============================================================================
# ReplayService Status Tests
# ============================================================================


class TestReplayServiceStatus:
    """Tests for session status queries."""

    @pytest.mark.asyncio
    async def test_get_status(self, mock_db_session, sample_messages):
        """get_status() returns session status."""
        service = ReplayService(db=mock_db_session)
        recording_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

        with patch.object(service, "_load_messages", return_value=sample_messages):
            session = await service.create_session(recording_id)

        status = service.get_status(session.session_id)

        assert status["session_id"] == str(session.session_id)
        assert status["state"] == "STOPPED"
        assert status["progress"] == 0.0
        assert status["current_index"] == 0
        assert status["message_count"] == 3

    def test_get_status_not_found(self, mock_db_session):
        """get_status() raises error for unknown session."""
        service = ReplayService(db=mock_db_session)

        with pytest.raises(ReplaySessionNotFoundError):
            service.get_status(uuid.uuid4())
