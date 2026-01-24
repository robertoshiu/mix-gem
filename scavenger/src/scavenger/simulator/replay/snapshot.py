"""ReplaySnapshot - State snapshots for replay seeking and forking.

Provides point-in-time snapshots of replay player state that can be
used to:
- Seek back to a specific moment
- Fork a new player from a saved state
- Bookmark interesting positions in a replay
"""
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from scavenger.simulator.replay.player import ReplayConfig, ReplayPlayer


class SnapshotNotFoundError(Exception):
    """Raised when a snapshot is not found."""

    def __init__(self, snapshot_id: uuid.UUID) -> None:
        super().__init__(f"Snapshot not found: {snapshot_id}")
        self.snapshot_id = snapshot_id


@dataclass
class ReplaySnapshot:
    """Point-in-time snapshot of replay player state.

    Captures the essential state needed to restore a player to
    a specific position.

    Attributes:
        snapshot_id: Unique identifier for this snapshot
        name: Human-readable name/description
        message_index: Index of current message at snapshot time
        message_timestamp: Timestamp of message at snapshot time
        speed: Playback speed at snapshot time
        loop: Loop setting at snapshot time
        created_at: When snapshot was created
    """

    snapshot_id: uuid.UUID
    name: str
    message_index: int
    message_timestamp: datetime | None
    speed: float
    loop: bool
    created_at: datetime

    @classmethod
    def from_player(
        cls,
        player: ReplayPlayer,
        name: str | None = None,
    ) -> "ReplaySnapshot":
        """Create snapshot from current player state.

        Args:
            player: Player to snapshot
            name: Optional name, generated if not provided

        Returns:
            New ReplaySnapshot
        """
        current_msg = player.current_message
        msg_timestamp = current_msg.timestamp if current_msg else None

        generated_name = name or f"snapshot_index_{player.current_index}"

        return cls(
            snapshot_id=uuid.uuid4(),
            name=generated_name,
            message_index=player.current_index,
            message_timestamp=msg_timestamp,
            speed=player.config.speed,
            loop=player.config.loop,
            created_at=datetime.now(UTC),
        )

    def to_dict(self) -> dict[str, Any]:
        """Serialize snapshot to dictionary."""
        return {
            "snapshot_id": str(self.snapshot_id),
            "name": self.name,
            "message_index": self.message_index,
            "message_timestamp": (
                self.message_timestamp.isoformat()
                if self.message_timestamp
                else None
            ),
            "speed": self.speed,
            "loop": self.loop,
            "created_at": self.created_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "ReplaySnapshot":
        """Deserialize snapshot from dictionary.

        Args:
            data: Dictionary representation

        Returns:
            Restored ReplaySnapshot
        """
        msg_ts = data.get("message_timestamp")
        return cls(
            snapshot_id=uuid.UUID(data["snapshot_id"]),
            name=data["name"],
            message_index=data["message_index"],
            message_timestamp=(
                datetime.fromisoformat(msg_ts) if msg_ts else None
            ),
            speed=data["speed"],
            loop=data["loop"],
            created_at=datetime.fromisoformat(data["created_at"]),
        )


class SnapshotManager:
    """Manages snapshots for a replay player.

    Provides CRUD operations for snapshots and the ability to
    seek to or fork from saved snapshots.

    Example:
        >>> player = ReplayPlayer(messages=messages)
        >>> manager = SnapshotManager(player)
        >>>
        >>> player.seek(100)
        >>> snap = manager.create_snapshot("interesting_point")
        >>>
        >>> player.seek(200)  # Move somewhere else
        >>>
        >>> manager.seek_to_snapshot(snap.snapshot_id)  # Go back
        >>> assert player.current_index == 100
        >>>
        >>> forked = manager.fork_from_snapshot(snap.snapshot_id)
        >>> # forked is a new player at index 100
    """

    def __init__(self, player: ReplayPlayer) -> None:
        """Initialize manager.

        Args:
            player: The player to manage snapshots for
        """
        self._player = player
        self._snapshots: dict[uuid.UUID, ReplaySnapshot] = {}
        self._creation_order: list[uuid.UUID] = []

    @property
    def player(self) -> ReplayPlayer:
        """Get the managed player."""
        return self._player

    @property
    def snapshots(self) -> dict[uuid.UUID, ReplaySnapshot]:
        """Get all snapshots."""
        return self._snapshots

    # -------------------------------------------------------------------------
    # Snapshot CRUD
    # -------------------------------------------------------------------------

    def create_snapshot(self, name: str | None = None) -> ReplaySnapshot:
        """Create a snapshot of current player state.

        Args:
            name: Optional name for the snapshot

        Returns:
            The created snapshot
        """
        snapshot = ReplaySnapshot.from_player(self._player, name=name)
        self._snapshots[snapshot.snapshot_id] = snapshot
        self._creation_order.append(snapshot.snapshot_id)
        return snapshot

    def get_snapshot(self, snapshot_id: uuid.UUID) -> ReplaySnapshot:
        """Get a snapshot by ID.

        Args:
            snapshot_id: Snapshot identifier

        Returns:
            The snapshot

        Raises:
            SnapshotNotFoundError: If snapshot not found
        """
        snapshot = self._snapshots.get(snapshot_id)
        if snapshot is None:
            raise SnapshotNotFoundError(snapshot_id)
        return snapshot

    def delete_snapshot(self, snapshot_id: uuid.UUID) -> None:
        """Delete a snapshot.

        Args:
            snapshot_id: Snapshot identifier

        Raises:
            SnapshotNotFoundError: If snapshot not found
        """
        if snapshot_id not in self._snapshots:
            raise SnapshotNotFoundError(snapshot_id)

        del self._snapshots[snapshot_id]
        self._creation_order.remove(snapshot_id)

    def list_snapshots(self) -> list[ReplaySnapshot]:
        """List all snapshots in creation order.

        Returns:
            List of snapshots ordered by creation time
        """
        return [self._snapshots[sid] for sid in self._creation_order]

    # -------------------------------------------------------------------------
    # Seek and Fork
    # -------------------------------------------------------------------------

    def seek_to_snapshot(
        self,
        snapshot_id: uuid.UUID,
        *,
        restore_config: bool = False,
    ) -> None:
        """Seek player to snapshot position.

        Args:
            snapshot_id: Snapshot to seek to
            restore_config: If True, also restore speed/loop settings

        Raises:
            SnapshotNotFoundError: If snapshot not found
        """
        snapshot = self.get_snapshot(snapshot_id)

        self._player.seek(snapshot.message_index)

        if restore_config:
            self._player.set_speed(snapshot.speed)
            self._player.config.loop = snapshot.loop

    def fork_from_snapshot(self, snapshot_id: uuid.UUID) -> ReplayPlayer:
        """Create a new player from snapshot state.

        The new player shares the same message list but has independent
        position and configuration.

        Args:
            snapshot_id: Snapshot to fork from

        Returns:
            New ReplayPlayer at snapshot position

        Raises:
            SnapshotNotFoundError: If snapshot not found
        """
        snapshot = self.get_snapshot(snapshot_id)

        # Create new config with snapshot settings
        config = ReplayConfig(
            speed=snapshot.speed,
            loop=snapshot.loop,
            start_index=0,
            end_index=None,
        )

        # Create new player with same messages but independent state
        forked = ReplayPlayer(
            messages=self._player.messages,  # Shares reference
            config=config,
        )

        # Seek to snapshot position
        forked.seek(snapshot.message_index)

        return forked
