# tests/db/test_secs_message.py
import uuid
from datetime import UTC, datetime

from scavenger.db.models.secs_message import Direction, SecsMessage


def test_secs_message_model_attributes():
    """SecsMessage model has required fields."""
    msg = SecsMessage(
        session_id=uuid.uuid4(),
        sequence_num=1,
        timestamp=datetime.now(UTC),
        direction=Direction.H2E,
        stream=1,
        function=13,
        wbit=True,
        raw_sml="S1F13 W",
    )

    assert msg.direction == Direction.H2E
    assert msg.stream == 1
    assert msg.function == 13
    assert msg.wbit is True


def test_direction_enum():
    """Direction enum has expected values."""
    assert Direction.H2E.value == "H2E"
    assert Direction.E2H.value == "E2H"
