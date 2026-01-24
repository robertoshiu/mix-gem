"""Tests for scenario loaders (YAML, Database, Python DSL)."""
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

from scavenger.simulator.scenario.loader import ScenarioLoader
from scavenger.simulator.scenario.models import (
    ScenarioNotFoundError,
    ScenarioValidationError,
)


class TestYAMLLoader:
    """Tests for YAML scenario loading."""

    @pytest.fixture
    def valid_yaml_content(self) -> str:
        """Valid YAML scenario content."""
        return """
name: "S1F13 Establish Communications"
description: "Test establish communications handshake"
equipment_id: 1
steps:
  - action: send_message
    params:
      stream: 1
      function: 13
      wbit: true
      body:
        MDLN: "TestHost"
        SOFTREV: "1.0"
  - action: wait
    params:
      seconds: 0.5
  - action: expect_message
    params:
      stream: 1
      function: 14
"""

    @pytest.fixture
    def yaml_with_initial_state(self) -> str:
        """YAML scenario with initial state."""
        return """
name: "Test with State"
description: "Scenario with initial state"
equipment_id: 2
initial_state:
  control_state: "REMOTE"
  processing_state: "IDLE"
steps:
  - action: send_message
    params:
      stream: 1
      function: 1
metadata:
  author: "test_user"
  version: "1.0"
  tags: ["smoke", "basic"]
"""

    @pytest.fixture
    def yaml_with_condition(self) -> str:
        """YAML scenario with conditional steps."""
        return """
name: "Conditional Test"
description: "Test with conditional execution"
equipment_id: 1
steps:
  - action: send_message
    params:
      stream: 1
      function: 1
  - action: check_alarm
    params:
      alarm_id: 100
    condition: "alarm_enabled == true"
"""

    @pytest.fixture
    def invalid_yaml_missing_name(self) -> str:
        """Invalid YAML - missing required 'name' field."""
        return """
description: "Missing name"
equipment_id: 1
steps:
  - action: test
    params: {}
"""

    @pytest.fixture
    def invalid_yaml_missing_steps(self) -> str:
        """Invalid YAML - missing required 'steps' field."""
        return """
name: "No steps"
description: "Missing steps"
equipment_id: 1
"""

    @pytest.fixture
    def invalid_yaml_bad_step(self) -> str:
        """Invalid YAML - step missing 'action' field."""
        return """
name: "Bad step"
description: "Step missing action"
equipment_id: 1
steps:
  - params:
      test: 1
"""

    async def test_load_from_yaml_file_valid(self, valid_yaml_content: str):
        """Test loading a valid YAML scenario from file."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write(valid_yaml_content)
            yaml_path = Path(f.name)

        try:
            loader = ScenarioLoader()
            scenario = await loader.load_from_yaml(yaml_path)

            assert scenario.name == "S1F13 Establish Communications"
            assert scenario.description == "Test establish communications handshake"
            assert scenario.equipment_id == 1
            assert len(scenario.steps) == 3

            # Check first step
            step1 = scenario.steps[0]
            assert step1.action == "send_message"
            assert step1.params["stream"] == 1
            assert step1.params["function"] == 13
            assert step1.params["wbit"] is True
            assert step1.params["body"]["MDLN"] == "TestHost"
            assert step1.condition is None

            # Check second step
            step2 = scenario.steps[1]
            assert step2.action == "wait"
            assert step2.params["seconds"] == 0.5

            # Check third step
            step3 = scenario.steps[2]
            assert step3.action == "expect_message"
            assert step3.params["stream"] == 1
            assert step3.params["function"] == 14
        finally:
            yaml_path.unlink()

    async def test_load_from_yaml_with_initial_state(self, yaml_with_initial_state: str):
        """Test loading YAML scenario with initial state and metadata."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write(yaml_with_initial_state)
            yaml_path = Path(f.name)

        try:
            loader = ScenarioLoader()
            scenario = await loader.load_from_yaml(yaml_path)

            assert scenario.name == "Test with State"
            assert scenario.initial_state is not None
            assert scenario.initial_state["control_state"] == "REMOTE"
            assert scenario.initial_state["processing_state"] == "IDLE"

            assert scenario.metadata is not None
            assert scenario.metadata["author"] == "test_user"
            assert scenario.metadata["version"] == "1.0"
            assert scenario.metadata["tags"] == ["smoke", "basic"]
        finally:
            yaml_path.unlink()

    async def test_load_from_yaml_with_condition(self, yaml_with_condition: str):
        """Test loading YAML scenario with conditional steps."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write(yaml_with_condition)
            yaml_path = Path(f.name)

        try:
            loader = ScenarioLoader()
            scenario = await loader.load_from_yaml(yaml_path)

            assert len(scenario.steps) == 2
            assert scenario.steps[0].condition is None
            assert scenario.steps[1].condition == "alarm_enabled == true"
        finally:
            yaml_path.unlink()

    async def test_load_from_yaml_file_not_found(self):
        """Test loading from non-existent YAML file."""
        loader = ScenarioLoader()

        with pytest.raises(ScenarioNotFoundError, match="not found"):
            await loader.load_from_yaml(Path("/nonexistent/scenario.yaml"))

    async def test_load_from_yaml_invalid_missing_name(self, invalid_yaml_missing_name: str):
        """Test validation error for missing 'name' field."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write(invalid_yaml_missing_name)
            yaml_path = Path(f.name)

        try:
            loader = ScenarioLoader()

            with pytest.raises(ScenarioValidationError, match="name"):
                await loader.load_from_yaml(yaml_path)
        finally:
            yaml_path.unlink()

    async def test_load_from_yaml_invalid_missing_steps(self, invalid_yaml_missing_steps: str):
        """Test validation error for missing 'steps' field."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write(invalid_yaml_missing_steps)
            yaml_path = Path(f.name)

        try:
            loader = ScenarioLoader()

            with pytest.raises(ScenarioValidationError, match="steps"):
                await loader.load_from_yaml(yaml_path)
        finally:
            yaml_path.unlink()

    async def test_load_from_yaml_invalid_bad_step(self, invalid_yaml_bad_step: str):
        """Test validation error for step missing 'action' field."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write(invalid_yaml_bad_step)
            yaml_path = Path(f.name)

        try:
            loader = ScenarioLoader()

            with pytest.raises(ScenarioValidationError, match="action"):
                await loader.load_from_yaml(yaml_path)
        finally:
            yaml_path.unlink()


