# rag-engine/app/core/context_assembler.py
"""Context assembler for building tiered context windows."""
import json
from dataclasses import dataclass
from typing import Any

import structlog

from app.core.query_classifier import QueryProfile

logger = structlog.get_logger()

SYSTEM_TEMPLATE = """You are a lithography process engineering assistant with real-time equipment integration.

Current Equipment: {tool_id}
Domain Focus: {domains}

Capabilities:
- Answer process engineering questions using retrieved knowledge
- Analyze equipment state from SECS/GEM messages
- Propose corrective actions (requires engineer confirmation)

Available tools:
- search_knowledge: Query the lithography knowledge graph (supports local, global, hybrid modes)
- get_equipment_state: Fetch current equipment parameters from Redis
- analyze_alarm: Match alarms to known anomaly patterns
- propose_action: Queue equipment-affecting actions for engineer approval
- log_insight: Record findings for audit trail

Guidelines:
- For troubleshooting, check equipment state first, then search knowledge
- Always provide evidence-based recommendations with confidence levels
- Actions affecting equipment MUST be proposed via propose_action (not executed directly)
- Log key insights for audit trail
"""


@dataclass
class AssembledContext:
    """Complete context ready for agent invocation."""

    system_prompt: str
    equipment_context: dict[str, Any] | None
    retrieved_knowledge: str | None
    conversation_history: list[dict] | None
    profile: QueryProfile


class ContextAssembler:
    """Assembles tiered context for LangGraph agent."""

    def __init__(
        self,
        lightrag_service: Any,
        redis_client: Any,
    ):
        self.lightrag = lightrag_service
        self.redis = redis_client

    async def assemble(
        self,
        question: str,
        profile: QueryProfile,
        session_id: str | None = None,
        max_tokens: int = 8000,
    ) -> AssembledContext:
        """Assemble complete context based on query profile.

        Args:
            question: User's question
            profile: Query classification profile
            session_id: Optional session ID for history
            max_tokens: Maximum context tokens

        Returns:
            AssembledContext ready for agent
        """
        # Build Tier 1: System prompt
        system_prompt = self._build_system_prompt(profile)

        # Build Tier 2: Equipment context (if tool mentioned)
        equipment_context = None
        if profile.extracted_tool_id:
            equipment_context = await self._build_equipment_context(
                profile.extracted_tool_id
            )

        # Build Tier 3: Retrieved knowledge
        retrieved_knowledge = await self._build_knowledge_context(
            question,
            profile,
        )

        # Build Tier 4: Conversation history
        conversation_history = None
        if session_id:
            conversation_history = await self._build_history_context(session_id)

        return AssembledContext(
            system_prompt=system_prompt,
            equipment_context=equipment_context,
            retrieved_knowledge=retrieved_knowledge,
            conversation_history=conversation_history,
            profile=profile,
        )

    def _build_system_prompt(self, profile: QueryProfile) -> str:
        """Build Tier 1 system prompt."""
        return SYSTEM_TEMPLATE.format(
            tool_id=profile.extracted_tool_id or "Not specified",
            domains=", ".join(profile.extracted_domains) if profile.extracted_domains else "General",
        )

    async def _build_equipment_context(self, tool_id: str) -> dict[str, Any] | None:
        """Build Tier 2 equipment context from Redis."""
        try:
            state = await self.redis.hgetall(f"equipment:state:{tool_id}")
            if state:
                decoded = {
                    k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v
                    for k, v in state.items()
                }
                return {"tool_id": tool_id, **decoded}
        except Exception as e:
            logger.warning("equipment_context_failed", tool_id=tool_id, error=str(e))
        return None

    async def _build_knowledge_context(
        self,
        question: str,
        profile: QueryProfile,
    ) -> str | None:
        """Build Tier 3 knowledge context from LightRAG."""
        try:
            result = await self.lightrag.query(
                question,
                mode=profile.lightrag_mode,
                only_context=True,  # Raw context, not LLM-generated answer
            )
            return result
        except Exception as e:
            logger.warning("knowledge_context_failed", error=str(e))
        return None

    async def _build_history_context(
        self,
        session_id: str,
    ) -> list[dict] | None:
        """Build Tier 4 conversation history."""
        try:
            # Get recent messages from Redis
            messages = await self.redis.lrange(
                f"session:{session_id}:history",
                -10,  # Last 10 messages
                -1,
            )
            if messages:
                return [json.loads(m) for m in messages]
        except Exception as e:
            logger.warning("history_context_failed", session_id=session_id, error=str(e))
        return None
