"""Tests for ReplayPlayer - playback engine for recorded SECS/GEM sessions."""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
)
from scavenger.simulator.replay.player import (
    PlaybackState,
    ReplayPlayer,
    ReplayConfig,
    MessageCallback,
)


# ============================================================================
# Test Data Fixtures
# ============================================================================


def make_message(
    sequence_num: int,
    stream: int = 1,
    function: int = 1,
    direction: str = "H2E",
    delta_seconds: float = 0.0,
) -> HsmsMessage:
    """Create a test HSMS message."""
    base_time = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    return HsmsMessage(
        session_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        timestamp=base_time + timedelta(seconds=delta_seconds),
        direction=direction,
        message_type=HsmsMessageType.DATA_MESSAGE,
        data=SecsMessageData(stream=stream, function=function, wbit=True),
        sequence_num=sequence_num,
    )


@pytest.fixture
def sample_messages() -> list[HsmsMessage]:
    """Sample message sequence with known timing."""
    return [
        make_message(1, 1, 13, "H2E", 0.0),    # 0s: S1F13 request
        make_message(2, 1, 14, "E2H", 0.05),   # 50ms: S1F14 reply
        make_message(3, 1, 3, "H2E", 1.0),     # 1s: S1F3 request
        make_message(4, 1, 4, "E2H", 1.02),    # 1.02s: S1F4 reply
        make_message(5, 2, 13, "H2E", 2.0),    # 2s: S2F13 request
    ]


# ============================================================================
# ReplayConfig Tests
# ============================================================================


class TestReplayConfig:
    """Tests for ReplayConfig dataclass."""

    def test_config_defaults(self):
        """ReplayConfig has sensible defaults."""
        config = ReplayConfig()
        assert config.speed == 1.0
        assert config.loop is False
        assert config.start_index == 0
        assert config.end_index is None

    def test_config_custom_values(self):
        """ReplayConfig accepts custom values."""
        config = ReplayConfig(speed=2.0, loop=True, start_index=5, end_index=10)
        assert config.speed == 2.0
        assert config.loop is True
        assert config.start_index == 5
        assert config.end_index == 10


# ============================================================================
# ReplayPlayer Initialization Tests
# ============================================================================


class TestReplayPlayerInit:
    """Tests for ReplayPlayer initialization."""

    def test_player_init_with_messages(self, sample_messages):
        """ReplayPlayer initializes with message list."""
        player = ReplayPlayer(messages=sample_messages)
        assert len(player.messages) == 5
        assert player.state == PlaybackState.STOPPED
        assert player.current_index == 0

    def test_player_init_empty_messages(self):
        """ReplayPlayer accepts empty message list."""
        player = ReplayPlayer(messages=[])
        assert len(player.messages) == 0
        assert player.state == PlaybackState.STOPPED

    def test_player_init_with_config(self, sample_messages):
        """ReplayPlayer accepts custom config."""
        config = ReplayConfig(speed=2.0, loop=True)
        player = ReplayPlayer(messages=sample_messages, config=config)
        assert player.config.speed == 2.0
        assert player.config.loop is True

    def test_player_init_with_callback(self, sample_messages):
        """ReplayPlayer accepts message callback."""
        called = []

        async def callback(msg: HsmsMessage) -> None:
            called.append(msg)

        player = ReplayPlayer(messages=sample_messages, on_message=callback)
        assert player._on_message is callback


# ============================================================================
# ReplayPlayer State Management Tests
# ============================================================================


