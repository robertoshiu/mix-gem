"""Tests for transaction tracker."""
import time
import uuid
from datetime import datetime, timedelta

import pytest

from scavenger.simulator.common.messages import (
    HsmsMessage,
    HsmsMessageType,
    SecsMessageData,
    TransactionContext,
)
from scavenger.simulator.eap.transactions import TransactionTracker


@pytest.fixture
def tracker():
    """Create a transaction tracker with 1 second timeout for testing."""
    return TransactionTracker(timeout_seconds=1.0)


@pytest.fixture
def sample_request():
    """Create a sample HSMS request message."""
    return HsmsMessage(
        session_id=uuid.uuid4(),
        timestamp=datetime.now(),
        direction="H2E",
        message_type=HsmsMessageType.DATA_MESSAGE,
        data=SecsMessageData(stream=1, function=13, wbit=True),
        sequence_num=1,
        transaction_id=1001,
    )


@pytest.fixture
def sample_reply():
    """Create a sample HSMS reply message."""
    return HsmsMessage(
        session_id=uuid.uuid4(),
        timestamp=datetime.now(),
        direction="E2H",
        message_type=HsmsMessageType.DATA_MESSAGE,
        data=SecsMessageData(stream=1, function=14, wbit=False),
        sequence_num=2,
        transaction_id=1001,
    )


def test_tracker_init():
    """Test tracker initialization."""
    tracker = TransactionTracker(timeout_seconds=45.0)
    assert tracker is not None
    assert tracker.total_pending == 0
    assert tracker.total_completed == 0


def test_start_transaction(tracker, sample_request):
    """Test starting a new transaction."""
    equipment_id = "EQUIP-001"
    transaction_id = 1001

    context = tracker.start_transaction(equipment_id, transaction_id, sample_request)

    assert context is not None
    assert context.transaction_id == transaction_id
    assert context.request == sample_request
    assert context.reply is None
    assert tracker.total_pending == 1
    assert tracker.total_completed == 0


def test_complete_transaction(tracker, sample_request, sample_reply):
    """Test completing a transaction with a reply."""
    equipment_id = "EQUIP-001"
    transaction_id = 1001

    # Start transaction
    tracker.start_transaction(equipment_id, transaction_id, sample_request)
    assert tracker.total_pending == 1

    # Complete transaction
    context = tracker.complete_transaction(equipment_id, transaction_id, sample_reply)

    assert context is not None
    assert context.reply == sample_reply
    assert context.received_at is not None
    assert tracker.total_pending == 0
    assert tracker.total_completed == 1


def test_transaction_latency(tracker, sample_request, sample_reply):
    """Test latency calculation."""
    equipment_id = "EQUIP-001"
    transaction_id = 1001

    # Start transaction
    tracker.start_transaction(equipment_id, transaction_id, sample_request)

    # Simulate some delay
    time.sleep(0.05)  # 50ms delay

    # Complete transaction
    context = tracker.complete_transaction(equipment_id, transaction_id, sample_reply)

    assert context.latency_ms is not None
    assert context.latency_ms >= 50.0  # At least 50ms
    assert context.latency_ms < 200.0  # Should not take more than 200ms


def test_get_transaction(tracker, sample_request):
    """Test retrieving a specific transaction."""
    equipment_id = "EQUIP-001"
    transaction_id = 1001

    # Transaction doesn't exist yet
    context = tracker.get_transaction(equipment_id, transaction_id)
    assert context is None

    # Start transaction
    tracker.start_transaction(equipment_id, transaction_id, sample_request)

    # Now it exists
    context = tracker.get_transaction(equipment_id, transaction_id)
    assert context is not None
    assert context.transaction_id == transaction_id


def test_get_pending_transactions(tracker, sample_request):
    """Test retrieving pending transactions."""
    # Create transactions for different equipment
    tracker.start_transaction("EQUIP-001", 1001, sample_request)
    tracker.start_transaction("EQUIP-001", 1002, sample_request)
    tracker.start_transaction("EQUIP-002", 2001, sample_request)

    # Get all pending
    all_pending = tracker.get_pending_transactions()
    assert len(all_pending) == 3

    # Get pending for specific equipment
    equip1_pending = tracker.get_pending_transactions(equipment_id="EQUIP-001")
    assert len(equip1_pending) == 2

    equip2_pending = tracker.get_pending_transactions(equipment_id="EQUIP-002")
    assert len(equip2_pending) == 1


def test_get_completed_transactions(tracker, sample_request, sample_reply):
    """Test retrieving completed transactions."""
    # Start and complete transactions
    tracker.start_transaction("EQUIP-001", 1001, sample_request)
    tracker.complete_transaction("EQUIP-001", 1001, sample_reply)

    tracker.start_transaction("EQUIP-001", 1002, sample_request)
    tracker.complete_transaction("EQUIP-001", 1002, sample_reply)

    tracker.start_transaction("EQUIP-002", 2001, sample_request)
    tracker.complete_transaction("EQUIP-002", 2001, sample_reply)

    # Get all completed
    all_completed = tracker.get_completed_transactions()
    assert len(all_completed) == 3

    # Get completed for specific equipment
    equip1_completed = tracker.get_completed_transactions(equipment_id="EQUIP-001")
    assert len(equip1_completed) == 2

    equip2_completed = tracker.get_completed_transactions(equipment_id="EQUIP-002")
    assert len(equip2_completed) == 1


