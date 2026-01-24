"""Tests for Redis pub/sub listener."""
import base64
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
)


class TestSecsMessageDataSerialization:
    """Test SecsMessageData serialization."""

    def test_secs_message_data_to_dict(self):
        """Test SecsMessageData.to_dict() serialization."""
        system_bytes = b"\x00\x01\x02\x03"
        raw_binary = b"\xff\xfe\xfd"

        data = SecsMessageData(
            stream=1,
            function=13,
            wbit=True,
            system_bytes=system_bytes,
            body={"key": "value"},
            raw_sml="S1F13 W { key: 'value' }",
            raw_binary=raw_binary,
        )

        result = data.to_dict()

        assert result["stream"] == 1
        assert result["function"] == 13
        assert result["wbit"] is True
        assert result["system_bytes"] == base64.b64encode(system_bytes).decode("utf-8")
        assert result["body"] == {"key": "value"}
        assert result["raw_sml"] == "S1F13 W { key: 'value' }"
        assert result["raw_binary"] == base64.b64encode(raw_binary).decode("utf-8")

    def test_secs_message_data_to_dict_with_none_values(self):
        """Test SecsMessageData.to_dict() with None values."""
        data = SecsMessageData(stream=1, function=1)

        result = data.to_dict()

        assert result["stream"] == 1
        assert result["function"] == 1
        assert result["wbit"] is False
        assert result["system_bytes"] is None
        assert result["body"] is None
        assert result["raw_sml"] is None
        assert result["raw_binary"] is None

    def test_secs_message_data_from_dict(self):
        """Test SecsMessageData.from_dict() deserialization."""
        system_bytes = b"\x00\x01\x02\x03"
        raw_binary = b"\xff\xfe\xfd"

        data_dict = {
            "stream": 1,
            "function": 13,
            "wbit": True,
            "system_bytes": base64.b64encode(system_bytes).decode("utf-8"),
            "body": {"key": "value"},
            "raw_sml": "S1F13 W { key: 'value' }",
            "raw_binary": base64.b64encode(raw_binary).decode("utf-8"),
        }

        data = SecsMessageData.from_dict(data_dict)

        assert data.stream == 1
        assert data.function == 13
        assert data.wbit is True
        assert data.system_bytes == system_bytes
        assert data.body == {"key": "value"}
        assert data.raw_sml == "S1F13 W { key: 'value' }"
        assert data.raw_binary == raw_binary

    def test_secs_message_data_from_dict_with_none_values(self):
        """Test SecsMessageData.from_dict() with None values."""
        data_dict = {
            "stream": 1,
            "function": 1,
            "wbit": False,
            "system_bytes": None,
            "body": None,
            "raw_sml": None,
            "raw_binary": None,
        }

        data = SecsMessageData.from_dict(data_dict)

        assert data.stream == 1
        assert data.function == 1
        assert data.wbit is False
        assert data.system_bytes is None
        assert data.body is None
        assert data.raw_sml is None
        assert data.raw_binary is None

    def test_secs_message_data_roundtrip(self):
        """Test roundtrip serialization/deserialization."""
        original = SecsMessageData(
            stream=1,
            function=13,
            wbit=True,
            system_bytes=b"\x00\x01\x02\x03",
            body={"key": "value"},
            raw_sml="S1F13 W { key: 'value' }",
            raw_binary=b"\xff\xfe\xfd",
        )

        data_dict = original.to_dict()
        reconstructed = SecsMessageData.from_dict(data_dict)

        assert reconstructed.stream == original.stream
        assert reconstructed.function == original.function
        assert reconstructed.wbit == original.wbit
        assert reconstructed.system_bytes == original.system_bytes
        assert reconstructed.body == original.body
        assert reconstructed.raw_sml == original.raw_sml
        assert reconstructed.raw_binary == original.raw_binary


