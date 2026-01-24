"""ReplayPlayer - Playback engine for recorded SECS/GEM sessions.

Provides time-accurate playback of recorded message sequences with:
- Speed control (0.1x to 100x)
- Pause/resume functionality
- Seek by index or timestamp
- Loop mode
- Callback-based message emission
"""
import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum, auto

from scavenger.simulator.common.messages import HsmsMessage


# Type alias for message callback
MessageCallback = Callable[[HsmsMessage], Awaitable[None]]


class PlaybackState(Enum):
    """Playback state enumeration."""

    STOPPED = auto()
    PLAYING = auto()
    PAUSED = auto()


@dataclass
class ReplayConfig:
    """Configuration for replay playback.

    Attributes:
        speed: Playback speed multiplier (1.0 = realtime, 2.0 = 2x speed)
        loop: Whether to loop back to start after completing
        start_index: Index of first message to play
        end_index: Index to stop at (exclusive), None for end
    """

    speed: float = 1.0
    loop: bool = False
    start_index: int = 0
    end_index: int | None = None


class ReplayPlayer:
    """Playback engine for recorded SECS/GEM message sequences.

    Plays back messages with timing that matches the original recording,
    adjusted by the speed multiplier. Supports pause/resume, seeking,
    and loop mode.

    Example:
        >>> messages = load_messages_from_db(session_id)
        >>> async def on_message(msg):
        ...     print(f"Playing: {msg.data.sf}")
        >>> player = ReplayPlayer(messages, on_message=on_message)
        >>> await player.play()
    """

    # Speed limits
    MIN_SPEED = 0.1
    MAX_SPEED = 100.0

    def __init__(
        self,
        messages: list[HsmsMessage],
        config: ReplayConfig | None = None,
        on_message: MessageCallback | None = None,
    ) -> None:
        """Initialize replay player.

        Args:
            messages: List of messages to play back, sorted by timestamp
            config: Playback configuration
            on_message: Async callback invoked for each message played
        """
        self._messages = messages
        self._config = config or ReplayConfig()
        self._on_message = on_message

        self._state = PlaybackState.STOPPED
        self._current_index = self._config.start_index
        self._pause_event = asyncio.Event()
        self._stop_requested = False

    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------

    @property
    def messages(self) -> list[HsmsMessage]:
        """Get the message list."""
        return self._messages

    @property
    def config(self) -> ReplayConfig:
        """Get current configuration."""
        return self._config

    @property
    def state(self) -> PlaybackState:
        """Get current playback state."""
        return self._state

    @property
    def current_index(self) -> int:
        """Get current message index."""
        return self._current_index

    @property
    def current_message(self) -> HsmsMessage | None:
        """Get the message at current index, or None if empty."""
        if not self._messages or self._current_index >= len(self._messages):
            return None
        return self._messages[self._current_index]

    @property
    def progress(self) -> float:
        """Get playback progress as a fraction (0.0 to 1.0)."""
        if not self._messages:
            return 0.0
        return self._current_index / len(self._messages)

    @property
    def duration(self) -> timedelta:
        """Get total duration of the message sequence."""
        if len(self._messages) < 2:
            return timedelta(0)
        first = self._messages[0].timestamp
        last = self._messages[-1].timestamp
        return last - first

    # -------------------------------------------------------------------------
    # Playback Control
    # -------------------------------------------------------------------------

    async def play(self) -> None:
        """Start or resume playback.

        Plays messages from current_index through end_index (or end of list),
        respecting timing between messages adjusted by speed multiplier.

        If loop is enabled, restarts from start_index after reaching end.
        """
        self._state = PlaybackState.PLAYING
        self._stop_requested = False
        self._pause_event.set()  # Allow playback to proceed

        end_index = self._config.end_index or len(self._messages)

        while not self._stop_requested:
            # Process messages in current run
            while self._current_index < end_index and not self._stop_requested:
                # Check for pause
                if self._state == PlaybackState.PAUSED:
                    self._pause_event.clear()
                    await self._pause_event.wait()
                    if self._stop_requested:
                        break

                # Get current message
                if self._current_index >= len(self._messages):
                    break

                msg = self._messages[self._current_index]

                # Calculate delay to next message
                if self._current_index < len(self._messages) - 1:
                    next_msg = self._messages[self._current_index + 1]
                    delay = (next_msg.timestamp - msg.timestamp).total_seconds()
                    delay = max(0, delay / self._config.speed)
                else:
                    delay = 0

                # Emit message via callback
                if self._on_message is not None:
                    await self._on_message(msg)

                self._current_index += 1

                # Apply delay before next message (if not last)
                if delay > 0 and self._current_index < end_index:
                    await asyncio.sleep(delay)

            # Check for loop
            if self._config.loop and not self._stop_requested:
                self._current_index = self._config.start_index
            else:
                break

        self._state = PlaybackState.STOPPED

    def pause(self) -> None:
        """Pause playback.

        Playback can be resumed with resume().
        """
        if self._state == PlaybackState.PLAYING:
            self._state = PlaybackState.PAUSED

    def resume(self) -> None:
        """Resume paused playback."""
        if self._state == PlaybackState.PAUSED:
            self._state = PlaybackState.PLAYING
            self._pause_event.set()

    def stop(self) -> None:
        """Stop playback completely.

        Resets state to STOPPED. Playback can be restarted with play().
        """
        self._stop_requested = True
        self._pause_event.set()  # Unblock if paused

    # -------------------------------------------------------------------------
    # Seeking
    # -------------------------------------------------------------------------

    def seek(self, index: int) -> None:
        """Seek to a specific message index.

        Args:
            index: Target message index (clamped to valid range)
        """
        if not self._messages:
            self._current_index = 0
            return

        self._current_index = max(0, min(index, len(self._messages) - 1))

    def seek_to_time(self, timestamp: datetime) -> None:
        """Seek to message at or before specified timestamp.

        Args:
            timestamp: Target timestamp
        """
        if not self._messages:
            self._current_index = 0
            return

        # Find the last message with timestamp <= target
        for i in range(len(self._messages) - 1, -1, -1):
            if self._messages[i].timestamp <= timestamp:
                self._current_index = i
                return

        # All messages are after timestamp
        self._current_index = 0

    # -------------------------------------------------------------------------
    # Speed Control
    # -------------------------------------------------------------------------

    def set_speed(self, speed: float) -> None:
        """Set playback speed.

        Args:
            speed: Speed multiplier (clamped to 0.1 - 100.0)
        """
        self._config.speed = max(self.MIN_SPEED, min(speed, self.MAX_SPEED))
