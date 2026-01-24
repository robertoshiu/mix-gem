# rag-engine/app/core/agent.py
"""LangGraph agent orchestrator with custom tool execution."""
import json
from typing import Any

import structlog
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import tools_condition
from langgraph.types import interrupt
from psycopg_pool import AsyncConnectionPool

from app.config import settings
from app.tools.actions import log_insight, propose_action
from app.tools.equipment import analyze_alarm, get_equipment_state
from app.tools.knowledge import parse_lightrag_tool_call, search_knowledge

logger = structlog.get_logger()


# All available tools
TOOLS = [
    search_knowledge,
    get_equipment_state,
    analyze_alarm,
    propose_action,
    log_insight,
]


class RAGAgentOrchestrator:
    """LangGraph-based agent orchestrator with custom tool execution."""

    def __init__(
        self,
        pg_pool: AsyncConnectionPool,
        lightrag_service: Any,
        redis_client: Any,
    ):
        self.pg_pool = pg_pool
        self.lightrag = lightrag_service
        self.redis = redis_client
        self._checkpointer: AsyncPostgresSaver | None = None
        self._graph = None

    async def initialize(self) -> None:
        """Initialize LangGraph checkpointer and compile graph."""
        # Create PostgreSQL checkpointer
        self._checkpointer = AsyncPostgresSaver(self.pg_pool)
        await self._checkpointer.setup()

        # Build the graph
        self._graph = await self._build_graph()

        logger.info("agent_initialized")

    async def _build_graph(self):
        """Build the LangGraph state machine."""
        # Create LLM with tools bound
        llm = ChatAnthropic(
            model=settings.llm_model,
            api_key=settings.anthropic_api_key,
            temperature=0.1,
            max_tokens=4096,
        ).bind_tools(TOOLS)

        async def call_llm(state: MessagesState) -> dict:
            """Call the LLM with current messages."""
            response = await llm.ainvoke(state["messages"])
            return {"messages": [response]}

        async def execute_tools(state: MessagesState) -> dict:
            """Execute tools with custom handling for LightRAG/Redis."""
            last_message = state["messages"][-1]
            tool_messages = []

            for tool_call in last_message.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]

                logger.info("executing_tool", tool=tool_name, args=tool_args)

                # Execute the tool (gets marker)
                tool = next((t for t in TOOLS if t.name == tool_name), None)
                if not tool:
                    result = f"Unknown tool: {tool_name}"
                else:
                    result = tool.invoke(tool_args)

                # Handle custom markers
                result = await self._resolve_tool_result(result, tool_name, tool_args)

                tool_messages.append(
                    ToolMessage(content=result, tool_call_id=tool_call["id"])
                )

            return {"messages": tool_messages}

        # Build state graph
        workflow = StateGraph(MessagesState)

        # Add nodes
        workflow.add_node("llm", call_llm)
        workflow.add_node("tools", execute_tools)

        # Add edges
        workflow.add_edge(START, "llm")
        workflow.add_conditional_edges(
            "llm",
            tools_condition,
            {"tools": "tools", END: END},
        )
        workflow.add_edge("tools", "llm")

        # Compile with checkpointer
        return workflow.compile(checkpointer=self._checkpointer)

    async def _resolve_tool_result(
        self,
        result: str,
        tool_name: str,
        tool_args: dict,
    ) -> str:
        """Resolve tool markers to actual results."""
        # Handle LightRAG queries
        if result.startswith("__LIGHTRAG_QUERY__"):
            parsed = parse_lightrag_tool_call(result)
            if parsed:
                mode, query = parsed
                return await self.lightrag.query(query, mode=mode)

        # Handle Redis equipment lookup
        if result.startswith("__REDIS_EQUIPMENT__"):
            tool_id = result.split("|")[1]
            state = await self.redis.hgetall(f"equipment:state:{tool_id}")
            if state:
                decoded = {
                    k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v
                    for k, v in state.items()
                }
                return json.dumps(decoded, indent=2)
            return json.dumps({"tool_id": tool_id, "state": "not found"})

        # Handle action interrupts
        if result.startswith("__INTERRUPT_ACTION__"):
            parts = result.split("|")
            action_type = parts[1]
            params = json.loads(parts[2])
            reasoning = parts[3]

            # Use LangGraph interrupt to pause and wait for human
            decision = interrupt({
                "action_type": action_type,
                "parameters": params,
                "reasoning": reasoning,
                "requires": "engineer_confirmation",
            })

            if decision.get("approved"):
                return f"Action {action_type} approved by engineer. Proceeding with parameters: {params}"
            else:
                return f"Action {action_type} rejected by engineer. Reason: {decision.get('reason', 'No reason given')}"

        # Handle insight logging
        if result.startswith("__LOG_INSIGHT__"):
            parts = result.split("|", 2)
            category = parts[1]
            insight = parts[2]
            # TODO: Actually log to database
            return f"Insight logged: [{category}] {insight[:100]}..."

        return result

    async def run(
        self,
        question: str,
        session_id: str,
        system_prompt: str | None = None,
        equipment_context: dict | None = None,
    ) -> dict:
        """Run the agent on a question.

        Args:
            question: User's question
            session_id: Thread ID for conversation continuity
            system_prompt: Optional system context
            equipment_context: Optional equipment state to include

        Returns:
            Dict with answer, pending_actions, and metadata
        """
        if not self._graph:
            raise RuntimeError("Agent not initialized. Call initialize() first.")

        # Build initial message with context
        content = question
        if equipment_context:
            content = f"Current equipment state:\n{json.dumps(equipment_context, indent=2)}\n\nQuestion: {question}"

        messages = [HumanMessage(content=content)]

        if system_prompt:
            # LangGraph doesn't have explicit system message support in MessagesState
            # We prepend it to the first message
            messages[0] = HumanMessage(content=f"[System: {system_prompt}]\n\n{content}")

        config = {"configurable": {"thread_id": session_id}}

        # Run the graph
        result = await self._graph.ainvoke({"messages": messages}, config=config)

        # Extract final answer
        final_message = result["messages"][-1]
        answer = final_message.content if isinstance(final_message, AIMessage) else str(final_message)

        return {
            "answer": answer,
            "session_id": session_id,
            "message_count": len(result["messages"]),
        }

    async def resume(
        self,
        session_id: str,
        decision: dict,
    ) -> dict:
        """Resume an interrupted conversation with a decision.

        Args:
            session_id: Thread ID to resume
            decision: Dict with 'approved' bool and optional 'reason'

        Returns:
            Dict with answer and metadata
        """
        if not self._graph:
            raise RuntimeError("Agent not initialized. Call initialize() first.")

        config = {"configurable": {"thread_id": session_id}}

        # Resume with the decision
        result = await self._graph.ainvoke(decision, config=config)

        final_message = result["messages"][-1]
        answer = final_message.content if isinstance(final_message, AIMessage) else str(final_message)

        return {
            "answer": answer,
            "session_id": session_id,
            "resumed": True,
        }