class TestReplayPlayerState:
    """Tests for playback state management."""

    def test_initial_state_is_stopped(self, sample_messages):
        """Initial state is STOPPED."""
        player = ReplayPlayer(messages=sample_messages)
        assert player.state == PlaybackState.STOPPED

    @pytest.mark.asyncio
    async def test_play_changes_state_to_playing(self, sample_messages):
        """play() changes state to PLAYING."""
        player = ReplayPlayer(messages=sample_messages)

        # Start and immediately pause to check state
        task = asyncio.create_task(player.play())
        await asyncio.sleep(0.01)
        assert player.state == PlaybackState.PLAYING
        player.stop()
        await task

    @pytest.mark.asyncio
    async def test_pause_changes_state_to_paused(self, sample_messages):
        """pause() changes state to PAUSED."""
        player = ReplayPlayer(messages=sample_messages)

        task = asyncio.create_task(player.play())
        await asyncio.sleep(0.01)
        player.pause()
        assert player.state == PlaybackState.PAUSED
        player.stop()
        await task

    @pytest.mark.asyncio
    async def test_resume_changes_state_back_to_playing(self, sample_messages):
        """resume() changes state from PAUSED to PLAYING."""
        player = ReplayPlayer(messages=sample_messages)

        task = asyncio.create_task(player.play())
        await asyncio.sleep(0.01)
        player.pause()
        assert player.state == PlaybackState.PAUSED
        player.resume()
        assert player.state == PlaybackState.PLAYING
        player.stop()
        await task

    @pytest.mark.asyncio
    async def test_stop_changes_state_to_stopped(self, sample_messages):
        """stop() changes state to STOPPED."""
        player = ReplayPlayer(messages=sample_messages)

        task = asyncio.create_task(player.play())
        await asyncio.sleep(0.01)
        player.stop()
        await task
        assert player.state == PlaybackState.STOPPED


# ============================================================================
# ReplayPlayer Playback Tests
# ============================================================================


class TestReplayPlayerPlayback:
    """Tests for message playback."""

    @pytest.mark.asyncio
    async def test_play_emits_all_messages(self, sample_messages):
        """play() emits all messages via callback."""
        received: list[HsmsMessage] = []

        async def callback(msg: HsmsMessage) -> None:
            received.append(msg)

        # Use very fast speed for testing
        config = ReplayConfig(speed=100.0)
        player = ReplayPlayer(
            messages=sample_messages,
            config=config,
            on_message=callback,
        )

        await player.play()

        assert len(received) == 5
        assert received[0].sequence_num == 1
        assert received[-1].sequence_num == 5

    @pytest.mark.asyncio
    async def test_play_respects_message_timing(self):
        """play() respects timing between messages."""
        messages = [
            make_message(1, delta_seconds=0.0),
            make_message(2, delta_seconds=0.1),  # 100ms later
        ]
        received_times: list[datetime] = []

        async def callback(msg: HsmsMessage) -> None:
            received_times.append(datetime.now(timezone.utc))

        # Speed 10x means 100ms delay becomes 10ms
        config = ReplayConfig(speed=10.0)
        player = ReplayPlayer(messages=messages, config=config, on_message=callback)

        await player.play()

        assert len(received_times) == 2
        delta = (received_times[1] - received_times[0]).total_seconds()
        # Should be ~10ms at 10x speed, allow tolerance
        assert 0.005 <= delta <= 0.05

    @pytest.mark.asyncio
    async def test_play_with_loop(self):
        """play() loops when config.loop is True."""
        messages = [make_message(1), make_message(2)]
        received: list[int] = []
        loop_count = 0

        async def callback(msg: HsmsMessage) -> None:
            nonlocal loop_count
            received.append(msg.sequence_num)
            # Stop after 2 loops
            if msg.sequence_num == 2:
                loop_count += 1
                if loop_count >= 2:
                    player.stop()

        config = ReplayConfig(speed=100.0, loop=True)
        player = ReplayPlayer(messages=messages, config=config, on_message=callback)

        await player.play()

        # Should have received messages from 2 loops
        assert received == [1, 2, 1, 2]

    @pytest.mark.asyncio
    async def test_play_with_start_index(self, sample_messages):
        """play() starts from specified index."""
        received: list[int] = []

        async def callback(msg: HsmsMessage) -> None:
            received.append(msg.sequence_num)

        config = ReplayConfig(speed=100.0, start_index=2)
        player = ReplayPlayer(
            messages=sample_messages,
            config=config,
            on_message=callback,
        )

        await player.play()

        # Should start from index 2 (sequence_num 3)
        assert received == [3, 4, 5]

    @pytest.mark.asyncio
    async def test_play_with_end_index(self, sample_messages):
        """play() stops at specified end index."""
        received: list[int] = []

        async def callback(msg: HsmsMessage) -> None:
            received.append(msg.sequence_num)

        config = ReplayConfig(speed=100.0, end_index=3)
        player = ReplayPlayer(
            messages=sample_messages,
            config=config,
            on_message=callback,
        )

        await player.play()

        # Should stop before index 3
        assert received == [1, 2, 3]