def test_timeout_detection(tracker, sample_request):
    """Test detecting timed-out transactions."""
    equipment_id = "EQUIP-001"

    # Start transaction
    tracker.start_transaction(equipment_id, 1001, sample_request)

    # Immediately check - should not be timed out
    timed_out = tracker.get_timed_out_transactions()
    assert len(timed_out) == 0

    # Wait for timeout (tracker has 1 second timeout)
    time.sleep(1.1)

    # Now should be timed out
    timed_out = tracker.get_timed_out_transactions()
    assert len(timed_out) == 1
    assert timed_out[0].transaction_id == 1001


def test_cleanup_old_transactions(tracker, sample_request, sample_reply):
    """Test cleanup of old completed transactions."""
    # Create a completed transaction
    tracker.start_transaction("EQUIP-001", 1001, sample_request)
    context = tracker.complete_transaction("EQUIP-001", 1001, sample_reply)

    # Manually age the transaction by modifying received_at
    context.received_at = datetime.now() - timedelta(seconds=400)

    assert tracker.total_completed == 1

    # Cleanup transactions older than 300 seconds
    removed_count = tracker.cleanup_completed(older_than_seconds=300)

    assert removed_count == 1
    assert tracker.total_completed == 0


def test_cleanup_keeps_recent_transactions(tracker, sample_request, sample_reply):
    """Test that cleanup keeps recent transactions."""
    # Create a completed transaction
    tracker.start_transaction("EQUIP-001", 1001, sample_request)
    tracker.complete_transaction("EQUIP-001", 1001, sample_reply)

    assert tracker.total_completed == 1

    # Cleanup transactions older than 300 seconds (this one is recent)
    removed_count = tracker.cleanup_completed(older_than_seconds=300)

    assert removed_count == 0
    assert tracker.total_completed == 1


def test_get_statistics_empty(tracker):
    """Test statistics with no transactions."""
    stats = tracker.get_statistics()

    assert stats["total_sent"] == 0
    assert stats["total_completed"] == 0
    assert stats["total_timeouts"] == 0
    assert stats["avg_latency_ms"] is None
    assert stats["min_latency_ms"] is None
    assert stats["max_latency_ms"] is None


def test_get_statistics_with_data(tracker, sample_request, sample_reply):
    """Test statistics calculation."""
    # Create multiple transactions
    for i in range(3):
        tracker.start_transaction("EQUIP-001", 1000 + i, sample_request)
        time.sleep(0.01)  # Small delay between transactions
        tracker.complete_transaction("EQUIP-001", 1000 + i, sample_reply)

    # Create one pending transaction
    tracker.start_transaction("EQUIP-001", 2000, sample_request)

    stats = tracker.get_statistics()

    assert stats["total_sent"] == 4
    assert stats["total_completed"] == 3
    assert stats["total_timeouts"] == 0
    assert stats["avg_latency_ms"] is not None
    assert stats["avg_latency_ms"] > 0
    assert stats["min_latency_ms"] is not None
    assert stats["max_latency_ms"] is not None
    assert stats["min_latency_ms"] <= stats["avg_latency_ms"] <= stats["max_latency_ms"]


def test_get_statistics_by_equipment(tracker, sample_request, sample_reply):
    """Test statistics for specific equipment."""
    # Create transactions for EQUIP-001
    tracker.start_transaction("EQUIP-001", 1001, sample_request)
    tracker.complete_transaction("EQUIP-001", 1001, sample_reply)

    # Create transactions for EQUIP-002
    tracker.start_transaction("EQUIP-002", 2001, sample_request)
    tracker.complete_transaction("EQUIP-002", 2001, sample_reply)
    tracker.start_transaction("EQUIP-002", 2002, sample_request)
    tracker.complete_transaction("EQUIP-002", 2002, sample_reply)

    # Stats for EQUIP-001
    stats1 = tracker.get_statistics(equipment_id="EQUIP-001")
    assert stats1["total_sent"] == 1
    assert stats1["total_completed"] == 1

    # Stats for EQUIP-002
    stats2 = tracker.get_statistics(equipment_id="EQUIP-002")
    assert stats2["total_sent"] == 2
    assert stats2["total_completed"] == 2

    # Overall stats
    stats_all = tracker.get_statistics()
    assert stats_all["total_sent"] == 3
    assert stats_all["total_completed"] == 3


def test_complete_nonexistent_transaction(tracker, sample_reply):
    """Test completing a transaction that doesn't exist."""
    context = tracker.complete_transaction("EQUIP-001", 9999, sample_reply)
    assert context is None


def test_multiple_equipment_isolation(tracker, sample_request, sample_reply):
    """Test that transactions for different equipment are isolated."""
    # Same transaction ID for different equipment
    tracker.start_transaction("EQUIP-001", 1001, sample_request)
    tracker.start_transaction("EQUIP-002", 1001, sample_request)

    assert tracker.total_pending == 2

    # Complete one
    tracker.complete_transaction("EQUIP-001", 1001, sample_reply)

    assert tracker.total_pending == 1
    assert tracker.total_completed == 1

    # The other should still be pending
    pending = tracker.get_pending_transactions(equipment_id="EQUIP-002")
    assert len(pending) == 1
    assert pending[0].transaction_id == 1001


def test_statistics_with_timeouts(tracker, sample_request):
    """Test statistics includes timeout count."""
    # Create a transaction that will timeout
    tracker.start_transaction("EQUIP-001", 1001, sample_request)

    # Wait for timeout
    time.sleep(1.1)

    stats = tracker.get_statistics()
    assert stats["total_sent"] == 1
    assert stats["total_completed"] == 0
    assert stats["total_timeouts"] == 1
