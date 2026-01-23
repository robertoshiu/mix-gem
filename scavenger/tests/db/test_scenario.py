# tests/db/test_scenario.py
import pytest
from scavenger.db.models.execution import ExecutionEvent, ExecutionRun, RunStatus
from scavenger.db.models.scenario import Scenario


def test_scenario_model():
    """Scenario stores HSMS message sequences."""
    scenario = Scenario(
        name="S1F13 Communication Establish",
        description="Host establishes communication with equipment",
        steps=[
            {"sxfy": "S1F13", "direction": "H2E", "delay_ms": 0},
            {"sxfy": "S1F14", "direction": "E2H", "delay_ms": 100},
        ],
        expected_ceids=[1],
    )
    assert len(scenario.steps) == 2
    assert scenario.steps[0]["sxfy"] == "S1F13"


def test_execution_run_status():
    """ExecutionRun tracks scenario execution."""
    run = ExecutionRun(
        scenario_id=1,
        status=RunStatus.RUNNING,
    )
    assert run.status == RunStatus.RUNNING


def test_execution_event():
    """ExecutionEvent logs individual messages."""
    event = ExecutionEvent(
        run_id=1,
        event_type="sxfy",
        direction="H2E",
        raw_sml="'S1F13' W.",
        parsed_data={"stream": 1, "function": 13},
    )
    assert event.direction == "H2E"
