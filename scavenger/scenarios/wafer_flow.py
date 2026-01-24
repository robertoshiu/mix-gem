"""Example Python DSL scenario: Wafer Processing Flow.

This scenario demonstrates a complete wafer processing cycle
using the Python DSL for scenario definition.

Usage:
    scavenger simulator scenario run wafer_flow.py:WaferFlowScenario
"""
from scavenger.simulator.scenario.dsl import (
    DSLScenario,
    clear_alarm,
    log,
    repeat,
    send_message,
    set_alarm,
    set_sv,
    trigger_event,
    wait,
    when,
)


class WaferFlowScenario(DSLScenario):
    """Simulates a complete wafer processing cycle."""

    name = "wafer_processing_flow"
    description = "Complete wafer load, process, and unload cycle"

    # Initial equipment state
    initial_state = {
        "sv": {
            1: "IDLE",          # ControlState
            2: 0,               # ProcessState
            100: "",            # CurrentLotID
            101: "",            # CurrentWaferID
            102: 0,             # WaferCount
        },
        "ecv": {
            1: 300.0,           # ProcessTemp
            2: 60.0,            # ProcessTime
            3: 1.5,             # ProcessPressure
        },
    }

    # Scenario steps
    steps = [
        log(message="Starting wafer processing scenario"),

        # Wait for lot to be loaded
        set_sv(sv_id=100, value="LOT001"),
        set_sv(sv_id=1, value="SETUP"),
        trigger_event(ceid=1, report_ids=[1, 2]),  # LotStart event

        wait(seconds=1.0),

        # Process 3 wafers
        *repeat(
            count=3,
            steps=[
                # Load wafer
                set_sv(sv_id=101, value="WAFER_${iteration}"),
                set_sv(sv_id=1, value="EXECUTING"),
                trigger_event(ceid=10),  # WaferStart

                wait(seconds=2.0),

                # Processing complete
                set_sv(sv_id=102, value="${sv[102] + 1}"),
                trigger_event(ceid=11),  # WaferEnd

                wait(seconds=0.5),
            ],
        ),

        # Lot complete
        set_sv(sv_id=1, value="IDLE"),
        set_sv(sv_id=100, value=""),
        trigger_event(ceid=2),  # LotEnd

        log(message="Wafer processing scenario completed"),
    ]


class AlarmTestScenario(DSLScenario):
    """Tests alarm set/clear functionality."""

    name = "alarm_test"
    description = "Test alarm management"

    steps = [
        log(message="Starting alarm test"),

        # Set multiple alarms
        set_alarm(alarm_id=1001, text="Temperature high"),
        wait(seconds=0.5),
        set_alarm(alarm_id=1002, text="Pressure low"),
        wait(seconds=0.5),

        # Clear alarms
        clear_alarm(alarm_id=1001),
        wait(seconds=0.5),
        clear_alarm(alarm_id=1002),

        log(message="Alarm test completed"),
    ]


class ConditionalScenario(DSLScenario):
    """Demonstrates conditional step execution."""

    name = "conditional_test"
    description = "Test conditional logic"

    initial_state = {
        "sv": {
            1: "IDLE",
            10: True,   # EnableProcessing flag
        },
    }

    steps = [
        log(message="Starting conditional scenario"),

        # Only execute if EnableProcessing is True
        when(
            condition="sv[10] == True",
            then=[
                set_sv(sv_id=1, value="PROCESSING"),
                wait(seconds=1.0),
                set_sv(sv_id=1, value="IDLE"),
            ],
            else_steps=[
                log(message="Processing disabled, skipping"),
            ],
        ),

        log(message="Conditional scenario completed"),
    ]
