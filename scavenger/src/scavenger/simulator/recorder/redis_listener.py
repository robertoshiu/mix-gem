"""Redis pub/sub listener for HSMS message streaming."""
import asyncio
import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any

import redis.asyncio as redis

from scavenger.simulator.common.messages import HsmsMessage

logger = logging.getLogger(__name__)


class RedisListener:
    """
    Redis pub/sub listener that subscribes to HSMS message streams.

    Deserializes incoming messages and passes them to a callback for processing.
    Handles subscription lifecycle with automatic reconnection on failure.
    """

    def __init__(
        self,
        redis_url: str,
        on_message: Callable[[HsmsMessage], Awaitable[None]],
        pattern: str = "hsms:session:*:messages",
    ):
        """
        Initialize Redis listener.

        Args:
            redis_url: Redis connection URL (e.g., "redis://localhost:6379")
            on_message: Async callback to process each message
            pattern: Channel pattern to subscribe to (default: "hsms:session:*:messages")
        """
        self.redis_url = redis_url
        self.on_message = on_message
        self.pattern = pattern
        self._redis: redis.Redis | None = None
        self._pubsub = None
        self._running = False
        self._reconnect_delay = 1.0
        self._max_reconnect_delay = 30.0

    async def start(self) -> None:
        """
        Start listening for messages.

        Connects to Redis, subscribes to the pattern, and processes messages.
        Implements exponential backoff retry on connection failures.
        """
        self._running = True

        while self._running:
            try:
                # Connect to Redis
                self._redis = redis.from_url(self.redis_url)
                self._pubsub = self._redis.pubsub()

                # Subscribe to pattern
                await self._pubsub.psubscribe(self.pattern)
                logger.info(f"Subscribed to Redis pattern: {self.pattern}")

                # Reset reconnect delay on successful connection
                self._reconnect_delay = 1.0

                # Listen for messages
                async for message in self._pubsub.listen():
                    if not self._running:
                        break

                    await self._handle_message(message)

                # If listen() completes normally (not an error), stop running
                # This happens in tests when the mock generator exhausts
                break

            except asyncio.CancelledError:
                logger.info("Redis listener cancelled")
                break
            except Exception as e:
                logger.error(f"Redis connection error: {e}")
                if self._running:
                    logger.info(
                        f"Reconnecting in {self._reconnect_delay}s..."
                    )
                    await asyncio.sleep(self._reconnect_delay)
                    # Exponential backoff
                    self._reconnect_delay = min(
                        self._reconnect_delay * 2,
                        self._max_reconnect_delay,
                    )
            finally:
                await self._cleanup()

    async def stop(self) -> None:
        """Stop listening and cleanup resources."""
        self._running = False
        await self._cleanup()

    async def _cleanup(self) -> None:
        """Cleanup Redis connections."""
        if self._pubsub:
            try:
                await self._pubsub.close()
            except Exception as e:
                logger.warning(f"Error closing pubsub: {e}")
            self._pubsub = None

        if self._redis:
            try:
                await self._redis.close()
            except Exception as e:
                logger.warning(f"Error closing Redis: {e}")
            self._redis = None

    async def _handle_message(self, message: dict[str, Any]) -> None:
        """
        Handle incoming Redis message.

        Args:
            message: Redis message dictionary
        """
        message_type = message.get("type")

        # Ignore subscription notifications
        if message_type in ("psubscribe", "punsubscribe", "subscribe", "unsubscribe"):
            return

        # Process actual messages
        if message_type == "pmessage":
            try:
                # Extract and decode message data
                data = message.get("data")
                if not data:
                    return

                # Decode bytes to string
                if isinstance(data, bytes):
                    data = data.decode("utf-8")

                # Parse JSON
                message_dict = json.loads(data)

                # Deserialize to HsmsMessage
                hsms_message = HsmsMessage.from_dict(message_dict)

                # Call callback
                await self.on_message(hsms_message)

            except json.JSONDecodeError as e:
                logger.error(f"Failed to decode JSON message: {e}")
            except Exception as e:
                logger.error(f"Failed to process message: {e}", exc_info=True)