class TestHsmsMessageSerialization:
    """Test HsmsMessage serialization."""

    def test_hsms_message_to_dict(self):
        """Test HsmsMessage.to_dict() serialization."""
        session_id = uuid.uuid4()
        timestamp = datetime.now(timezone.utc)

        secs_data = SecsMessageData(
            stream=1,
            function=13,
            wbit=True,
            system_bytes=b"\x00\x01\x02\x03",
        )

        message = HsmsMessage(
            session_id=session_id,
            timestamp=timestamp,
            direction="H2E",
            message_type=HsmsMessageType.DATA_MESSAGE,
            data=secs_data,
            sequence_num=42,
            transaction_id=123,
        )

        result = message.to_dict()

        assert result["session_id"] == str(session_id)
        assert result["timestamp"] == timestamp.isoformat()
        assert result["direction"] == "H2E"
        assert result["message_type"] == int(HsmsMessageType.DATA_MESSAGE)
        assert result["sequence_num"] == 42
        assert result["transaction_id"] == 123
        assert result["data"] == secs_data.to_dict()

    def test_hsms_message_to_dict_without_data(self):
        """Test HsmsMessage.to_dict() for control messages."""
        session_id = uuid.uuid4()
        timestamp = datetime.now(timezone.utc)

        message = HsmsMessage(
            session_id=session_id,
            timestamp=timestamp,
            direction="E2H",
            message_type=HsmsMessageType.SELECT_REQ,
            data=None,
            sequence_num=1,
        )

        result = message.to_dict()

        assert result["session_id"] == str(session_id)
        assert result["timestamp"] == timestamp.isoformat()
        assert result["direction"] == "E2H"
        assert result["message_type"] == int(HsmsMessageType.SELECT_REQ)
        assert result["sequence_num"] == 1
        assert result["transaction_id"] is None
        assert result["data"] is None

    def test_hsms_message_from_dict(self):
        """Test HsmsMessage.from_dict() deserialization."""
        session_id = uuid.uuid4()
        timestamp = datetime.now(timezone.utc)

        secs_data_dict = {
            "stream": 1,
            "function": 13,
            "wbit": True,
            "system_bytes": base64.b64encode(b"\x00\x01\x02\x03").decode("utf-8"),
            "body": None,
            "raw_sml": None,
            "raw_binary": None,
        }

        message_dict = {
            "session_id": str(session_id),
            "timestamp": timestamp.isoformat(),
            "direction": "H2E",
            "message_type": int(HsmsMessageType.DATA_MESSAGE),
            "data": secs_data_dict,
            "sequence_num": 42,
            "transaction_id": 123,
        }

        message = HsmsMessage.from_dict(message_dict)

        assert message.session_id == session_id
        assert message.timestamp == timestamp
        assert message.direction == "H2E"
        assert message.message_type == HsmsMessageType.DATA_MESSAGE
        assert message.sequence_num == 42
        assert message.transaction_id == 123
        assert message.data is not None
        assert message.data.stream == 1
        assert message.data.function == 13

    def test_hsms_message_from_dict_without_data(self):
        """Test HsmsMessage.from_dict() for control messages."""
        session_id = uuid.uuid4()
        timestamp = datetime.now(timezone.utc)

        message_dict = {
            "session_id": str(session_id),
            "timestamp": timestamp.isoformat(),
            "direction": "E2H",
            "message_type": int(HsmsMessageType.SELECT_REQ),
            "data": None,
            "sequence_num": 1,
            "transaction_id": None,
        }

        message = HsmsMessage.from_dict(message_dict)

        assert message.session_id == session_id
        assert message.timestamp == timestamp
        assert message.direction == "E2H"
        assert message.message_type == HsmsMessageType.SELECT_REQ
        assert message.sequence_num == 1
        assert message.transaction_id is None
        assert message.data is None

    def test_hsms_message_roundtrip(self):
        """Test roundtrip serialization/deserialization."""
        original = HsmsMessage(
            session_id=uuid.uuid4(),
            timestamp=datetime.now(timezone.utc),
            direction="H2E",
            message_type=HsmsMessageType.DATA_MESSAGE,
            data=SecsMessageData(
                stream=1,
                function=13,
                wbit=True,
                system_bytes=b"\x00\x01\x02\x03",
                body={"key": "value"},
            ),
            sequence_num=42,
            transaction_id=123,
        )

        message_dict = original.to_dict()
        reconstructed = HsmsMessage.from_dict(message_dict)

        assert reconstructed.session_id == original.session_id
        assert reconstructed.timestamp == original.timestamp
        assert reconstructed.direction == original.direction
        assert reconstructed.message_type == original.message_type
        assert reconstructed.sequence_num == original.sequence_num
        assert reconstructed.transaction_id == original.transaction_id
        assert reconstructed.data is not None
        assert reconstructed.data.stream == original.data.stream
        assert reconstructed.data.function == original.data.function


