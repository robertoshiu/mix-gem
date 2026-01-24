"""Scenario execution engine for SECS/GEM test scenarios.

This module provides the engine that executes test scenario steps against
equipment simulators or EAP clients.
"""
import asyncio
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

from scavenger.simulator.scenario.models import Scenario, ScenarioStep

logger = logging.getLogger(__name__)


# Custom exceptions
class ScenarioExecutionError(Exception):
    """Base exception for scenario execution errors."""
    pass


class ActionNotFoundError(ScenarioExecutionError):
    """Raised when an unknown action is requested."""
    pass


class ActionParamsError(ScenarioExecutionError):
    """Raised when action parameters are missing or invalid."""
    pass


class NoEquipmentError(ScenarioExecutionError):
    """Raised when equipment action is called without equipment server."""
    pass


class ConditionEvaluationError(ScenarioExecutionError):
    """Raised when condition evaluation fails."""
    pass


@dataclass
class StepLog:
    """Log entry for a single step execution."""
    step_index: int
    action: str
    params: dict[str, Any]
    success: bool
    started_at: datetime
    ended_at: datetime
    error: str | None = None
    skipped: bool = False


@dataclass
class ScenarioResult:
    """Result of scenario execution."""
    scenario_name: str
    success: bool
    steps_executed: int
    steps_skipped: int = 0
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: datetime | None = None
    step_logs: list[StepLog] = field(default_factory=list)
    error: str | None = None

    @property
    def duration_ms(self) -> float | None:
        """Calculate total duration in milliseconds."""
        if self.ended_at is None:
            return None
        return (self.ended_at - self.started_at).total_seconds() * 1000


# Type alias for action handlers
ActionHandler = Callable[["ScenarioEngine", dict[str, Any]], Awaitable[None]]


