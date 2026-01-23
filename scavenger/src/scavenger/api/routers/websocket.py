"""WebSocket API router for real-time event streaming."""
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from scavenger.api.schemas.events import ExecutionEventMessage
from scavenger.db.models.execution import ExecutionEvent, ExecutionRun
from scavenger.db.session import get_session

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/executions/{run_id}/events")
async def stream_execution_events(websocket: WebSocket, run_id: int):
    """Stream execution events for a run via WebSocket.

    Sends all existing events immediately, then polls for new events.
    Messages are JSON-formatted ExecutionEventMessage objects.
    """
    await websocket.accept()

    try:
        # Create session for verification
        async with get_session() as session:
            # Verify run exists
            stmt = select(ExecutionRun).where(ExecutionRun.id == run_id)
            result = await session.execute(stmt)
            run = result.scalar_one_or_none()

            if not run:
                await websocket.send_json({"error": f"Run {run_id} not found"})
                await websocket.close(code=1008)  # Policy violation
                return

            # Send all existing events
            stmt = (
                select(ExecutionEvent)
                .where(ExecutionEvent.run_id == run_id)
                .order_by(ExecutionEvent.timestamp)
            )
            result = await session.execute(stmt)
            events = result.scalars().all()

            for event in events:
                message = ExecutionEventMessage(
                    event_id=event.id,
                    run_id=event.run_id,
                    timestamp=event.timestamp,
                    event_type=event.event_type,
                    direction=event.direction,
                    raw_sml=event.raw_sml,
                    parsed_data=event.parsed_data,
                )
                await websocket.send_json(message.model_dump(mode='json'))

        # Poll for new events
        # NOTE: In production, use database LISTEN/NOTIFY or message queue
        # For Phase 7, simple polling is acceptable
        last_event_id = events[-1].id if events else 0

        while True:
            await asyncio.sleep(1.0)  # Poll every second

            # Need new session for each poll to avoid stale data
            async with get_session() as poll_session:
                stmt = (
                    select(ExecutionEvent)
                    .where(
                        ExecutionEvent.run_id == run_id,
                        ExecutionEvent.id > last_event_id,
                    )
                    .order_by(ExecutionEvent.timestamp)
                )
                result = await poll_session.execute(stmt)
                new_events = result.scalars().all()

                for event in new_events:
                    message = ExecutionEventMessage(
                        event_id=event.id,
                        run_id=event.run_id,
                        timestamp=event.timestamp,
                        event_type=event.event_type,
                        direction=event.direction,
                        raw_sml=event.raw_sml,
                        parsed_data=event.parsed_data,
                    )
                    await websocket.send_json(message.model_dump(mode='json'))
                    last_event_id = event.id

    except WebSocketDisconnect:
        pass  # Client disconnected
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
            await websocket.close(code=1011)  # Internal error
        except:
            pass  # Connection already closed