class TestDatabaseLoader:
    """Tests for database scenario loading."""

    async def test_load_from_db_by_id(self):
        """Test loading scenario from database by ID."""
        # Mock database session and query
        mock_session = AsyncMock()
        mock_db_scenario = MagicMock()
        mock_db_scenario.id = 1
        mock_db_scenario.name = "DB Scenario"
        mock_db_scenario.description = "From database"
        mock_db_scenario.steps = [
            {"action": "send_message", "params": {"stream": 1, "function": 1}},
            {"action": "wait", "params": {"seconds": 1.0}},
        ]
        mock_db_scenario.equipment_id = None  # Test optional equipment_id

        # Mock the query execution
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=mock_db_scenario)
        mock_session.execute = AsyncMock(return_value=mock_result)

        loader = ScenarioLoader()
        scenario = await loader.load_from_db(mock_session, scenario_id=1)

        assert scenario.name == "DB Scenario"
        assert scenario.description == "From database"
        assert scenario.equipment_id == 0  # Default when None
        assert len(scenario.steps) == 2
        assert scenario.steps[0].action == "send_message"
        assert scenario.steps[1].params["seconds"] == 1.0

    async def test_load_from_db_by_name(self):
        """Test loading scenario from database by name."""
        mock_session = AsyncMock()
        mock_db_scenario = MagicMock()
        mock_db_scenario.id = 2
        mock_db_scenario.name = "Named Scenario"
        mock_db_scenario.description = "Found by name"
        mock_db_scenario.steps = [
            {"action": "test", "params": {}},
        ]
        mock_db_scenario.equipment_id = 5

        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=mock_db_scenario)
        mock_session.execute = AsyncMock(return_value=mock_result)

        loader = ScenarioLoader()
        scenario = await loader.load_from_db(mock_session, name="Named Scenario")

        assert scenario.name == "Named Scenario"
        assert scenario.equipment_id == 5

    async def test_load_from_db_not_found(self):
        """Test loading non-existent scenario from database."""
        mock_session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=None)
        mock_session.execute = AsyncMock(return_value=mock_result)

        loader = ScenarioLoader()

        with pytest.raises(ScenarioNotFoundError, match="Scenario .* not found"):
            await loader.load_from_db(mock_session, scenario_id=999)

    async def test_load_from_db_invalid_params(self):
        """Test loading with invalid parameters (neither id nor name)."""
        mock_session = AsyncMock()
        loader = ScenarioLoader()

        with pytest.raises(ValueError, match="Either scenario_id or name must be provided"):
            await loader.load_from_db(mock_session)