class ScenarioEngine:
    """Executes test scenarios against equipment simulators.

    The engine supports various actions:
    - wait: Pause execution for a duration
    - set_sv: Set a status variable
    - set_alarm: Set an alarm on equipment
    - clear_alarm: Clear an alarm
    - send_message: Send a SECS message
    - trigger_event: Trigger a collection event

    Actions can have conditions that determine whether they execute.
    """

    def __init__(
        self,
        equipment_server: Any = None,
        eap_client: Any = None,
    ) -> None:
        """Initialize the scenario engine.

        Args:
            equipment_server: Optional EquipmentServer instance for equipment actions
            eap_client: Optional EapClient instance for host-side actions
        """
        self.equipment_server = equipment_server
        self.eap_client = eap_client
        self._running = False
        self._current_scenario: Scenario | None = None

        # Register action handlers
        self._actions: dict[str, ActionHandler] = {
            "wait": self._action_wait,
            "set_sv": self._action_set_sv,
            "set_alarm": self._action_set_alarm,
            "clear_alarm": self._action_clear_alarm,
            "send_message": self._action_send_message,
            "trigger_event": self._action_trigger_event,
        }

    @property
    def is_running(self) -> bool:
        """Check if engine is currently executing a scenario."""
        return self._running

    def register_action(self, name: str, handler: ActionHandler) -> None:
        """Register a custom action handler.

        Args:
            name: Action name
            handler: Async function that executes the action
        """
        self._actions[name] = handler

    async def run(self, scenario: Scenario) -> ScenarioResult:
        """Execute a scenario.

        Args:
            scenario: The scenario to execute

        Returns:
            ScenarioResult with execution details

        Raises:
            ActionNotFoundError: If scenario contains unknown action
            ActionParamsError: If action parameters are invalid
            NoEquipmentError: If equipment action without equipment server
        """
        self._running = True
        self._current_scenario = scenario

        result = ScenarioResult(
            scenario_name=scenario.name,
            success=True,
            steps_executed=0,
            steps_skipped=0,
            started_at=datetime.now(timezone.utc),
        )

        logger.info(f"Starting scenario: {scenario.name}")

        try:
            # Apply initial state if provided
            if scenario.initial_state and self.equipment_server:
                self._apply_initial_state(scenario.initial_state)

            # Execute each step
            for i, step in enumerate(scenario.steps):
                step_log = await self._execute_step(i, step)
                result.step_logs.append(step_log)

                if step_log.skipped:
                    result.steps_skipped += 1
                    logger.debug(f"Step {i} skipped (condition false): {step.action}")
                elif step_log.success:
                    result.steps_executed += 1
                    logger.debug(f"Step {i} completed: {step.action}")
                else:
                    result.success = False
                    result.error = step_log.error
                    logger.error(f"Step {i} failed: {step.action} - {step_log.error}")
                    break

        except Exception as e:
            result.success = False
            result.error = str(e)
            logger.error(f"Scenario execution failed: {e}")
            raise

        finally:
            result.ended_at = datetime.now(timezone.utc)
            self._running = False
            self._current_scenario = None
            logger.info(
                f"Scenario {scenario.name} completed: "
                f"success={result.success}, steps={result.steps_executed}"
            )

        return result

    async def _execute_step(self, index: int, step: ScenarioStep) -> StepLog:
        """Execute a single scenario step.

        Args:
            index: Step index in scenario
            step: The step to execute

        Returns:
            StepLog with execution details
        """
        started_at = datetime.now(timezone.utc)

        # Check condition if present
        if step.condition is not None:
            try:
                if not self._evaluate_condition(step.condition):
                    return StepLog(
                        step_index=index,
                        action=step.action,
                        params=step.params,
                        success=True,
                        started_at=started_at,
                        ended_at=datetime.now(timezone.utc),
                        skipped=True,
                    )
            except Exception as e:
                return StepLog(
                    step_index=index,
                    action=step.action,
                    params=step.params,
                    success=False,
                    started_at=started_at,
                    ended_at=datetime.now(timezone.utc),
                    error=f"Condition evaluation failed: {e}",
                )

        # Look up action handler
        if step.action not in self._actions:
            raise ActionNotFoundError(f"Unknown action: {step.action}")

        handler = self._actions[step.action]

        try:
            await handler(step.params)
            return StepLog(
                step_index=index,
                action=step.action,
                params=step.params,
                success=True,
                started_at=started_at,
                ended_at=datetime.now(timezone.utc),
            )
        except Exception as e:
            return StepLog(
                step_index=index,
                action=step.action,
                params=step.params,
                success=False,
                started_at=started_at,
                ended_at=datetime.now(timezone.utc),
                error=str(e),
            )

    def _evaluate_condition(self, condition: str) -> bool:
        """Evaluate a step condition expression.

        Supported syntax:
        - sv[id] == value: Check status variable
        - alarm[id].is_set: Check if alarm is set
        - True/False: Boolean literals

        Args:
            condition: Condition expression string

        Returns:
            True if condition is met, False otherwise
        """
        if not self.equipment_server:
            # Without equipment, conditions default to True
            return True

        state = self.equipment_server.get_state()

        # Build evaluation context
        context: dict[str, Any] = {
            "True": True,
            "False": False,
        }

        # Create sv accessor
        class SVAccessor:
            def __getitem__(self, svid: int) -> Any:
                from scavenger.simulator.equipment.state import VariableType
                return state.get_variable(VariableType.SV, svid)

        # Create alarm accessor
        class AlarmAccessor:
            def __getitem__(self, alid: int) -> Any:
                return state.get_alarm(alid)

        context["sv"] = SVAccessor()
        context["alarm"] = AlarmAccessor()

        try:
            # Safe eval with restricted context
            result = eval(condition, {"__builtins__": {}}, context)
            return bool(result)
        except Exception as e:
            raise ConditionEvaluationError(f"Failed to evaluate '{condition}': {e}")

    def _apply_initial_state(self, initial_state: dict[str, Any]) -> None:
        """Apply initial state to equipment.

        Args:
            initial_state: State dictionary with svs, alarms, etc.
        """
        from scavenger.simulator.equipment.state import VariableType

        state = self.equipment_server.get_state()

        # Apply SVs
        if "svs" in initial_state:
            for svid, value in initial_state["svs"].items():
                state.set_variable(VariableType.SV, int(svid), value)

        # Apply ECVs
        if "ecvs" in initial_state:
            for ecid, value in initial_state["ecvs"].items():
                state.set_variable(VariableType.ECV, int(ecid), value)

        # Apply alarms
        if "alarms" in initial_state:
            for alid, alarm_data in initial_state["alarms"].items():
                if alarm_data.get("is_set", False):
                    state.set_alarm(
                        int(alid),
                        alarm_data.get("alcd", 0),
                        alarm_data.get("altx", ""),
                    )

    # =========================================================================
    # Action Handlers
    # =========================================================================

    async def _action_wait(self, params: dict[str, Any]) -> None:
        """Wait for a specified duration.

        Params:
            duration_ms: Duration to wait in milliseconds
        """
        if "duration_ms" not in params:
            raise ActionParamsError("wait action requires 'duration_ms' parameter")

        duration_ms = params["duration_ms"]
        await asyncio.sleep(duration_ms / 1000.0)

    async def _action_set_sv(self, params: dict[str, Any]) -> None:
        """Set a status variable on equipment.

        Params:
            svid: Status variable ID
            value: Value to set
        """
        if "svid" not in params or "value" not in params:
            raise ActionParamsError("set_sv action requires 'svid' and 'value' parameters")

        if not self.equipment_server:
            raise NoEquipmentError("set_sv action requires equipment_server")

        from scavenger.simulator.equipment.state import VariableType

        svid = params["svid"]
        value = params["value"]

        state = self.equipment_server.get_state()
        state.set_variable(VariableType.SV, svid, value)

    async def _action_set_alarm(self, params: dict[str, Any]) -> None:
        """Set an alarm on equipment.

        Params:
            alid: Alarm ID
            alcd: Alarm code (1-8 per SEMI E30)
            altx: Alarm text
        """
        required = ["alid", "alcd", "altx"]
        missing = [p for p in required if p not in params]
        if missing:
            raise ActionParamsError(f"set_alarm action requires: {missing}")

        if not self.equipment_server:
            raise NoEquipmentError("set_alarm action requires equipment_server")

        alid = params["alid"]
        alcd = params["alcd"]
        altx = params["altx"]

        state = self.equipment_server.get_state()
        state.set_alarm(alid, alcd, altx)

    async def _action_clear_alarm(self, params: dict[str, Any]) -> None:
        """Clear an alarm on equipment.

        Params:
            alid: Alarm ID to clear
        """
        if "alid" not in params:
            raise ActionParamsError("clear_alarm action requires 'alid' parameter")

        if not self.equipment_server:
            raise NoEquipmentError("clear_alarm action requires equipment_server")

        alid = params["alid"]
        state = self.equipment_server.get_state()
        state.clear_alarm(alid)

    async def _action_send_message(self, params: dict[str, Any]) -> None:
        """Send a SECS message.

        Params:
            stream: SECS stream number
            function: SECS function number
            wbit: Wait bit (optional, default True for odd functions)
            body: Message body (optional)
        """
        required = ["stream", "function"]
        missing = [p for p in required if p not in params]
        if missing:
            raise ActionParamsError(f"send_message action requires: {missing}")

        stream = params["stream"]
        function = params["function"]
        wbit = params.get("wbit", function % 2 == 1)  # Default: wbit=True for primary
        body = params.get("body")

        # If we have equipment server, queue the message
        if self.equipment_server:
            from scavenger.simulator.common.messages import SecsMessageData

            msg = SecsMessageData(
                stream=stream,
                function=function,
                wbit=wbit,
                body=body,
            )
            # For now, just log - actual sending requires connection
            logger.info(f"Queued message: S{stream}F{function}")

        # If we have EAP client, send via client
        elif self.eap_client:
            # EAP client send implementation would go here
            logger.info(f"Would send via EAP: S{stream}F{function}")

        else:
            # No server or client - log only
            logger.info(f"No target for message: S{stream}F{function}")

    async def _action_trigger_event(self, params: dict[str, Any]) -> None:
        """Trigger a collection event.

        Params:
            ceid: Collection event ID
            dvs: Optional data values dictionary
        """
        if "ceid" not in params:
            raise ActionParamsError("trigger_event action requires 'ceid' parameter")

        if not self.equipment_server:
            raise NoEquipmentError("trigger_event action requires equipment_server")

        ceid = params["ceid"]
        dvs = params.get("dvs")

        await self.equipment_server.trigger_event(ceid, dvs)
