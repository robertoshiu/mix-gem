# rag-engine/app/routers/query.py
"""Query router for RAG engine API."""
from collections.abc import AsyncGenerator
from uuid import uuid4

import structlog
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.core.context_assembler import ContextAssembler
from app.core.query_classifier import QueryClassifier
from app.services.lightrag_service import get_lightrag_service

logger = structlog.get_logger()
router = APIRouter(prefix="/query", tags=["Query"])


class QueryRequest(BaseModel):
    """Engineer query to the RAG system."""

    question: str = Field(
        min_length=1,
        max_length=2000,
        examples=["Why is CD trending high on LITHO01?"],
    )
    session_id: str | None = Field(
        default=None,
        description="Resume existing session",
    )
    tool_id: str | None = Field(
        default=None,
        description="Equipment context override",
        examples=["LITHO01"],
    )
    stream: bool = Field(
        default=False,
        description="Stream response tokens",
    )


class QueryResponse(BaseModel):
    """Response from RAG engine."""

    answer: str
    session_id: str
    query_type: str
    lightrag_mode: str


async def get_or_create_agent(request: Request):
    """Get or create the LangGraph agent."""
    from app.core.agent import RAGAgentOrchestrator

    if request.app.state.agent is None:
        lightrag = await get_lightrag_service()
        agent = RAGAgentOrchestrator(
            pg_pool=request.app.state.pg_pool,
            lightrag_service=lightrag,
            redis_client=request.app.state.redis,
        )
        await agent.initialize()
        request.app.state.agent = agent

    return request.app.state.agent


@router.post("", response_model=QueryResponse)
async def query(req: QueryRequest, request: Request) -> QueryResponse:
    """Query the RAG engine with a process engineering question.

    This endpoint:
    1. Classifies the query type (troubleshooting, conceptual, process, conversational)
    2. Assembles tiered context (system prompt, equipment state, knowledge, history)
    3. Runs the LangGraph agent with context
    4. Returns the answer with metadata

    For equipment-affecting actions, the agent may pause and wait for confirmation
    via the /threads/{thread_id}/interrupt endpoint.
    """
    # Generate or use session ID
    session_id = req.session_id or f"sess_{uuid4().hex[:12]}"

    logger.info(
        "query_received",
        question=req.question[:50],
        session_id=session_id,
        tool_id=req.tool_id,
    )

    # Classify query
    classifier = QueryClassifier()
    profile = classifier.classify(req.question)

    # Override tool_id if provided in request
    if req.tool_id:
        profile.extracted_tool_id = req.tool_id

    # Get LightRAG service for context assembly
    lightrag = await get_lightrag_service()

    # Assemble context
    assembler = ContextAssembler(
        lightrag_service=lightrag,
        redis_client=request.app.state.redis,
    )
    context = await assembler.assemble(
        question=req.question,
        profile=profile,
        session_id=session_id,
    )

    # Get agent
    agent = await get_or_create_agent(request)

    # Run query
    result = await agent.run(
        question=req.question,
        session_id=session_id,
        system_prompt=context.system_prompt,
        equipment_context=context.equipment_context,
    )

    logger.info(
        "query_completed",
        session_id=session_id,
        query_type=profile.query_type,
        message_count=result.get("message_count", 0),
    )

    return QueryResponse(
        answer=result["answer"],
        session_id=session_id,
        query_type=profile.query_type,
        lightrag_mode=profile.lightrag_mode,
    )


@router.post("/stream")
async def query_stream(req: QueryRequest, request: Request) -> StreamingResponse:
    """Query with streaming response.

    Returns a Server-Sent Events stream with tokens as they're generated.
    Format: `data: {token}\\n\\n`
    Final message: `data: [DONE]\\n\\n`
    """
    session_id = req.session_id or f"sess_{uuid4().hex[:12]}"

    logger.info(
        "stream_query_received",
        question=req.question[:50],
        session_id=session_id,
    )

    # Classify and assemble context
    classifier = QueryClassifier()
    profile = classifier.classify(req.question)

    if req.tool_id:
        profile.extracted_tool_id = req.tool_id

    lightrag = await get_lightrag_service()
    assembler = ContextAssembler(
        lightrag_service=lightrag,
        redis_client=request.app.state.redis,
    )
    context = await assembler.assemble(
        question=req.question,
        profile=profile,
        session_id=session_id,
    )

    agent = await get_or_create_agent(request)

    async def generate() -> AsyncGenerator[str, None]:
        """Stream tokens from agent.

        Note: Full LangGraph streaming requires additional setup.
        For now, we return the full response as a single chunk.
        """
        try:
            result = await agent.run(
                question=req.question,
                session_id=session_id,
                system_prompt=context.system_prompt,
                equipment_context=context.equipment_context,
            )
            yield f"data: {result['answer']}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error("stream_error", error=str(e))
            yield f"data: Error: {str(e)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