# ============================================================================
# ReplayPlayer Seek Tests
# ============================================================================


class TestReplayPlayerSeek:
    """Tests for seeking within playback."""

    def test_seek_to_index(self, sample_messages):
        """seek() moves to specified index."""
        player = ReplayPlayer(messages=sample_messages)
        player.seek(3)
        assert player.current_index == 3

    def test_seek_clamps_to_bounds(self, sample_messages):
        """seek() clamps index within valid range."""
        player = ReplayPlayer(messages=sample_messages)

        player.seek(-1)
        assert player.current_index == 0

        player.seek(100)
        assert player.current_index == 4  # Last valid index

    def test_seek_to_timestamp(self, sample_messages):
        """seek_to_time() finds message at or before timestamp."""
        player = ReplayPlayer(messages=sample_messages)
        target = datetime(2024, 1, 1, 12, 0, 1, 500000, tzinfo=timezone.utc)  # 1.5s

        player.seek_to_time(target)

        # Should be at message with delta 1.02s (index 3)
        assert player.current_index == 3

    def test_seek_to_timestamp_before_start(self, sample_messages):
        """seek_to_time() before first message goes to index 0."""
        player = ReplayPlayer(messages=sample_messages)
        target = datetime(2024, 1, 1, 11, 59, 0, tzinfo=timezone.utc)

        player.seek_to_time(target)

        assert player.current_index == 0


# ============================================================================
# ReplayPlayer Progress Tests
# ============================================================================


class TestReplayPlayerProgress:
    """Tests for playback progress tracking."""

    def test_progress_at_start(self, sample_messages):
        """progress is 0.0 at start."""
        player = ReplayPlayer(messages=sample_messages)
        assert player.progress == 0.0

    def test_progress_mid_playback(self, sample_messages):
        """progress reflects current position."""
        player = ReplayPlayer(messages=sample_messages)
        player.seek(2)
        # 2/5 = 0.4
        assert player.progress == pytest.approx(0.4)

    def test_progress_at_end(self, sample_messages):
        """progress is close to 1.0 at end."""
        player = ReplayPlayer(messages=sample_messages)
        player.seek(4)
        # 4/5 = 0.8 (last message)
        assert player.progress == pytest.approx(0.8)

    def test_progress_empty_messages(self):
        """progress is 0.0 for empty message list."""
        player = ReplayPlayer(messages=[])
        assert player.progress == 0.0

    def test_current_message_property(self, sample_messages):
        """current_message returns message at current index."""
        player = ReplayPlayer(messages=sample_messages)
        player.seek(2)
        msg = player.current_message
        assert msg is not None
        assert msg.sequence_num == 3

    def test_current_message_empty(self):
        """current_message returns None for empty list."""
        player = ReplayPlayer(messages=[])
        assert player.current_message is None

    def test_duration_property(self, sample_messages):
        """duration returns time span of messages."""
        player = ReplayPlayer(messages=sample_messages)
        # Last message is at 2s, first at 0s
        assert player.duration == timedelta(seconds=2.0)

    def test_duration_empty(self):
        """duration returns zero for empty list."""
        player = ReplayPlayer(messages=[])
        assert player.duration == timedelta(0)


# ============================================================================
# ReplayPlayer Speed Control Tests
# ============================================================================


class TestReplayPlayerSpeed:
    """Tests for playback speed control."""

    def test_set_speed(self, sample_messages):
        """set_speed() updates playback speed."""
        player = ReplayPlayer(messages=sample_messages)
        player.set_speed(2.0)
        assert player.config.speed == 2.0

    def test_set_speed_clamps_minimum(self, sample_messages):
        """set_speed() enforces minimum speed."""
        player = ReplayPlayer(messages=sample_messages)
        player.set_speed(0.0)
        assert player.config.speed == 0.1  # Minimum speed

    def test_set_speed_clamps_maximum(self, sample_messages):
        """set_speed() enforces maximum speed."""
        player = ReplayPlayer(messages=sample_messages)
        player.set_speed(1000.0)
        assert player.config.speed == 100.0  # Maximum speed
