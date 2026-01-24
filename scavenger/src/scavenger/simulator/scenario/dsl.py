"""Python DSL for defining test scenarios in a Pythonic way.

This module provides a fluent interface for defining SECS/GEM test scenarios
using Python classes and helper functions instead of YAML.

Example usage:

    from scavenger.simulator.scenario.dsl import (
        DSLScenario, wait, set_sv, set_alarm, send_message
    )

    class MyTestScenario(DSLScenario):
        name = "establish_communication"
        description = "Test S1F13/S1F14 communication establishment"
        equipment_id = 1
        initial_state = {"svs": {1: 0}}
        steps = [
            wait(100),
            set_sv(1, 42),
            set_alarm(1001, 2, "Vacuum pressure low"),
            send_message(1, 13, body={"MDLN": "Test", "SOFTREV": "1.0"}),
        ]

    # Convert to Scenario for execution
    scenario = MyTestScenario.to_scenario()
"""
from typing import Any

from scavenger.simulator.scenario.models import Scenario, ScenarioStep


class DSLValidationError(Exception):
    """Raised when a DSL scenario definition is invalid."""
    pass


class DSLScenario:
    """Base class for Python DSL scenario definitions.

    Subclasses define scenarios using class attributes:
    - name (required): Scenario name
    - description (required): Description of the scenario
    - equipment_id (required): Target equipment ID
    - steps (required): List of step dictionaries
    - initial_state (optional): Initial state to apply before execution
    - metadata (optional): Tags, author, and other metadata

    Use the step builder functions (wait, set_sv, etc.) to create steps.
    """

    name: str
    description: str
    equipment_id: int
    steps: list[dict[str, Any]]
    initial_state: dict[str, Any] | None = None
    metadata: dict[str, Any] | None = None

    @classmethod
    def to_scenario(cls) -> Scenario:
        """Convert DSL class to Scenario instance.

        Returns:
            Validated Scenario ready for execution

        Raises:
            DSLValidationError: If required attributes are missing or invalid
        """
        # Validate required attributes
        cls._validate()

        # Convert step dicts to ScenarioStep objects
        scenario_steps = []
        for i, step_dict in enumerate(cls.steps):
            if not isinstance(step_dict, dict):
                raise DSLValidationError(
                    f"Step {i} must be a dictionary, got {type(step_dict).__name__}"
                )

            if "action" not in step_dict:
                raise DSLValidationError(f"Step {i} missing 'action' key")

            if "params" not in step_dict:
                raise DSLValidationError(f"Step {i} missing 'params' key")

            scenario_steps.append(
                ScenarioStep(
                    action=step_dict["action"],
                    params=step_dict["params"],
                    condition=step_dict.get("condition"),
                )
            )

        return Scenario(
            name=cls.name,
            description=cls.description,
            equipment_id=cls.equipment_id,
            steps=scenario_steps,
            initial_state=cls.initial_state,
            metadata=cls.metadata or {},
        )

    @classmethod
    def _validate(cls) -> None:
        """Validate that required class attributes are present."""
        if not hasattr(cls, "name") or cls.name is None:
            raise DSLValidationError(f"DSL class {cls.__name__} missing required 'name' attribute")

        if not hasattr(cls, "description") or cls.description is None:
            raise DSLValidationError(
                f"DSL class {cls.__name__} missing required 'description' attribute"
            )

        if not hasattr(cls, "equipment_id"):
            raise DSLValidationError(
                f"DSL class {cls.__name__} missing required 'equipment_id' attribute"
            )

        if not hasattr(cls, "steps") or cls.steps is None:
            raise DSLValidationError(
                f"DSL class {cls.__name__} missing required 'steps' attribute"
            )


# =============================================================================
# Step Builder Functions
# =============================================================================


def wait(duration_ms: int) -> dict[str, Any]:
    """Create a wait step.

    Args:
        duration_ms: Duration to wait in milliseconds

    Returns:
        Step dictionary for wait action
    """
    return {
        "action": "wait",
        "params": {"duration_ms": duration_ms},
    }


