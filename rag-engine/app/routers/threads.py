# rag-engine/app/routers/threads.py
"""Thread management router for conversation sessions and interrupts."""
import structlog
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

logger = structlog.get_logger()
router = APIRouter(prefix="/threads", tags=["Threads"])


class InterruptDecision(BaseModel):
    """Engineer decision on pending action."""

    approved: bool
    reason: str | None = None


class InterruptResponse(BaseModel):
    """Response after interrupt decision."""

    status: str
    answer: str | None = None


class ThreadState(BaseModel):
    """Current state of a conversation thread."""

    thread_id: str
    status: str
    has_pending_interrupt: bool = False
    message_count: int = 0


@router.post("/{thread_id}/interrupt", response_model=InterruptResponse)
async def handle_interrupt(
    thread_id: str,
    decision: InterruptDecision,
    request: Request,
) -> InterruptResponse:
    """Handle an interrupt (approve/reject pending action).

    When the agent proposes an equipment-affecting action, execution pauses
    and waits for engineer confirmation. Use this endpoint to approve or reject.

    Args:
        thread_id: The session/thread ID that is interrupted
        decision: Approval decision with optional reason

    Returns:
        Status and continued answer if approved
    """
    logger.info(
        "interrupt_decision",
        thread_id=thread_id,
        approved=decision.approved,
        reason=decision.reason,
    )

    if request.app.state.agent is None:
        raise HTTPException(
            status_code=400,
            detail="No active agent session. Start a query first.",
        )

    try:
        result = await request.app.state.agent.resume(
            session_id=thread_id,
            decision={
                "approved": decision.approved,
                "reason": decision.reason,
            },
        )

        logger.info("interrupt_resumed", thread_id=thread_id)

        return InterruptResponse(
            status="resumed",
            answer=result.get("answer"),
        )

    except Exception as e:
        logger.error("interrupt_failed", thread_id=thread_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{thread_id}/state", response_model=ThreadState)
async def get_thread_state(thread_id: str, request: Request) -> ThreadState:
    """Get current state of a conversation thread.

    Args:
        thread_id: The session/thread ID to check

    Returns:
        Thread status including pending interrupt state
    """
    # TODO: Implement full state retrieval from checkpointer
    # For now, return basic status

    if request.app.state.agent is None:
        return ThreadState(
            thread_id=thread_id,
            status="no_agent",
            has_pending_interrupt=False,
            message_count=0,
        )

    # Check if there's a pending interrupt for this thread
    # This would require accessing the checkpointer state
    return ThreadState(
        thread_id=thread_id,
        status="active",
        has_pending_interrupt=False,  # TODO: Check actual state
        message_count=0,  # TODO: Get from checkpointer
    )


@router.delete("/{thread_id}")
async def delete_thread(thread_id: str, request: Request) -> dict:
    """Delete a conversation thread and its history.

    Args:
        thread_id: The session/thread ID to delete

    Returns:
        Deletion confirmation
    """
    logger.info("thread_delete_requested", thread_id=thread_id)

    # Delete from Redis history
    try:
        await request.app.state.redis.delete(f"session:{thread_id}:history")
        logger.info("thread_deleted", thread_id=thread_id)
        return {"status": "deleted", "thread_id": thread_id}
    except Exception as e:
        logger.error("thread_delete_failed", thread_id=thread_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
