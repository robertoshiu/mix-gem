# scavenger/tests/simulator/common/test_timers.py
"""Tests for HSMS timer management."""
import asyncio

import pytest

from scavenger.simulator.common.timers import HsmsTimers, TimerType


def test_timer_type_enum():
    """TimerType enum has all HSMS timers."""
    assert TimerType.T3.value == "T3"
    assert TimerType.T5.value == "T5"
    assert TimerType.T6.value == "T6"
    assert TimerType.T7.value == "T7"
    assert TimerType.T8.value == "T8"


def test_hsms_timers_default_values():
    """HsmsTimers has sensible defaults per SEMI E37."""
    timers = HsmsTimers()

    assert timers.t3 == 45.0  # Reply timeout
    assert timers.t5 == 10.0  # Connect separation
    assert timers.t6 == 5.0   # Control timeout
    assert timers.t7 == 10.0  # Not selected
    assert timers.t8 == 5.0   # Network interchar


def test_hsms_timers_custom_values():
    """HsmsTimers accepts custom timeout values."""
    timers = HsmsTimers(t3=60.0, t6=10.0)

    assert timers.t3 == 60.0
    assert timers.t6 == 10.0


@pytest.mark.asyncio
async def test_timer_start_and_cancel():
    """Timer can be started and cancelled."""
    timers = HsmsTimers(t3=0.1)
    callback_called = False

    async def on_timeout():
        nonlocal callback_called
        callback_called = True

    timers.start_timer(TimerType.T3, on_timeout)
    assert timers.is_active(TimerType.T3)

    timers.cancel_timer(TimerType.T3)
    assert not timers.is_active(TimerType.T3)

    await asyncio.sleep(0.15)
    assert not callback_called


@pytest.mark.asyncio
async def test_timer_fires_callback():
    """Timer fires callback on expiration."""
    timers = HsmsTimers(t3=0.05)
    callback_called = False

    async def on_timeout():
        nonlocal callback_called
        callback_called = True

    timers.start_timer(TimerType.T3, on_timeout)
    await asyncio.sleep(0.1)

    assert callback_called
