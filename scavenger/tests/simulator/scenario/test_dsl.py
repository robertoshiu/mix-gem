"""Tests for Python DSL for scenario definitions."""
import pytest

from scavenger.simulator.scenario.models import Scenario, ScenarioStep


class TestDSLScenario:
    """Tests for DSL scenario class."""

    def test_dsl_scenario_basic(self):
        """DSL scenario class creates valid Scenario."""
        from scavenger.simulator.scenario.dsl import DSLScenario

        class MyScenario(DSLScenario):
            name = "test_scenario"
            description = "A test scenario"
            equipment_id = 1
            steps = [
                {"action": "wait", "params": {"duration_ms": 100}},
            ]

        scenario = MyScenario.to_scenario()

        assert isinstance(scenario, Scenario)
        assert scenario.name == "test_scenario"
        assert scenario.description == "A test scenario"
        assert scenario.equipment_id == 1
        assert len(scenario.steps) == 1

    def test_dsl_scenario_with_initial_state(self):
        """DSL scenario with initial state."""
        from scavenger.simulator.scenario.dsl import DSLScenario

        class MyScenario(DSLScenario):
            name = "stateful_scenario"
            description = "Scenario with initial state"
            equipment_id = 1
            initial_state = {"svs": {1: 100, 2: 200}}
            steps = [
                {"action": "wait", "params": {"duration_ms": 10}},
            ]

        scenario = MyScenario.to_scenario()

        assert scenario.initial_state is not None
        assert scenario.initial_state["svs"][1] == 100

    def test_dsl_scenario_with_metadata(self):
        """DSL scenario with metadata."""
        from scavenger.simulator.scenario.dsl import DSLScenario

        class MyScenario(DSLScenario):
            name = "tagged_scenario"
            description = "Scenario with tags"
            equipment_id = 1
            metadata = {"author": "test", "tags": ["smoke", "regression"]}
            steps = [
                {"action": "wait", "params": {"duration_ms": 10}},
            ]

        scenario = MyScenario.to_scenario()

        assert scenario.metadata["author"] == "test"
        assert "smoke" in scenario.metadata["tags"]


class TestDSLStepBuilders:
    """Tests for DSL step builder functions."""

    def test_wait_step(self):
        """wait() creates a wait step dict."""
        from scavenger.simulator.scenario.dsl import wait

        step = wait(100)

        assert step["action"] == "wait"
        assert step["params"]["duration_ms"] == 100

    def test_set_sv_step(self):
        """set_sv() creates a set_sv step dict."""
        from scavenger.simulator.scenario.dsl import set_sv

        step = set_sv(1, 42)

        assert step["action"] == "set_sv"
        assert step["params"]["svid"] == 1
        assert step["params"]["value"] == 42

    def test_set_alarm_step(self):
        """set_alarm() creates a set_alarm step dict."""
        from scavenger.simulator.scenario.dsl import set_alarm

        step = set_alarm(1001, 2, "Vacuum low")

        assert step["action"] == "set_alarm"
        assert step["params"]["alid"] == 1001
        assert step["params"]["alcd"] == 2
        assert step["params"]["altx"] == "Vacuum low"

    def test_clear_alarm_step(self):
        """clear_alarm() creates a clear_alarm step dict."""
        from scavenger.simulator.scenario.dsl import clear_alarm

        step = clear_alarm(1001)

        assert step["action"] == "clear_alarm"
        assert step["params"]["alid"] == 1001

    def test_send_message_step(self):
        """send_message() creates a send_message step dict."""
        from scavenger.simulator.scenario.dsl import send_message

        step = send_message(1, 13, body={"MDLN": "Test"})

        assert step["action"] == "send_message"
        assert step["params"]["stream"] == 1
        assert step["params"]["function"] == 13
        assert step["params"]["body"]["MDLN"] == "Test"

    def test_trigger_event_step(self):
        """trigger_event() creates a trigger_event step dict."""
        from scavenger.simulator.scenario.dsl import trigger_event

        step = trigger_event(100, dvs={"var1": 42})

        assert step["action"] == "trigger_event"
        assert step["params"]["ceid"] == 100
        assert step["params"]["dvs"]["var1"] == 42

    def test_conditional_step(self):
        """when() adds condition to step."""
        from scavenger.simulator.scenario.dsl import wait, when

        step = when("sv[1] == 100", wait(50))

        assert step["action"] == "wait"
        assert step["condition"] == "sv[1] == 100"


class TestDSLScenarioExecution:
    """Tests for executing DSL-defined scenarios."""

    @pytest.mark.asyncio
    async def test_execute_dsl_scenario(self):
        """Can execute a DSL-defined scenario."""
        from scavenger.simulator.scenario.dsl import DSLScenario, wait, set_sv
        from scavenger.simulator.scenario.engine import ScenarioEngine
        from scavenger.simulator.equipment.server import EquipmentServer
        from scavenger.simulator.equipment.state import VariableType

        class TestScenario(DSLScenario):
            name = "execution_test"
            description = "Test DSL execution"
            equipment_id = 1
            steps = [
                wait(10),
                set_sv(1, 42),
                wait(10),
            ]

        equipment = EquipmentServer(equipment_id=1, port=15200)
        engine = ScenarioEngine(equipment_server=equipment)

        scenario = TestScenario.to_scenario()
        result = await engine.run(scenario)

        assert result.success is True
        assert result.steps_executed == 3
        assert equipment.get_state().get_variable(VariableType.SV, 1) == 42


class TestDSLValidation:
    """Tests for DSL validation."""

    def test_missing_name_raises(self):
        """DSL scenario without name raises error."""
        from scavenger.simulator.scenario.dsl import DSLScenario, DSLValidationError

        class InvalidScenario(DSLScenario):
            description = "Missing name"
            equipment_id = 1
            steps = []

        with pytest.raises(DSLValidationError) as exc:
            InvalidScenario.to_scenario()

        assert "name" in str(exc.value)

    def test_missing_steps_raises(self):
        """DSL scenario without steps raises error."""
        from scavenger.simulator.scenario.dsl import DSLScenario, DSLValidationError

        class InvalidScenario(DSLScenario):
            name = "no_steps"
            description = "Missing steps"
            equipment_id = 1

        with pytest.raises(DSLValidationError) as exc:
            InvalidScenario.to_scenario()

        assert "steps" in str(exc.value)

    def test_invalid_step_format_raises(self):
        """DSL scenario with invalid step raises error."""
        from scavenger.simulator.scenario.dsl import DSLScenario, DSLValidationError

        class InvalidScenario(DSLScenario):
            name = "bad_step"
            description = "Invalid step format"
            equipment_id = 1
            steps = [
                "not_a_dict",  # Invalid
            ]

        with pytest.raises(DSLValidationError) as exc:
            InvalidScenario.to_scenario()

        assert "step" in str(exc.value).lower()