def set_sv(svid: int, value: Any) -> dict[str, Any]:
    """Create a set_sv step.

    Args:
        svid: Status variable ID
        value: Value to set

    Returns:
        Step dictionary for set_sv action
    """
    return {
        "action": "set_sv",
        "params": {"svid": svid, "value": value},
    }


def set_alarm(alid: int, alcd: int, altx: str) -> dict[str, Any]:
    """Create a set_alarm step.

    Args:
        alid: Alarm ID
        alcd: Alarm code (1-8 per SEMI E30)
        altx: Alarm text description

    Returns:
        Step dictionary for set_alarm action
    """
    return {
        "action": "set_alarm",
        "params": {"alid": alid, "alcd": alcd, "altx": altx},
    }


def clear_alarm(alid: int) -> dict[str, Any]:
    """Create a clear_alarm step.

    Args:
        alid: Alarm ID to clear

    Returns:
        Step dictionary for clear_alarm action
    """
    return {
        "action": "clear_alarm",
        "params": {"alid": alid},
    }


def send_message(
    stream: int,
    function: int,
    wbit: bool | None = None,
    body: Any = None,
) -> dict[str, Any]:
    """Create a send_message step.

    Args:
        stream: SECS stream number
        function: SECS function number
        wbit: Wait bit (default: True for odd functions)
        body: Message body

    Returns:
        Step dictionary for send_message action
    """
    params: dict[str, Any] = {
        "stream": stream,
        "function": function,
    }

    if wbit is not None:
        params["wbit"] = wbit

    if body is not None:
        params["body"] = body

    return {
        "action": "send_message",
        "params": params,
    }


def trigger_event(ceid: int, dvs: dict[int, Any] | None = None) -> dict[str, Any]:
    """Create a trigger_event step.

    Args:
        ceid: Collection event ID
        dvs: Optional data values to include in event

    Returns:
        Step dictionary for trigger_event action
    """
    params: dict[str, Any] = {"ceid": ceid}

    if dvs is not None:
        params["dvs"] = dvs

    return {
        "action": "trigger_event",
        "params": params,
    }


def when(condition: str, step: dict[str, Any]) -> dict[str, Any]:
    """Add a condition to a step.

    Args:
        condition: Condition expression (e.g., "sv[1] == 100")
        step: Step dictionary to add condition to

    Returns:
        Step dictionary with condition added

    Example:
        when("sv[1] > 0", set_sv(2, 100))
    """
    return {**step, "condition": condition}


# =============================================================================
# Advanced Step Builders
# =============================================================================


def expect_message(
    stream: int,
    function: int,
    timeout_ms: int = 5000,
    body_match: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Create an expect_message step (waits for incoming message).

    Args:
        stream: Expected SECS stream number
        function: Expected SECS function number
        timeout_ms: Timeout in milliseconds
        body_match: Optional body fields to match

    Returns:
        Step dictionary for expect_message action
    """
    params: dict[str, Any] = {
        "stream": stream,
        "function": function,
        "timeout_ms": timeout_ms,
    }

    if body_match is not None:
        params["body_match"] = body_match

    return {
        "action": "expect_message",
        "params": params,
    }


def set_ecv(ecid: int, value: Any) -> dict[str, Any]:
    """Create a set_ecv step for equipment constant variables.

    Args:
        ecid: Equipment constant ID
        value: Value to set

    Returns:
        Step dictionary for set_ecv action
    """
    return {
        "action": "set_ecv",
        "params": {"ecid": ecid, "value": value},
    }


def log(message: str, level: str = "info") -> dict[str, Any]:
    """Create a log step for debugging.

    Args:
        message: Message to log
        level: Log level (debug, info, warning, error)

    Returns:
        Step dictionary for log action
    """
    return {
        "action": "log",
        "params": {"message": message, "level": level},
    }


def repeat(times: int, *steps: dict[str, Any]) -> list[dict[str, Any]]:
    """Create multiple copies of steps.

    Args:
        times: Number of times to repeat
        *steps: Steps to repeat

    Returns:
        List of repeated steps

    Example:
        steps = [
            *repeat(3, wait(100), set_sv(1, 42)),
        ]
    """
    result = []
    for _ in range(times):
        result.extend(steps)
    return result
