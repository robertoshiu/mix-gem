"""Scenario loaders for YAML, Database, and Python DSL sources.

This module provides unified loading of test scenarios from multiple sources:
- YAML files: Declarative scenario definitions
- Database: Scenarios stored in PostgreSQL via SQLAlchemy
- Python DSL: Programmatic scenario definitions
"""
import importlib.util
import logging
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from scavenger.db.models.scenario import Scenario as ScenarioModel
from scavenger.simulator.scenario.models import (
    Scenario,
    ScenarioDSLError,
    ScenarioNotFoundError,
    ScenarioStep,
    ScenarioValidationError,
)

logger = logging.getLogger(__name__)


class ScenarioLoader:
    """Unified loader for test scenarios from multiple sources."""

    async def load_from_yaml(self, path: Path) -> Scenario:
        """Load scenario from YAML file.

        Args:
            path: Path to YAML file

        Returns:
            Parsed and validated Scenario

        Raises:
            ScenarioNotFoundError: If file doesn't exist
            ScenarioValidationError: If YAML is invalid or missing required fields
        """
        if not path.exists():
            raise ScenarioNotFoundError(f"YAML file {path} not found")

        try:
            with open(path) as f:
                data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise ScenarioValidationError(f"Invalid YAML syntax: {e}") from e
        except Exception as e:
            raise ScenarioValidationError(f"Failed to read YAML file: {e}") from e

        return self._validate_and_convert(data, source=f"YAML file {path}")

    async def load_from_db(
        self,
        session: AsyncSession,
        scenario_id: int | None = None,
        name: str | None = None,
    ) -> Scenario:
        """Load scenario from database.

        Args:
            session: SQLAlchemy async session
            scenario_id: Optional scenario ID to load
            name: Optional scenario name to load

        Returns:
            Parsed and validated Scenario

        Raises:
            ValueError: If neither scenario_id nor name is provided
            ScenarioNotFoundError: If scenario doesn't exist
            ScenarioValidationError: If database data is invalid
        """
        if scenario_id is None and name is None:
            raise ValueError("Either scenario_id or name must be provided")

        # Build query
        stmt = select(ScenarioModel)
        if scenario_id is not None:
            stmt = stmt.where(ScenarioModel.id == scenario_id)
            identifier = f"ID {scenario_id}"
        else:
            stmt = stmt.where(ScenarioModel.name == name)
            identifier = f"name '{name}'"

        result = await session.execute(stmt)
        db_scenario = result.scalar_one_or_none()

        if db_scenario is None:
            raise ScenarioNotFoundError(f"Scenario with {identifier} not found in database")

        # Convert database model to internal representation
        # Default equipment_id to 0 if not present or None
        equipment_id = 0
        if hasattr(db_scenario, 'equipment_id') and db_scenario.equipment_id is not None:
            equipment_id = db_scenario.equipment_id

        data = {
            "name": db_scenario.name,
            "description": db_scenario.description or "",
            "equipment_id": equipment_id,
            "steps": db_scenario.steps,
        }

        # Add optional fields if present
        if hasattr(db_scenario, 'initial_state') and db_scenario.initial_state:
            data["initial_state"] = db_scenario.initial_state

        if hasattr(db_scenario, 'metadata') and db_scenario.metadata:
            data["metadata"] = db_scenario.metadata

        return self._validate_and_convert(data, source=f"Database {identifier}")

    async def load_from_dsl(self, path: Path, class_name: str | None = None) -> Scenario:
        """Load scenario from Python DSL module.

        Args:
            path: Path to Python module file
            class_name: Optional class name to load. If None, auto-discovers first scenario class

        Returns:
            Parsed and validated Scenario

        Raises:
            ScenarioNotFoundError: If file or class doesn't exist
            ScenarioDSLError: If module cannot be imported
            ScenarioValidationError: If class attributes are invalid
        """
        if not path.exists():
            raise ScenarioNotFoundError(f"Python DSL file {path} not found")

        # Dynamically import the module
        try:
            spec = importlib.util.spec_from_file_location("scenario_module", path)
            if spec is None or spec.loader is None:
                raise ScenarioDSLError(f"Failed to load module spec from {path}")

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
        except Exception as e:
            raise ScenarioDSLError(f"Failed to import DSL module {path}: {e}") from e

        # Find the scenario class
        if class_name is None:
            # Auto-discover first class with scenario attributes
            scenario_class = self._find_scenario_class(module)
            if scenario_class is None:
                raise ScenarioNotFoundError(
                    f"No scenario class found in {path}. "
                    "Classes must have 'name', 'description', 'equipment_id', "
                    "and 'steps' attributes."
                )
        else:
            # Look for specific class
            if not hasattr(module, class_name):
                raise ScenarioNotFoundError(f"Class '{class_name}' not found in {path}")
            scenario_class = getattr(module, class_name)

        # Extract scenario data from class attributes
        data = self._extract_dsl_data(scenario_class, path)

        source = f"Python DSL {path}::{scenario_class.__name__}"
        return self._validate_and_convert(data, source=source)

    def _find_scenario_class(self, module: Any) -> Any:
        """Find first class in module that looks like a scenario.

        Args:
            module: Imported Python module

        Returns:
            First class with scenario attributes, or None
        """
        for name in dir(module):
            obj = getattr(module, name)
            if isinstance(obj, type) and hasattr(obj, 'name') and hasattr(obj, 'steps'):
                return obj
        return None

    def _extract_dsl_data(self, scenario_class: type, source_path: Path) -> dict[str, Any]:
        """Extract scenario data from DSL class attributes.

        Args:
            scenario_class: Python class with scenario attributes
            source_path: Path to source file (for error messages)

        Returns:
            Dictionary of scenario data

        Raises:
            ScenarioValidationError: If required attributes are missing
        """
        data: dict[str, Any] = {}

        # Required attributes
        required = ["name", "description", "equipment_id", "steps"]
        for attr in required:
            if not hasattr(scenario_class, attr):
                raise ScenarioValidationError(
                    f"DSL class {scenario_class.__name__} in {source_path} "
                    f"missing required attribute '{attr}'"
                )
            data[attr] = getattr(scenario_class, attr)

        # Optional attributes
        if hasattr(scenario_class, "initial_state"):
            data["initial_state"] = scenario_class.initial_state

        if hasattr(scenario_class, "metadata"):
            data["metadata"] = scenario_class.metadata

        return data

    def _validate_and_convert(self, data: dict[str, Any], source: str) -> Scenario:
        """Validate scenario data and convert to Scenario dataclass.

        Args:
            data: Raw scenario data dictionary
            source: Description of data source (for error messages)

        Returns:
            Validated Scenario instance

        Raises:
            ScenarioValidationError: If data is invalid
        """
        # Validate required fields
        required_fields = ["name", "description", "equipment_id", "steps"]
        for field in required_fields:
            if field not in data:
                raise ScenarioValidationError(
                    f"Missing required field '{field}' in scenario from {source}"
                )

        # Validate steps
        if not isinstance(data["steps"], list):
            raise ScenarioValidationError(
                f"Field 'steps' must be a list in scenario from {source}"
            )

        if len(data["steps"]) == 0:
            logger.warning(f"Scenario from {source} has zero steps")

        # Convert and validate steps
        steps: list[ScenarioStep] = []
        for i, step_data in enumerate(data["steps"]):
            if not isinstance(step_data, dict):
                raise ScenarioValidationError(
                    f"Step {i} must be a dictionary in scenario from {source}"
                )

            if "action" not in step_data:
                raise ScenarioValidationError(
                    f"Step {i} missing required field 'action' in scenario from {source}"
                )

            if "params" not in step_data:
                raise ScenarioValidationError(
                    f"Step {i} missing required field 'params' in scenario from {source}"
                )

            steps.append(
                ScenarioStep(
                    action=step_data["action"],
                    params=step_data["params"],
                    condition=step_data.get("condition"),
                )
            )

        # Build Scenario instance
        return Scenario(
            name=data["name"],
            description=data["description"],
            equipment_id=data["equipment_id"],
            steps=steps,
            initial_state=data.get("initial_state"),
            metadata=data.get("metadata", {}),
        )
