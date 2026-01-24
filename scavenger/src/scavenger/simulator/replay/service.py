"""ReplayService - API layer for managing replay sessions.

Provides session lifecycle management and playback control for
recorded SECS/GEM message sequences.
"""
import asyncio
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.simulator.common.messages import HsmsMessage
from scavenger.simulator.replay.player import PlaybackState, ReplayConfig, ReplayPlayer


class ReplaySessionNotFoundError(Exception):
    """Raised when a replay session is not found."""

    def __init__(self, session_id: uuid.UUID) -> None:
        super().__init__(f"Replay session not found: {session_id}")
        self.session_id = session_id


@dataclass
class ReplaySession:
    """Active replay session.

    Attributes:
        session_id: Unique identifier for this replay session
        recording_session_id: ID of the HSMS recording being replayed
        player: ReplayPlayer instance managing playback
        created_at: When the session was created
    """

    session_id: uuid.UUID
    recording_session_id: uuid.UUID
    player: ReplayPlayer
    created_at: datetime

    def to_dict(self) -> dict[str, Any]:
        """Serialize session info to dictionary."""
        return {
            "session_id": str(self.session_id),
            "recording_session_id": str(self.recording_session_id),
            "state": self.player.state.name,
            "progress": self.player.progress,
            "current_index": self.player.current_index,
            "message_count": len(self.player.messages),
            "duration_seconds": self.player.duration.total_seconds(),
            "created_at": self.created_at.isoformat(),
        }


class ReplayService:
    """Service for managing replay sessions.

    Provides CRUD operations for replay sessions and delegates playback
    control to underlying ReplayPlayer instances.

    Example:
        >>> service = ReplayService(db=async_session)
        >>> session = await service.create_session(recording_id)
        >>> task = service.play(session.session_id)
        >>> service.pause(session.session_id)
        >>> service.set_speed(session.session_id, 2.0)
        >>> service.resume(session.session_id)
        >>> await task
    """

    def __init__(self, db: AsyncSession) -> None:
        """Initialize service.

        Args:
            db: Async database session for loading messages
        """
        self._db = db
        self._sessions: dict[uuid.UUID, ReplaySession] = {}
        self._playback_tasks: dict[uuid.UUID, asyncio.Task[None]] = {}

    # -------------------------------------------------------------------------
    # Properties
    # -------------------------------------------------------------------------

    @property
    def db(self) -> AsyncSession:
        """Get database session."""
        return self._db

    @property
    def sessions(self) -> dict[uuid.UUID, ReplaySession]:
        """Get active sessions dictionary."""
        return self._sessions

    # -------------------------------------------------------------------------
    # Session Lifecycle
    # -------------------------------------------------------------------------

    async def create_session(
        self,
        recording_session_id: uuid.UUID,
        *,
        config: ReplayConfig | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
    ) -> ReplaySession:
        """Create a new replay session.

        Args:
            recording_session_id: ID of the HSMS recording to replay
            config: Playback configuration
            start_time: Optional filter for message start time
            end_time: Optional filter for message end time

        Returns:
            The created ReplaySession
        """
        # Load messages from database
        messages = await self._load_messages(
            recording_session_id, start_time, end_time
        )

        # Create player
        player = ReplayPlayer(messages=messages, config=config or ReplayConfig())

        # Create session
        session = ReplaySession(
            session_id=uuid.uuid4(),
            recording_session_id=recording_session_id,
            player=player,
            created_at=datetime.now(timezone.utc),
        )

        self._sessions[session.session_id] = session
        return session

    def get_session(self, session_id: uuid.UUID) -> ReplaySession:
        """Get an existing replay session.

        Args:
            session_id: Session identifier

        Returns:
            The ReplaySession

        Raises:
            ReplaySessionNotFoundError: If session not found
        """
        session = self._sessions.get(session_id)
        if session is None:
            raise ReplaySessionNotFoundError(session_id)
        return session

    def delete_session(self, session_id: uuid.UUID) -> None:
        """Delete a replay session.

        Stops playback if running and removes the session.

        Args:
            session_id: Session identifier

        Raises:
            ReplaySessionNotFoundError: If session not found
        """
        session = self.get_session(session_id)

        # Stop playback if running
        if session.player.state in (PlaybackState.PLAYING, PlaybackState.PAUSED):
            session.player.stop()

        # Cancel task if exists
        task = self._playback_tasks.pop(session_id, None)
        if task is not None and not task.done():
            task.cancel()

        del self._sessions[session_id]

    def list_sessions(self) -> list[ReplaySession]:
        """List all active replay sessions.

        Returns:
            List of ReplaySession objects
        """
        return list(self._sessions.values())

    # -------------------------------------------------------------------------
    # Playback Control
    # -------------------------------------------------------------------------

    def play(self, session_id: uuid.UUID) -> asyncio.Task[None]:
        """Start playback for a session.

        Args:
            session_id: Session identifier

        Returns:
            The playback task

        Raises:
            ReplaySessionNotFoundError: If session not found
        """
        session = self.get_session(session_id)

        # Create and track the playback task
        task = asyncio.create_task(session.player.play())
        self._playback_tasks[session_id] = task

        return task

    def pause(self, session_id: uuid.UUID) -> None:
        """Pause playback.

        Args:
            session_id: Session identifier

        Raises:
            ReplaySessionNotFoundError: If session not found
        """
        session = self.get_session(session_id)
        session.player.pause()

    def resume(self, session_id: uuid.UUID) -> None:
        """Resume paused playback.

        Args:
            session_id: Session identifier

        Raises:
            ReplaySessionNotFoundError: If session not found
        """
        session = self.get_session(session_id)
        session.player.resume()

    def stop(self, session_id: uuid.UUID) -> None:
        """Stop playback.

        Args:
            session_id: Session identifier

        Raises:
            ReplaySessionNotFoundError: If session not found
        """
        session = self.get_session(session_id)
        session.player.stop()

    def seek(self, session_id: uuid.UUID, index: int) -> None:
        """Seek to a specific message index.

        Args:
            session_id: Session identifier
            index: Target message index

        Raises:
            ReplaySessionNotFoundError: If session not found
        """
        session = self.get_session(session_id)
        session.player.seek(index)

    def set_speed(self, session_id: uuid.UUID, speed: float) -> None:
        """Set playback speed.

        Args:
            session_id: Session identifier
            speed: Speed multiplier

        Raises:
            ReplaySessionNotFoundError: If session not found
        """
        session = self.get_session(session_id)
        session.player.set_speed(speed)

    # -------------------------------------------------------------------------
    # Status
    # -------------------------------------------------------------------------

    def get_status(self, session_id: uuid.UUID) -> dict[str, Any]:
        """Get playback status for a session.

        Args:
            session_id: Session identifier

        Returns:
            Status dictionary with state, progress, etc.

        Raises:
            ReplaySessionNotFoundError: If session not found
        """
        session = self.get_session(session_id)
        return session.to_dict()

    # -------------------------------------------------------------------------
    # Internal Methods
    # -------------------------------------------------------------------------

    async def _load_messages(
        self,
        recording_session_id: uuid.UUID,
        start_time: datetime | None,
        end_time: datetime | None,
    ) -> list[HsmsMessage]:
        """Load messages from database.

        This method should be overridden or mocked in tests.
        In production, it queries the secs_messages table.

        Args:
            recording_session_id: Session to load messages for
            start_time: Optional start filter
            end_time: Optional end filter

        Returns:
            List of HsmsMessage objects
        """
        # TODO: Implement actual database query
        # This would query secs_messages table and convert to HsmsMessage
        # For now, return empty list (tests will mock this)
        return []