class TestRedisListener:
    """Test RedisListener."""

    @pytest.mark.asyncio
    async def test_redis_listener_subscribes_to_default_pattern(self):
        """Test that listener subscribes to default pattern on start."""
        from scavenger.simulator.recorder.redis_listener import RedisListener

        mock_redis = MagicMock()  # Changed from AsyncMock
        mock_pubsub = MagicMock()
        mock_redis.pubsub.return_value = mock_pubsub  # Now returns synchronously
        mock_pubsub.psubscribe = AsyncMock()

        # Mock listen to immediately stop iteration
        async def mock_listen():
            return
            yield  # This line is unreachable but makes it a generator

        mock_pubsub.listen = mock_listen
        mock_pubsub.close = AsyncMock()
        mock_redis.close = AsyncMock()

        callback = AsyncMock()

        with patch("redis.asyncio.from_url", return_value=mock_redis):
            listener = RedisListener(
                redis_url="redis://localhost:6379",
                on_message=callback,
            )

            # Start listener (will immediately finish because listen returns no messages)
            await listener.start()

            # Verify subscription
            mock_pubsub.psubscribe.assert_called_once_with("hsms:session:*:messages")

    @pytest.mark.asyncio
    async def test_redis_listener_subscribes_to_custom_pattern(self):
        """Test that listener subscribes to custom pattern."""
        from scavenger.simulator.recorder.redis_listener import RedisListener

        mock_redis = MagicMock()
        mock_pubsub = MagicMock()
        mock_redis.pubsub.return_value = mock_pubsub
        mock_pubsub.psubscribe = AsyncMock()

        async def mock_listen():
            return
            yield

        mock_pubsub.listen = mock_listen
        mock_pubsub.close = AsyncMock()
        mock_redis.close = AsyncMock()

        callback = AsyncMock()
        custom_pattern = "hsms:session:test-session:messages"

        with patch("redis.asyncio.from_url", return_value=mock_redis):
            listener = RedisListener(
                redis_url="redis://localhost:6379",
                on_message=callback,
                pattern=custom_pattern,
            )

            await listener.start()

            mock_pubsub.psubscribe.assert_called_once_with(custom_pattern)

    @pytest.mark.asyncio
    async def test_redis_listener_handles_message(self):
        """Test that listener deserializes and passes messages to callback."""
        import json
        from scavenger.simulator.recorder.redis_listener import RedisListener

        # Create test message
        session_id = uuid.uuid4()
        timestamp = datetime.now(timezone.utc)
        message = HsmsMessage(
            session_id=session_id,
            timestamp=timestamp,
            direction="H2E",
            message_type=HsmsMessageType.DATA_MESSAGE,
            data=SecsMessageData(stream=1, function=1),
            sequence_num=1,
        )

        # Mock Redis to return our message
        mock_redis = MagicMock()
        mock_pubsub = MagicMock()
        mock_redis.pubsub.return_value = mock_pubsub
        mock_pubsub.psubscribe = AsyncMock()
        mock_pubsub.close = AsyncMock()
        mock_redis.close = AsyncMock()

        async def mock_listen():
            yield {
                "type": "pmessage",
                "pattern": b"hsms:session:*:messages",
                "channel": f"hsms:session:{session_id}:messages".encode(),
                "data": json.dumps(message.to_dict()).encode(),
            }
            return

        mock_pubsub.listen = mock_listen

        # Track callback invocations
        received_messages = []

        async def callback(msg: HsmsMessage):
            received_messages.append(msg)

        with patch("redis.asyncio.from_url", return_value=mock_redis):
            listener = RedisListener(
                redis_url="redis://localhost:6379",
                on_message=callback,
            )

            await listener.start()

            # Verify callback was called
            assert len(received_messages) == 1
            received = received_messages[0]
            assert received.session_id == session_id
            assert received.direction == "H2E"
            assert received.message_type == HsmsMessageType.DATA_MESSAGE

    @pytest.mark.asyncio
    async def test_redis_listener_ignores_non_message_types(self):
        """Test that listener ignores subscribe/unsubscribe notifications."""
        from scavenger.simulator.recorder.redis_listener import RedisListener

        mock_redis = MagicMock()
        mock_pubsub = MagicMock()
        mock_redis.pubsub.return_value = mock_pubsub
        mock_pubsub.psubscribe = AsyncMock()
        mock_pubsub.close = AsyncMock()
        mock_redis.close = AsyncMock()

        async def mock_listen():
            # Subscribe notification
            yield {
                "type": "psubscribe",
                "pattern": b"hsms:session:*:messages",
                "channel": None,
                "data": 1,
            }
            # Then finish
            return

        mock_pubsub.listen = mock_listen

        callback = AsyncMock()

        with patch("redis.asyncio.from_url", return_value=mock_redis):
            listener = RedisListener(
                redis_url="redis://localhost:6379",
                on_message=callback,
            )

            await listener.start()

            # Callback should not be called for subscription notifications
            callback.assert_not_called()

    @pytest.mark.asyncio
    async def test_redis_listener_stop(self):
        """Test that listener can be stopped gracefully."""
        from scavenger.simulator.recorder.redis_listener import RedisListener
        import asyncio

        mock_redis = MagicMock()
        mock_pubsub = MagicMock()
        mock_redis.pubsub.return_value = mock_pubsub
        mock_pubsub.psubscribe = AsyncMock()
        mock_pubsub.unsubscribe = AsyncMock()
        mock_pubsub.close = AsyncMock()
        mock_redis.close = AsyncMock()

        listener = None

        async def mock_listen():
            # Yield a few messages, checking if listener is stopped
            for _ in range(100):
                if listener and not listener._running:
                    break
                yield {
                    "type": "psubscribe",
                    "pattern": b"hsms:session:*:messages",
                    "channel": None,
                    "data": 1,
                }
                await asyncio.sleep(0.01)

        mock_pubsub.listen = mock_listen

        callback = AsyncMock()

        with patch("redis.asyncio.from_url", return_value=mock_redis):
            listener = RedisListener(
                redis_url="redis://localhost:6379",
                on_message=callback,
            )

            # Start in background
            task = asyncio.create_task(listener.start())

            # Wait a bit
            await asyncio.sleep(0.1)

            # Stop listener
            await listener.stop()

            # Wait for task to complete
            try:
                await asyncio.wait_for(task, timeout=1.0)
            except asyncio.TimeoutError:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

            # Verify cleanup was called at least once (could be called twice due to stop() and finally block)
            assert mock_pubsub.close.call_count >= 1
            assert mock_redis.close.call_count >= 1
