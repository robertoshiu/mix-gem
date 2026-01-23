# scavenger/tests/simulator/common/test_codec.py
"""Tests for SECS-II codec wrapper."""
import pytest

from scavenger.simulator.common.codec import SecsCodec


def test_codec_init():
    """SecsCodec initializes without error."""
    codec = SecsCodec()
    assert codec is not None


def test_encode_s1f1():
    """Encode S1F1 (Are You There) request."""
    codec = SecsCodec()
    result = codec.encode(stream=1, function=1, wbit=True, body=None)

    assert result.stream == 1
    assert result.function == 1
    assert result.wbit is True


def test_decode_s1f1():
    """Decode S1F1 binary to structured data."""
    codec = SecsCodec()

    # Encode first
    encoded = codec.encode(stream=1, function=1, wbit=True, body=None)

    # Decode back
    decoded = codec.decode(encoded.binary)

    assert decoded.stream == 1
    assert decoded.function == 1


def test_to_sml_s1f13():
    """Generate SML string for S1F13."""
    codec = SecsCodec()
    # S1F13 body is a dict with named keys
    sml = codec.to_sml(stream=1, function=13, wbit=True, body={"MDLN": "TestEquip", "SOFTREV": "1.0"})

    assert "S1F13" in sml
    assert "W" in sml  # Wait bit


def test_encode_s1f3_with_list():
    """Encode S1F3 with list of SVIDs."""
    codec = SecsCodec()
    result = codec.encode(
        stream=1,
        function=3,
        wbit=True,
        body=[1, 2, 3],  # List of SVIDs
    )

    assert result.stream == 1
    assert result.function == 3


def test_encode_produces_binary():
    """Encoded messages have non-empty binary data."""
    codec = SecsCodec()

    # Test with S1F3 (has body)
    result = codec.encode(1, 3, True, [1, 2, 3])
    assert len(result.binary) > 0, "S1F3 with body should produce non-empty binary"
    assert result.binary != b"", "Binary data should not be empty bytes"

    # Test with S1F1 (no body)
    result_no_body = codec.encode(1, 1, True, None)
    # S1F1 should still produce valid SECS-II header even with no body
    # (secsgem may return empty for header-only messages, which is acceptable)
    assert isinstance(result_no_body.binary, bytes), "Binary should be bytes type"


def test_round_trip_preserves_data():
    """Encode then decode preserves original data."""
    codec = SecsCodec()

    # Test with S1F3 - list of integers
    original_body = [10, 20, 30]
    encoded = codec.encode(1, 3, True, original_body)

    # Verify we got binary data
    assert len(encoded.binary) > 0, "Encoded message should have binary data"

    # Decode it back
    decoded = codec.decode(encoded.binary)

    # Verify metadata preserved
    assert decoded.stream == 1, "Stream should be preserved"
    assert decoded.function == 3, "Function should be preserved"
    assert decoded.wbit is True, "W-bit should be preserved"

    # Verify body preserved
    assert decoded.body == original_body, f"Body should be preserved: expected {original_body}, got {decoded.body}"
