# rag-engine/app/tools/actions.py
"""Action proposal tools for LangGraph agent with human-in-the-loop."""
import json
from typing import Literal

from langchain_core.tools import tool


@tool
def propose_action(
    action_type: Literal["adjust_focus", "adjust_dose", "run_calibration", "escalate"],
    parameters: dict,
    reasoning: str,
) -> str:
    """Propose an equipment-affecting action that requires engineer confirmation.

    This will pause execution and wait for the engineer to approve or reject.
    Only use this for actions that could affect equipment or process.

    Args:
        action_type: Type of action (adjust_focus, adjust_dose, run_calibration, escalate)
        parameters: Action parameters (e.g., {"offset": -6} for focus adjustment)
        reasoning: Explanation for why this action is recommended

    Returns:
        Confirmation status from engineer
    """
    # This marker signals the orchestrator to use LangGraph interrupt
    return f"__INTERRUPT_ACTION__|{action_type}|{json.dumps(parameters)}|{reasoning}"


@tool
def log_insight(
    insight: str,
    category: Literal["observation", "diagnosis", "recommendation"] = "observation",
) -> str:
    """Record an insight or finding for audit trail.

    Args:
        insight: The insight or finding to log
        category: Type of insight (observation, diagnosis, recommendation)

    Returns:
        Confirmation that insight was logged
    """
    return f"__LOG_INSIGHT__|{category}|{insight}"