class TestPythonDSLLoader:
    """Tests for Python DSL scenario loading."""

    @pytest.fixture
    def dsl_module_content(self) -> str:
        """Valid Python DSL module content."""
        return '''
"""Test scenario module."""

class TestScenario:
    """Test scenario using Python DSL."""
    name = "DSL Test Scenario"
    description = "Scenario loaded from Python module"
    equipment_id = 3
    steps = [
        {
            "action": "send_message",
            "params": {"stream": 1, "function": 13},
        },
        {
            "action": "wait",
            "params": {"seconds": 0.5},
        },
    ]
    initial_state = {"mode": "AUTO"}
    metadata = {"dsl_version": "1.0"}
'''

    @pytest.fixture
    def dsl_module_with_condition(self) -> str:
        """Python DSL module with conditional steps."""
        return '''
"""Test scenario with conditions."""

class ConditionalScenario:
    """Scenario with conditional execution."""
    name = "Conditional DSL"
    description = "Has conditional steps"
    equipment_id = 1
    steps = [
        {
            "action": "check_state",
            "params": {"state": "READY"},
            "condition": "is_online == true",
        },
    ]
'''

    @pytest.fixture
    def invalid_dsl_missing_name(self) -> str:
        """Invalid DSL - missing required 'name' attribute."""
        return '''
class BadScenario:
    description = "Missing name"
    equipment_id = 1
    steps = []
'''

    @pytest.fixture
    def invalid_dsl_missing_steps(self) -> str:
        """Invalid DSL - missing required 'steps' attribute."""
        return '''
class BadScenario:
    name = "No Steps"
    description = "Missing steps"
    equipment_id = 1
'''

    async def test_load_from_dsl_valid(self, dsl_module_content: str):
        """Test loading valid Python DSL scenario."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(dsl_module_content)
            dsl_path = Path(f.name)

        try:
            loader = ScenarioLoader()
            scenario = await loader.load_from_dsl(dsl_path, class_name="TestScenario")

            assert scenario.name == "DSL Test Scenario"
            assert scenario.description == "Scenario loaded from Python module"
            assert scenario.equipment_id == 3
            assert len(scenario.steps) == 2

            assert scenario.steps[0].action == "send_message"
            assert scenario.steps[0].params["stream"] == 1

            assert scenario.initial_state is not None
            assert scenario.initial_state["mode"] == "AUTO"

            assert scenario.metadata is not None
            assert scenario.metadata["dsl_version"] == "1.0"
        finally:
            dsl_path.unlink()

    async def test_load_from_dsl_with_condition(self, dsl_module_with_condition: str):
        """Test loading DSL scenario with conditional steps."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(dsl_module_with_condition)
            dsl_path = Path(f.name)

        try:
            loader = ScenarioLoader()
            scenario = await loader.load_from_dsl(dsl_path, class_name="ConditionalScenario")

            assert len(scenario.steps) == 1
            assert scenario.steps[0].condition == "is_online == true"
        finally:
            dsl_path.unlink()

    async def test_load_from_dsl_file_not_found(self):
        """Test loading from non-existent DSL file."""
        loader = ScenarioLoader()

        with pytest.raises(ScenarioNotFoundError, match="not found"):
            await loader.load_from_dsl(Path("/nonexistent/scenario.py"))

    async def test_load_from_dsl_class_not_found(self, dsl_module_content: str):
        """Test loading with non-existent class name."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(dsl_module_content)
            dsl_path = Path(f.name)

        try:
            loader = ScenarioLoader()

            with pytest.raises(ScenarioNotFoundError, match="Class .* not found"):
                await loader.load_from_dsl(dsl_path, class_name="NonExistentClass")
        finally:
            dsl_path.unlink()

    async def test_load_from_dsl_invalid_missing_name(self, invalid_dsl_missing_name: str):
        """Test validation error for DSL missing 'name' attribute."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(invalid_dsl_missing_name)
            dsl_path = Path(f.name)

        try:
            loader = ScenarioLoader()

            with pytest.raises(ScenarioValidationError, match="name"):
                await loader.load_from_dsl(dsl_path, class_name="BadScenario")
        finally:
            dsl_path.unlink()

    async def test_load_from_dsl_invalid_missing_steps(self, invalid_dsl_missing_steps: str):
        """Test validation error for DSL missing 'steps' attribute."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(invalid_dsl_missing_steps)
            dsl_path = Path(f.name)

        try:
            loader = ScenarioLoader()

            with pytest.raises(ScenarioValidationError, match="steps"):
                await loader.load_from_dsl(dsl_path, class_name="BadScenario")
        finally:
            dsl_path.unlink()
