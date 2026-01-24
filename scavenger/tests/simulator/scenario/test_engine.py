"""Tests for scenario execution engine."""
import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from scavenger.simulator.scenario.models import Scenario, ScenarioStep


class TestScenarioEngineInit:
    """Tests for ScenarioEngine initialization."""

    def test_engine_init_without_equipment(self):
        """ScenarioEngine initializes without equipment server."""
        from scavenger.simulator.scenario.engine import ScenarioEngine

        engine = ScenarioEngine()
        assert engine is not None
        assert engine.is_running is False

    def test_engine_init_with_equipment(self):
        """ScenarioEngine initializes with equipment server."""
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer

        equipment = EquipmentServer(equipment_id=1, port=15100)
        engine = ScenarioEngine(equipment_server=equipment)

        assert engine.equipment_server == equipment


class TestScenarioEngineExecution:
    """Tests for scenario step execution."""

    @pytest.fixture
    def sample_scenario(self) -> Scenario:
        """Create a sample scenario for testing."""
        return Scenario(
            name="test_scenario",
            description="A test scenario",
            equipment_id=1,
            steps=[
                ScenarioStep(action="wait", params={"duration_ms": 10}),
                ScenarioStep(action="set_sv", params={"svid": 1, "value": 100}),
                ScenarioStep(action="set_alarm", params={"alid": 1001, "alcd": 2, "altx": "Test alarm"}),
            ],
        )

    @pytest.mark.asyncio
    async def test_engine_run_wait_action(self):
        """Engine executes wait action."""
        from scavenger.simulator.scenario.engine import ScenarioEngine

        scenario = Scenario(
            name="wait_test",
            description="Test wait action",
            equipment_id=1,
            steps=[
                ScenarioStep(action="wait", params={"duration_ms": 50}),
            ],
        )

        engine = ScenarioEngine()
        start = datetime.now(timezone.utc)
        result = await engine.run(scenario)
        elapsed = (datetime.now(timezone.utc) - start).total_seconds() * 1000

        assert result.success is True
        assert result.steps_executed == 1
        assert elapsed >= 40  # Allow some tolerance

    @pytest.mark.asyncio
    async def test_engine_run_set_sv_action(self):
        """Engine executes set_sv action on equipment."""
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer
        from scavenger.simulator.equipment.state import VariableType

        equipment = EquipmentServer(equipment_id=1, port=15101)
        engine = ScenarioEngine(equipment_server=equipment)

        scenario = Scenario(
            name="set_sv_test",
            description="Test set_sv action",
            equipment_id=1,
            steps=[
                ScenarioStep(action="set_sv", params={"svid": 1, "value": 42}),
            ],
        )

        result = await engine.run(scenario)

        assert result.success is True
        state = equipment.get_state()
        assert state.get_variable(VariableType.SV, 1) == 42

    @pytest.mark.asyncio
    async def test_engine_run_set_alarm_action(self):
        """Engine executes set_alarm action on equipment."""
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer

        equipment = EquipmentServer(equipment_id=1, port=15102)
        engine = ScenarioEngine(equipment_server=equipment)

        scenario = Scenario(
            name="set_alarm_test",
            description="Test set_alarm action",
            equipment_id=1,
            steps=[
                ScenarioStep(action="set_alarm", params={"alid": 1001, "alcd": 2, "altx": "Vacuum low"}),
            ],
        )

        result = await engine.run(scenario)

        assert result.success is True
        alarm = equipment.get_state().get_alarm(1001)
        assert alarm is not None
        assert alarm.is_set is True
        assert alarm.altx == "Vacuum low"

    @pytest.mark.asyncio
    async def test_engine_run_clear_alarm_action(self):
        """Engine executes clear_alarm action on equipment."""
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer

        equipment = EquipmentServer(equipment_id=1, port=15103)
        # Pre-set an alarm
        equipment.get_state().set_alarm(1001, 2, "Test alarm")

        engine = ScenarioEngine(equipment_server=equipment)

        scenario = Scenario(
            name="clear_alarm_test",
            description="Test clear_alarm action",
            equipment_id=1,
            steps=[
                ScenarioStep(action="clear_alarm", params={"alid": 1001}),
            ],
        )

        result = await engine.run(scenario)

        assert result.success is True
        alarm = equipment.get_state().get_alarm(1001)
        assert alarm is not None
        assert alarm.is_set is False

    @pytest.mark.asyncio
    async def test_engine_run_multiple_steps(self, sample_scenario):
        """Engine executes multiple steps in sequence."""
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer

        equipment = EquipmentServer(equipment_id=1, port=15104)
        engine = ScenarioEngine(equipment_server=equipment)

        result = await engine.run(sample_scenario)

        assert result.success is True
        assert result.steps_executed == 3

    @pytest.mark.asyncio
    async def test_engine_run_logs_steps(self):
        """Engine logs step execution."""
        from scavenger.simulator.scenario.engine import ScenarioEngine

        scenario = Scenario(
            name="log_test",
            description="Test logging",
            equipment_id=1,
            steps=[
                ScenarioStep(action="wait", params={"duration_ms": 1}),
            ],
        )

        engine = ScenarioEngine()
        result = await engine.run(scenario)

        assert len(result.step_logs) == 1
        assert result.step_logs[0].action == "wait"
        assert result.step_logs[0].success is True


