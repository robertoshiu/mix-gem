# scavenger/src/scavenger/simulator/common/timers.py
"""HSMS timer management per SEMI E37."""
import asyncio
from dataclasses import dataclass, field
from enum import Enum
from typing import Awaitable, Callable


class TimerType(str, Enum):
    """HSMS timer types per SEMI E37."""

    T3 = "T3"  # Reply timeout
    T5 = "T5"  # Connect separation timeout
    T6 = "T6"  # Control transaction timeout
    T7 = "T7"  # Not selected timeout
    T8 = "T8"  # Network intercharacter timeout


@dataclass
class HsmsTimers:
    """HSMS timer configuration and management.

    Default values per SEMI E37 recommendations.
    """

    t3: float = 45.0  # Reply timeout (1-120s, default 45s)
    t5: float = 10.0  # Connect separation (1-240s, default 10s)
    t6: float = 5.0   # Control transaction (1-240s, default 5s)
    t7: float = 10.0  # Not selected (1-240s, default 10s)
    t8: float = 5.0   # Network intercharacter (1-120s, default 5s)

    _active_timers: dict[TimerType, asyncio.Task] = field(
        default_factory=dict, repr=False
    )

    def get_timeout(self, timer_type: TimerType) -> float:
        """Get timeout value for timer type."""
        return {
            TimerType.T3: self.t3,
            TimerType.T5: self.t5,
            TimerType.T6: self.t6,
            TimerType.T7: self.t7,
            TimerType.T8: self.t8,
        }[timer_type]

    def start_timer(
        self,
        timer_type: TimerType,
        callback: Callable[[], Awaitable[None]],
    ) -> None:
        """Start a timer with callback on expiration.

        Args:
            timer_type: Which timer to start
            callback: Async function to call on timeout
        """
        self.cancel_timer(timer_type)

        timeout = self.get_timeout(timer_type)

        async def timer_task():
            await asyncio.sleep(timeout)
            if timer_type in self._active_timers:
                del self._active_timers[timer_type]
                await callback()

        self._active_timers[timer_type] = asyncio.create_task(timer_task())

    def cancel_timer(self, timer_type: TimerType) -> None:
        """Cancel an active timer."""
        if timer_type in self._active_timers:
            self._active_timers[timer_type].cancel()
            del self._active_timers[timer_type]

    def cancel_all(self) -> None:
        """Cancel all active timers."""
        for timer_type in list(self._active_timers.keys()):
            self.cancel_timer(timer_type)

    def is_active(self, timer_type: TimerType) -> bool:
        """Check if timer is currently active."""
        return timer_type in self._active_timers

    def reset_timer(
        self,
        timer_type: TimerType,
        callback: Callable[[], Awaitable[None]],
    ) -> None:
        """Reset (restart) a timer."""
        self.start_timer(timer_type, callback)
