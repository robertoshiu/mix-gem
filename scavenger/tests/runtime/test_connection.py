import pytest
from scavenger.runtime.connection import ConnectionState, HsmsConnectionConfig


def test_connection_config_defaults():
    """HsmsConnectionConfig has sensible defaults."""
    config = HsmsConnectionConfig(host="localhost", port=5000)

    assert config.host == "localhost"
    assert config.port == 5000
    assert config.mode == "passive"
    assert config.t3_timeout == 45.0


def test_connection_state_enum():
    """ConnectionState has expected values."""
    assert ConnectionState.NOT_CONNECTED.value == "not_connected"
    assert ConnectionState.CONNECTED.value == "connected"
    assert ConnectionState.SELECTED.value == "selected"
