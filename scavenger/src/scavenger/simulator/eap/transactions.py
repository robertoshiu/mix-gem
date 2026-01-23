"""Transaction tracker for SECS/GEM request/reply monitoring."""
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from scavenger.simulator.common.messages import HsmsMessage, TransactionContext


class TransactionTracker:
    """Tracks SECS/GEM transactions across multiple equipment connections.

    Monitors request/reply patterns, calculates latencies, and detects timeouts.
    Transactions are identified by (equipment_id, transaction_id) tuple.
    """

    def __init__(self, timeout_seconds: float = 45.0):
        """Initialize transaction tracker.

        Args:
            timeout_seconds: Timeout threshold in seconds for detecting timed-out transactions.
        """
        self._timeout_seconds = timeout_seconds

        # Pending transactions: {(equipment_id, transaction_id): TransactionContext}
        self._pending: Dict[Tuple[str, int], TransactionContext] = {}

        # Completed transactions: {(equipment_id, transaction_id): TransactionContext}
        self._completed: Dict[Tuple[str, int], TransactionContext] = {}

    @property
    def total_pending(self) -> int:
        """Count of pending transactions."""
        return len(self._pending)

    @property
    def total_completed(self) -> int:
        """Count of completed transactions."""
        return len(self._completed)

    def start_transaction(
        self,
        equipment_id: str,
        transaction_id: int,
        request: HsmsMessage,
    ) -> TransactionContext:
        """Start tracking a new transaction.

        Args:
            equipment_id: Equipment identifier
            transaction_id: Transaction ID from message
            request: HSMS request message

        Returns:
            TransactionContext for the new transaction
        """
        context = TransactionContext(
            transaction_id=transaction_id,
            request=request,
            sent_at=datetime.now(),
        )

        key = (equipment_id, transaction_id)
        self._pending[key] = context

        return context

    def complete_transaction(
        self,
        equipment_id: str,
        transaction_id: int,
        reply: HsmsMessage,
    ) -> TransactionContext | None:
        """Complete a transaction with a reply.

        Moves transaction from pending to completed and records reply timestamp.

        Args:
            equipment_id: Equipment identifier
            transaction_id: Transaction ID from message
            reply: HSMS reply message

        Returns:
            TransactionContext with reply, or None if transaction not found
        """
        key = (equipment_id, transaction_id)
        context = self._pending.pop(key, None)

        if context is None:
            return None

        # Update context with reply
        context.reply = reply
        context.received_at = datetime.now()

        # Move to completed
        self._completed[key] = context

        return context

    def get_transaction(
        self,
        equipment_id: str,
        transaction_id: int,
    ) -> TransactionContext | None:
        """Get a specific transaction (pending or completed).

        Args:
            equipment_id: Equipment identifier
            transaction_id: Transaction ID

        Returns:
            TransactionContext if found, None otherwise
        """
        key = (equipment_id, transaction_id)

        # Check pending first, then completed
        return self._pending.get(key) or self._completed.get(key)

    def get_pending_transactions(
        self,
        equipment_id: str | None = None,
    ) -> List[TransactionContext]:
        """Get all pending transactions.

        Args:
            equipment_id: Optional equipment filter

        Returns:
            List of pending TransactionContexts
        """
        if equipment_id is None:
            return list(self._pending.values())

        return [
            context
            for (equip_id, _), context in self._pending.items()
            if equip_id == equipment_id
        ]

    def get_completed_transactions(
        self,
        equipment_id: str | None = None,
    ) -> List[TransactionContext]:
        """Get all completed transactions.

        Args:
            equipment_id: Optional equipment filter

        Returns:
            List of completed TransactionContexts
        """
        if equipment_id is None:
            return list(self._completed.values())

        return [
            context
            for (equip_id, _), context in self._completed.items()
            if equip_id == equipment_id
        ]

    def get_timed_out_transactions(self) -> List[TransactionContext]:
        """Get transactions that have exceeded the timeout threshold.

        Returns:
            List of timed-out TransactionContexts (still in pending state)
        """
        now = datetime.now()
        timeout_threshold = timedelta(seconds=self._timeout_seconds)

        timed_out = []
        for context in self._pending.values():
            elapsed = now - context.sent_at
            if elapsed > timeout_threshold:
                timed_out.append(context)

        return timed_out

    def cleanup_completed(self, older_than_seconds: float = 300) -> int:
        """Remove old completed transactions to prevent memory growth.

        Args:
            older_than_seconds: Remove transactions completed longer than this

        Returns:
            Number of transactions removed
        """
        now = datetime.now()
        threshold = timedelta(seconds=older_than_seconds)

        # Find keys to remove
        keys_to_remove = []
        for key, context in self._completed.items():
            if context.received_at is not None:
                elapsed = now - context.received_at
                if elapsed > threshold:
                    keys_to_remove.append(key)

        # Remove them
        for key in keys_to_remove:
            del self._completed[key]

        return len(keys_to_remove)

    def get_statistics(
        self,
        equipment_id: str | None = None,
    ) -> dict:
        """Get transaction statistics.

        Args:
            equipment_id: Optional equipment filter

        Returns:
            Dictionary with statistics:
            - total_sent: Total transactions started
            - total_completed: Total transactions completed
            - total_timeouts: Total timed-out transactions
            - avg_latency_ms: Average latency (None if no completed transactions)
            - min_latency_ms: Minimum latency (None if no completed transactions)
            - max_latency_ms: Maximum latency (None if no completed transactions)
        """
        # Get relevant transactions
        if equipment_id is None:
            pending = list(self._pending.values())
            completed = list(self._completed.values())
        else:
            pending = self.get_pending_transactions(equipment_id)
            completed = self.get_completed_transactions(equipment_id)

        total_sent = len(pending) + len(completed)
        total_completed = len(completed)

        # Count timeouts
        now = datetime.now()
        timeout_threshold = timedelta(seconds=self._timeout_seconds)
        total_timeouts = sum(
            1 for context in pending
            if (now - context.sent_at) > timeout_threshold
        )

        # Calculate latencies
        latencies = [
            context.latency_ms
            for context in completed
            if context.latency_ms is not None
        ]

        if latencies:
            avg_latency = sum(latencies) / len(latencies)
            min_latency = min(latencies)
            max_latency = max(latencies)
        else:
            avg_latency = None
            min_latency = None
            max_latency = None

        return {
            "total_sent": total_sent,
            "total_completed": total_completed,
            "total_timeouts": total_timeouts,
            "avg_latency_ms": avg_latency,
            "min_latency_ms": min_latency,
            "max_latency_ms": max_latency,
        }
