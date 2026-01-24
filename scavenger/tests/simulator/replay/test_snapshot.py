"""Tests for ReplaySnapshot - state snapshots for replay forking."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest

from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
)
from scavenger.simulator.replay.player import ReplayConfig, ReplayPlayer
from scavenger.simulator.replay.snapshot import (
    ReplaySnapshot,
    SnapshotManager,
    SnapshotNotFoundError,
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
def sample_messages() -> list[HsmsMessage]:
    """Sample message sequence."""
    sid = uuid.UUID("00000000-0000-0000-0000-000000000001")
    return [
        make_message(1, sid, 0.0),
        make_message(2, sid, 0.1),
        make_message(3, sid, 0.5),
        make_message(4, sid, 1.0),
        make_message(5, sid, 2.0),
    ]


@pytest.fixture
def player_at_index_2(sample_messages) -> ReplayPlayer:
    """Player seeked to index 2."""
    player = ReplayPlayer(messages=sample_messages)
    player.seek(2)
    return player


# ============================================================================
# ReplaySnapshot Tests
# ============================================================================


class TestReplaySnapshot:
    """Tests for ReplaySnapshot dataclass."""

    def test_snapshot_creation(self, player_at_index_2):
        """ReplaySnapshot can be created from player state."""
        snapshot = ReplaySnapshot.from_player(
            player=player_at_index_2,
            name="test_snapshot",
        )

        assert snapshot.snapshot_id is not None
        assert snapshot.name == "test_snapshot"
        assert snapshot.message_index == 2
        assert snapshot.created_at is not None

    def test_snapshot_without_name(self, player_at_index_2):
        """ReplaySnapshot generates name if not provided."""
        snapshot = ReplaySnapshot.from_player(player=player_at_index_2)

        assert snapshot.name is not None
        assert "index_2" in snapshot.name

    def test_snapshot_captures_config(self, sample_messages):
        """ReplaySnapshot captures player config."""
        config = ReplayConfig(speed=3.0, loop=True)
        player = ReplayPlayer(messages=sample_messages, config=config)
        player.seek(1)

        snapshot = ReplaySnapshot.from_player(player=player)

        assert snapshot.speed == 3.0
        assert snapshot.loop is True

    def test_snapshot_to_dict(self, player_at_index_2):
        """ReplaySnapshot serializes to dictionary."""
        snapshot = ReplaySnapshot.from_player(
            player=player_at_index_2,
            name="test_snapshot",
        )

        data = snapshot.to_dict()

        assert "snapshot_id" in data
        assert data["name"] == "test_snapshot"
        assert data["message_index"] == 2
        assert "created_at" in data

    def test_snapshot_from_dict(self, player_at_index_2):
        """ReplaySnapshot can be recreated from dictionary."""
        original = ReplaySnapshot.from_player(
            player=player_at_index_2,
            name="test_snapshot",
        )
        data = original.to_dict()

        restored = ReplaySnapshot.from_dict(data)

        assert restored.snapshot_id == original.snapshot_id
        assert restored.name == original.name
        assert restored.message_index == original.message_index


# ============================================================================
# SnapshotManager Tests
# ============================================================================


class TestSnapshotManager:
    """Tests for SnapshotManager."""

    def test_manager_init(self, sample_messages):
        """SnapshotManager initializes with player."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        assert manager.player is player
        assert len(manager.snapshots) == 0

    def test_create_snapshot(self, sample_messages):
        """create_snapshot() captures current state."""
        player = ReplayPlayer(messages=sample_messages)
        player.seek(3)
        manager = SnapshotManager(player=player)

        snapshot = manager.create_snapshot(name="at_index_3")

        assert snapshot.message_index == 3
        assert snapshot.snapshot_id in manager.snapshots

    def test_create_multiple_snapshots(self, sample_messages):
        """Multiple snapshots can be created."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        player.seek(1)
        snap1 = manager.create_snapshot("snap1")

        player.seek(3)
        snap2 = manager.create_snapshot("snap2")

        assert len(manager.snapshots) == 2
        assert snap1.message_index == 1
        assert snap2.message_index == 3

    def test_get_snapshot(self, sample_messages):
        """get_snapshot() retrieves existing snapshot."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        created = manager.create_snapshot("test")
        retrieved = manager.get_snapshot(created.snapshot_id)

        assert retrieved is created

    def test_get_snapshot_not_found(self, sample_messages):
        """get_snapshot() raises error for unknown ID."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        with pytest.raises(SnapshotNotFoundError):
            manager.get_snapshot(uuid.uuid4())

    def test_delete_snapshot(self, sample_messages):
        """delete_snapshot() removes snapshot."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        snapshot = manager.create_snapshot("test")
        manager.delete_snapshot(snapshot.snapshot_id)

        assert snapshot.snapshot_id not in manager.snapshots

    def test_delete_snapshot_not_found(self, sample_messages):
        """delete_snapshot() raises error for unknown ID."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        with pytest.raises(SnapshotNotFoundError):
            manager.delete_snapshot(uuid.uuid4())

    def test_list_snapshots(self, sample_messages):
        """list_snapshots() returns all snapshots."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        manager.create_snapshot("snap1")
        manager.create_snapshot("snap2")

        snapshots = manager.list_snapshots()

        assert len(snapshots) == 2

    def test_list_snapshots_ordered_by_creation(self, sample_messages):
        """list_snapshots() returns snapshots in creation order."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        snap1 = manager.create_snapshot("first")
        snap2 = manager.create_snapshot("second")

        snapshots = manager.list_snapshots()

        assert snapshots[0].snapshot_id == snap1.snapshot_id
        assert snapshots[1].snapshot_id == snap2.snapshot_id


# ============================================================================
# Seek to Snapshot Tests
# ============================================================================


class TestSeekToSnapshot:
    """Tests for seeking to snapshots."""

    def test_seek_to_snapshot(self, sample_messages):
        """seek_to_snapshot() restores player position."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        player.seek(2)
        snapshot = manager.create_snapshot("at_2")

        player.seek(4)  # Move away

        manager.seek_to_snapshot(snapshot.snapshot_id)

        assert player.current_index == 2

    def test_seek_to_snapshot_restores_speed(self, sample_messages):
        """seek_to_snapshot() optionally restores speed."""
        config = ReplayConfig(speed=5.0)
        player = ReplayPlayer(messages=sample_messages, config=config)
        manager = SnapshotManager(player=player)

        player.seek(1)
        snapshot = manager.create_snapshot("fast")

        player.set_speed(1.0)  # Change speed

        manager.seek_to_snapshot(snapshot.snapshot_id, restore_config=True)

        assert player.config.speed == 5.0

    def test_seek_to_snapshot_not_found(self, sample_messages):
        """seek_to_snapshot() raises error for unknown ID."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        with pytest.raises(SnapshotNotFoundError):
            manager.seek_to_snapshot(uuid.uuid4())


# ============================================================================
# Fork from Snapshot Tests
# ============================================================================


class TestForkFromSnapshot:
    """Tests for forking a new player from snapshot."""

    def test_fork_from_snapshot(self, sample_messages):
        """fork_from_snapshot() creates new player at snapshot position."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        player.seek(3)
        snapshot = manager.create_snapshot("fork_point")

        forked = manager.fork_from_snapshot(snapshot.snapshot_id)

        assert forked is not player
        assert forked.current_index == 3
        assert len(forked.messages) == len(player.messages)

    def test_fork_preserves_config(self, sample_messages):
        """fork_from_snapshot() preserves configuration."""
        config = ReplayConfig(speed=2.5, loop=True)
        player = ReplayPlayer(messages=sample_messages, config=config)
        manager = SnapshotManager(player=player)

        snapshot = manager.create_snapshot("configured")

        forked = manager.fork_from_snapshot(snapshot.snapshot_id)

        assert forked.config.speed == 2.5
        assert forked.config.loop is True

    def test_fork_not_found(self, sample_messages):
        """fork_from_snapshot() raises error for unknown ID."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        with pytest.raises(SnapshotNotFoundError):
            manager.fork_from_snapshot(uuid.uuid4())

    def test_forked_player_independent(self, sample_messages):
        """Forked player is independent of original."""
        player = ReplayPlayer(messages=sample_messages)
        manager = SnapshotManager(player=player)

        player.seek(2)
        snapshot = manager.create_snapshot("point")
        forked = manager.fork_from_snapshot(snapshot.snapshot_id)

        # Modify original
        player.seek(4)
        player.set_speed(10.0)

        # Forked should be unchanged
        assert forked.current_index == 2
        assert forked.config.speed != 10.0
