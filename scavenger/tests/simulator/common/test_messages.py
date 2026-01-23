"""Tests for message dataclasses."""
import uuid
from datetime import datetime, timezone

import pytest

from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
)


def test_hsms_message_type_enum():
    """HsmsMessageType enum has all HSMS message types."""
    assert HsmsMessageType.DATA_MESSAGE.value == 0
    assert HsmsMessageType.SELECT_REQ.value == 1
    assert HsmsMessageType.SELECT_RSP.value == 2
    assert HsmsMessageType.LINKTEST_REQ.value == 5
    assert HsmsMessageType.LINKTEST_RSP.value == 6
    assert HsmsMessageType.SEPARATE_REQ.value == 9


def test_secs_message_data():
    """SecsMessageData holds SECS-II message info."""
    msg = SecsMessageData(
        stream=1,
        function=13,
        wbit=True,
        system_bytes=b"\x00\x00\x00\x01",
        body={"MDLN": "Test", "SOFTREV": "1.0"},
    )

    assert msg.stream == 1
    assert msg.function == 13
    assert msg.sf == "S1F13"


def test_hsms_message():
    """HsmsMessage wraps SECS data with session context."""
    secs_data = SecsMessageData(stream=1, function=1, wbit=True)
    hsms = HsmsMessage(
        session_id=uuid.uuid4(),
        timestamp=datetime.now(timezone.utc),
        direction="H2E",
        message_type=HsmsMessageType.DATA_MESSAGE,
        data=secs_data,
    )

    assert hsms.direction == "H2E"
    assert hsms.data.stream == 1