class TestScenarioEngineActions:
    """Tests for specific action handlers."""

    @pytest.mark.asyncio
    async def test_action_send_message(self):
        """Engine sends SECS message via send_message action."""
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer

        equipment = EquipmentServer(equipment_id=1, port=15105)
        engine = ScenarioEngine(equipment_server=equipment)

        scenario = Scenario(
            name="send_msg_test",
            description="Test send_message action",
            equipment_id=1,
            steps=[
                ScenarioStep(
                    action="send_message",
                    params={
                        "stream": 1,
                        "function": 1,
                        "wbit": True,
                        "body": None,
                    },
                ),
            ],
        )

        # Even without connected client, action should succeed (message queued)
        result = await engine.run(scenario)
        assert result.success is True

    @pytest.mark.asyncio
    async def test_action_trigger_event(self):
        """Engine triggers collection event via trigger_event action."""
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer

        equipment = EquipmentServer(equipment_id=1, port=15106)
        engine = ScenarioEngine(equipment_server=equipment)

        scenario = Scenario(
            name="trigger_event_test",
            description="Test trigger_event action",
            equipment_id=1,
            steps=[
                ScenarioStep(
                    action="trigger_event",
                    params={"ceid": 100, "dvs": {"var1": 42}},
                ),
            ],
        )

        result = await engine.run(scenario)
        assert result.success is True


class TestScenarioEngineConditions:
    """Tests for conditional step execution."""

    @pytest.mark.asyncio
    async def test_conditional_step_true(self):
        """Engine executes step when condition is true."""
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer
        from scavenger.simulator.equipment.state import VariableType

        equipment = EquipmentServer(equipment_id=1, port=15107)
        equipment.get_state().set_variable(VariableType.SV, 1, 100)

        engine = ScenarioEngine(equipment_server=equipment)

        scenario = Scenario(
            name="condition_true_test",
            description="Test condition evaluation",
            equipment_id=1,
            steps=[
                ScenarioStep(
                    action="set_sv",
                    params={"svid": 2, "value": 200},
                    condition="sv[1] == 100",
                ),
            ],
        )

        result = await engine.run(scenario)

        assert result.success is True
        assert equipment.get_state().get_variable(VariableType.SV, 2) == 200

    @pytest.mark.asyncio
    async def test_conditional_step_false(self):
        """Engine skips step when condition is false."""
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer
        from scavenger.simulator.equipment.state import VariableType

        equipment = EquipmentServer(equipment_id=1, port=15108)
        equipment.get_state().set_variable(VariableType.SV, 1, 50)

        engine = ScenarioEngine(equipment_server=equipment)

        scenario = Scenario(
            name="condition_false_test",
            description="Test condition skip",
            equipment_id=1,
            steps=[
                ScenarioStep(
                    action="set_sv",
                    params={"svid": 2, "value": 200},
                    condition="sv[1] == 100",  # Will be false
                ),
            ],
        )

        result = await engine.run(scenario)

        assert result.success is True
        assert result.steps_skipped == 1
        assert equipment.get_state().get_variable(VariableType.SV, 2) is None


class TestScenarioEngineErrors:
    """Tests for error handling."""

    @pytest.mark.asyncio
    async def test_unknown_action_fails(self):
        """Engine fails on unknown action."""
        from scavenger.simulator.scenario.engine import ScenarioEngine, ActionNotFoundError

        scenario = Scenario(
            name="unknown_action_test",
            description="Test unknown action",
            equipment_id=1,
            steps=[
                ScenarioStep(action="nonexistent_action", params={}),
            ],
        )

        engine = ScenarioEngine()

        with pytest.raises(ActionNotFoundError):
            await engine.run(scenario)

    @pytest.mark.asyncio
    async def test_missing_params_fails(self):
        """Engine reports failure when required params are missing."""
        from scavenger.simulator.scenario.engine import ScenarioEngine

        scenario = Scenario(
            name="missing_params_test",
            description="Test missing params",
            equipment_id=1,
            steps=[
                ScenarioStep(action="set_sv", params={}),  # Missing svid and value
            ],
        )

        engine = ScenarioEngine()
        result = await engine.run(scenario)

        # Engine captures error in result, doesn't raise
        assert result.success is False
        assert result.error is not None
        assert "svid" in result.error or "value" in result.error

    @pytest.mark.asyncio
    async def test_requires_equipment_for_equipment_actions(self):
        """Engine reports error when equipment action without equipment server."""
        from scavenger.simulator.scenario.engine import ScenarioEngine

        scenario = Scenario(
            name="no_equipment_test",
            description="Test no equipment",
            equipment_id=1,
            steps=[
                ScenarioStep(action="set_sv", params={"svid": 1, "value": 100}),
            ],
        )

        engine = ScenarioEngine()  # No equipment server
        result = await engine.run(scenario)

        # Engine captures error in result, doesn't raise
        assert result.success is False
        assert result.error is not None
        assert "equipment_server" in result.error
