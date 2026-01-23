# tests/db/test_state_snapshot.py
import uuid

from scavenger.db.models.state_snapshot import SnapshotType, StateSnapshot


def test_state_snapshot_model_attributes():
    """StateSnapshot model has required fields."""
    snap = StateSnapshot(
        session_id=uuid.uuid4(),
        snapshot_type=SnapshotType.CHECKPOINT,
        equipment_state={"svs": {"SV1": 100}, "alarms": []},
    )

    assert snap.snapshot_type == SnapshotType.CHECKPOINT
    assert snap.equipment_state["svs"]["SV1"] == 100


def test_snapshot_type_enum():
    """SnapshotType enum has expected values."""
    assert SnapshotType.PERIODIC.value == "periodic"
    assert SnapshotType.CHECKPOINT.value == "checkpoint"
    assert SnapshotType.SCENARIO_STEP.value == "scenario_step"
