"""Scenario data models for test scenario execution.

This module defines the unified internal representation for test scenarios
loaded from YAML files, database, or Python DSL.
"""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ScenarioStep:
    """A single step in a test scenario.

    Attributes:
        action: The action to perform (e.g., "send_message", "wait", "expect_message")
        params: Parameters for the action
        condition: Optional condition for conditional execution
    """
    action: str
    params: dict[str, Any]
    condition: str | None = None


@dataclass
class Scenario:
    """Unified representation of a test scenario.

    Attributes:
        name: Human-readable scenario name
        description: Description of what the scenario tests
        equipment_id: ID of the equipment this scenario applies to
        steps: List of steps to execute
        initial_state: Optional initial state to set before execution
        metadata: Optional metadata (tags, author, version, etc.)
    """
    name: str
    description: str
    equipment_id: int
    steps: list[ScenarioStep]
    initial_state: dict[str, Any] | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class ScenarioValidationError(Exception):
    """Raised when a scenario fails validation."""
    pass


class ScenarioNotFoundError(Exception):
    """Raised when a requested scenario cannot be found."""
    pass


class ScenarioDSLError(Exception):
    """Raised when a Python DSL scenario has errors."""
    pass
