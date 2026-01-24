# rag-engine/app/tools/equipment.py
"""Equipment state retrieval tools for LangGraph agent."""
from langchain_core.tools import tool


@tool
def get_equipment_state(
    tool_id: str,
) -> str:
    """Get current state of lithography equipment including process parameters, active alarms, and recent events.

    Args:
        tool_id: Equipment identifier (e.g., LITHO01, LITHO02)

    Returns:
        Current equipment state including focus_offset, dose, alarms, and status
    """
    # This is a sync wrapper - actual async call happens in tool execution
    return f"__REDIS_EQUIPMENT__|{tool_id}"


@tool
def analyze_alarm(
    alarm_text: str,
    tool_id: str | None = None,
) -> str:
    """Analyze an alarm by matching it to known anomaly patterns in the knowledge base.

    Args:
        alarm_text: Alarm message or description
        tool_id: Related equipment identifier (optional)

    Returns:
        Matching anomaly patterns with root causes and recommended actions
    """
    # Combines equipment context with LightRAG graph lookup
    query = f"Anomaly pattern for alarm: {alarm_text}"
    if tool_id:
        query += f" on equipment {tool_id}"
    return f"__LIGHTRAG_QUERY__|local|{query}"
