# scavenger/tests/db/test_hsms_session.py
import uuid
from datetime import datetime, timezone

import pytest

from scavenger.db.models.hsms_session import (
    HsmsSession,
    SessionType,
    LocalRole,
)


def test_hsms_session_model_attributes():
    """HsmsSession model has required fields."""
    session = HsmsSession(
        id=uuid.uuid4(),
        session_type=SessionType.SIMULATION,
        local_role=LocalRole.EQUIPMENT,
        local_port=5000,
        started_at=datetime.now(timezone.utc),
    )

    assert session.session_type == SessionType.SIMULATION
    assert session.local_role == LocalRole.EQUIPMENT
    assert session.local_port == 5000


def test_session_type_enum():
    """SessionType enum has expected values."""
    assert SessionType.SIMULATION.value == "simulation"
    assert SessionType.EXTERNAL.value == "external"
    assert SessionType.REPLAY.value == "replay"


def test_local_role_enum():
    """LocalRole enum has expected values."""
    assert LocalRole.EQUIPMENT.value == "equipment"
    assert LocalRole.HOST.value == "host"
