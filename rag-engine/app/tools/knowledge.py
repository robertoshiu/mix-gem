# rag-engine/app/tools/knowledge.py
"""Knowledge retrieval tools for LangGraph agent."""
from typing import Literal

from langchain_core.tools import tool


@tool
def search_knowledge(
    query: str,
    mode: Literal["naive", "local", "global", "hybrid", "mix"] = "hybrid",
) -> str:
    """Search the lithography knowledge base for concepts, Q&A, anomaly patterns, or process windows.

    Use 'local' mode for specific entity facts (who, what, when).
    Use 'global' mode for broad themes and patterns.
    Use 'hybrid' mode (default) for comprehensive results combining both.

    Args:
        query: Natural language search query about lithography processes
        mode: Search mode - 'local' for entity-focused, 'global' for themes, 'hybrid' for both

    Returns:
        Retrieved knowledge with entity relationships
    """
    # This is a sync wrapper - actual async call happens in tool execution
    # The tool executor will handle the async LightRAG call
    return f"__LIGHTRAG_QUERY__|{mode}|{query}"


def parse_lightrag_tool_call(tool_result: str) -> tuple[str, str] | None:
    """Parse a LightRAG tool call marker."""
    if tool_result.startswith("__LIGHTRAG_QUERY__"):
        parts = tool_result.split("|", 2)
        if len(parts) == 3:
            return parts[1], parts[2]  # mode, query
    return None
