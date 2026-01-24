"""CLI commands for SECS/GEM simulator.

Commands:
    scavenger simulator start      - Start equipment simulator
    scavenger simulator status     - Show simulator status
    scavenger simulator scenario   - Manage scenarios
    scavenger simulator replay     - Control replay sessions
"""
import asyncio
import os
import sys

import click


@click.group()
def simulator() -> None:
    """SECS/GEM equipment simulator commands."""
    pass


# =============================================================================
# Simulator Lifecycle Commands
# =============================================================================


@simulator.command()
@click.option(
    "--port",
    "-p",
    default=5000,
    envvar="HSMS_PASSIVE_PORT",
    help="HSMS passive port (default: 5000)",
)
@click.option(
    "--device-id",
    "-d",
    default=1,
    envvar="HSMS_DEVICE_ID",
    help="SECS device ID (default: 1)",
)
@click.option(
    "--equipment-id",
    "-e",
    default="SIM001",
    envvar="EQUIPMENT_ID",
    help="Equipment identifier (default: SIM001)",
)
@click.option(
    "--scenario",
    "-s",
    default=None,
    help="Scenario to run on startup (YAML file or DSL class)",
)
@click.option(
    "--record/--no-record",
    default=True,
    help="Enable message recording (default: enabled)",
)
def start(
    port: int,
    device_id: int,
    equipment_id: str,
    scenario: str | None,
    record: bool,
) -> None:
    """Start the SECS/GEM equipment simulator.

    Starts an HSMS passive server that accepts connections from host
    applications. The simulator responds to SECS-II messages according
    to GEM specifications.

    Examples:
        scavenger simulator start
        scavenger simulator start --port 5001 --device-id 2
        scavenger simulator start --scenario scenarios/demo.yaml
    """
    click.echo("Starting SECS/GEM simulator...")
    click.echo(f"  Equipment ID: {equipment_id}")
    click.echo(f"  HSMS Port: {port}")
    click.echo(f"  Device ID: {device_id}")
    click.echo(f"  Recording: {'enabled' if record else 'disabled'}")

    if scenario:
        click.echo(f"  Scenario: {scenario}")

    # Set environment for the main module
    os.environ["HSMS_PASSIVE_PORT"] = str(port)
    os.environ["HSMS_DEVICE_ID"] = str(device_id)
    os.environ["EQUIPMENT_ID"] = equipment_id

    try:
        from scavenger.simulator.main import run

        run()
    except KeyboardInterrupt:
        click.echo("\nSimulator stopped.")
    except Exception as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@simulator.command()
def status() -> None:
    """Show simulator status.

    Displays information about running simulator instances,
    active connections, and current scenario.
    """
    # TODO: Query running simulator via API or shared state
    click.echo("Simulator Status")
    click.echo("-" * 40)
    click.echo("Status: Not implemented")
    click.echo()
    click.echo("To check if simulator is running:")
    click.echo("  netstat -tlnp | grep 5000")


# =============================================================================
# Scenario Commands
# =============================================================================


@simulator.group()
def scenario() -> None:
    """Manage test scenarios."""
    pass


@scenario.command("list")
@click.option(
    "--path",
    "-p",
    default="scenarios",
    help="Path to scenarios directory",
)
def scenario_list(path: str) -> None:
    """List available scenarios.

    Scans the scenarios directory for YAML files and Python DSL classes.
    """
    from pathlib import Path

    scenarios_path = Path(path)

    if not scenarios_path.exists():
        click.echo(f"Scenarios directory not found: {path}")
        click.echo("Create it with: mkdir -p scenarios")
        return

    click.echo(f"Scenarios in {path}/")
    click.echo("-" * 40)

    # Find YAML files
    yaml_files = list(scenarios_path.glob("*.yaml")) + list(scenarios_path.glob("*.yml"))
    if yaml_files:
        click.echo("\nYAML Scenarios:")
        for f in sorted(yaml_files):
            click.echo(f"  {f.name}")

    # Find Python DSL files
    py_files = list(scenarios_path.glob("*.py"))
    py_files = [f for f in py_files if not f.name.startswith("_")]
    if py_files:
        click.echo("\nPython DSL Scenarios:")
        for f in sorted(py_files):
            click.echo(f"  {f.name}")

    if not yaml_files and not py_files:
        click.echo("No scenarios found.")
        click.echo("\nCreate a scenario with:")
        click.echo("  scavenger simulator scenario create my_scenario")


@scenario.command("run")
@click.argument("name")
@click.option(
    "--path",
    "-p",
    default="scenarios",
    help="Path to scenarios directory",
)
@click.option(
    "--equipment-id",
    "-e",
    default=None,
    help="Target equipment ID (uses running simulator if not specified)",
)
def scenario_run(name: str, path: str, equipment_id: str | None) -> None:
    """Run a scenario.

    NAME can be a YAML filename (e.g., demo.yaml) or a Python DSL
    class (e.g., demo.py:MyScenario).

    Examples:
        scavenger simulator scenario run demo.yaml
        scavenger simulator scenario run wafer_flow.py:WaferFlowScenario
    """
    from pathlib import Path

    click.echo(f"Running scenario: {name}")

    # Determine scenario type
    if name.endswith((".yaml", ".yml")):
        scenario_file = Path(path) / name
        if not scenario_file.exists():
            click.echo(f"Scenario file not found: {scenario_file}", err=True)
            sys.exit(1)

        click.echo(f"Loading YAML scenario from {scenario_file}")
        # TODO: Load and run scenario via ScenarioEngine
    elif ":" in name or name.endswith(".py"):
        click.echo(f"Loading Python DSL scenario: {name}")
        # TODO: Load and run DSL scenario
    else:
        click.echo(f"Unknown scenario format: {name}", err=True)
        click.echo("Use .yaml/.yml for YAML or .py:ClassName for Python DSL")
        sys.exit(1)

    click.echo("Scenario execution not yet implemented.")


@scenario.command("validate")
@click.argument("name")
@click.option(
    "--path",
    "-p",
    default="scenarios",
    help="Path to scenarios directory",
)
def scenario_validate(name: str, path: str) -> None:
    """Validate a scenario file.

    Checks syntax and structure without executing the scenario.
    """
    from pathlib import Path

    scenario_file = Path(path) / name
    if not scenario_file.exists():
        click.echo(f"Scenario file not found: {scenario_file}", err=True)
        sys.exit(1)

    click.echo(f"Validating: {scenario_file}")

    try:
        if name.endswith((".yaml", ".yml")):
            from scavenger.simulator.scenario.loader import ScenarioLoader

            loader = ScenarioLoader()
            scenario_obj = asyncio.run(loader.load_from_yaml(str(scenario_file)))
            click.echo(f"✓ Valid YAML scenario: {scenario_obj.name}")
            click.echo(f"  Steps: {len(scenario_obj.steps)}")
        else:
            click.echo("Only YAML validation is currently supported.")
    except Exception as e:
        click.echo(f"✗ Validation failed: {e}", err=True)
        sys.exit(1)


# =============================================================================
# Replay Commands
# =============================================================================


@simulator.group()
def replay() -> None:
    """Control replay sessions."""
    pass


@replay.command("list")
def replay_list() -> None:
    """List active replay sessions."""
    click.echo("Active Replay Sessions")
    click.echo("-" * 40)
    click.echo("No active sessions.")
    click.echo()
    click.echo("Start a replay with:")
    click.echo("  scavenger simulator replay start <session_id>")


@replay.command("start")
@click.argument("session_id")
@click.option(
    "--speed",
    "-s",
    default=1.0,
    help="Playback speed multiplier (default: 1.0)",
)
@click.option(
    "--loop/--no-loop",
    default=False,
    help="Loop playback (default: no loop)",
)
def replay_start(session_id: str, speed: float, loop: bool) -> None:
    """Start replaying a recorded session.

    SESSION_ID is the UUID of a recorded HSMS session from the database.

    Examples:
        scavenger simulator replay start abc12345-...
        scavenger simulator replay start abc12345-... --speed 2.0
        scavenger simulator replay start abc12345-... --loop
    """
    import uuid

    try:
        session_uuid = uuid.UUID(session_id)
    except ValueError:
        click.echo(f"Invalid session ID: {session_id}", err=True)
        sys.exit(1)

    click.echo(f"Starting replay: {session_uuid}")
    click.echo(f"  Speed: {speed}x")
    click.echo(f"  Loop: {'enabled' if loop else 'disabled'}")
    click.echo()
    click.echo("Replay functionality not yet implemented.")
    click.echo("Use the API endpoint: POST /api/simulator/replay/start")


@replay.command("pause")
@click.argument("replay_id", required=False)
def replay_pause(replay_id: str | None) -> None:
    """Pause a replay session.

    If REPLAY_ID is not specified, pauses the most recent session.
    """
    if replay_id:
        click.echo(f"Pausing replay: {replay_id}")
    else:
        click.echo("Pausing most recent replay session...")

    click.echo("Not yet implemented.")


@replay.command("resume")
@click.argument("replay_id", required=False)
def replay_resume(replay_id: str | None) -> None:
    """Resume a paused replay session."""
    if replay_id:
        click.echo(f"Resuming replay: {replay_id}")
    else:
        click.echo("Resuming most recent replay session...")

    click.echo("Not yet implemented.")


@replay.command("stop")
@click.argument("replay_id", required=False)
def replay_stop(replay_id: str | None) -> None:
    """Stop a replay session."""
    if replay_id:
        click.echo(f"Stopping replay: {replay_id}")
    else:
        click.echo("Stopping most recent replay session...")

    click.echo("Not yet implemented.")


@replay.command("status")
@click.argument("replay_id", required=False)
def replay_status(replay_id: str | None) -> None:
    """Show replay session status."""
    if replay_id:
        click.echo(f"Replay Status: {replay_id}")
    else:
        click.echo("All Replay Sessions")

    click.echo("-" * 40)
    click.echo("No active sessions.")


# =============================================================================
# Recording Commands
# =============================================================================


@simulator.group()
def record() -> None:
    """Message recording commands."""
    pass


@record.command("sessions")
@click.option(
    "--limit",
    "-n",
    default=10,
    help="Number of sessions to show (default: 10)",
)
def record_sessions(limit: int) -> None:
    """List recorded sessions."""
    click.echo(f"Recent Recording Sessions (limit: {limit})")
    click.echo("-" * 60)
    click.echo("No sessions found.")
    click.echo()
    click.echo("Sessions are recorded automatically when the simulator runs.")
    click.echo("Query the database directly:")
    click.echo("  SELECT * FROM hsms_sessions ORDER BY created_at DESC LIMIT 10;")


@record.command("export")
@click.argument("session_id")
@click.option(
    "--format",
    "-f",
    type=click.Choice(["json", "csv", "sml"]),
    default="json",
    help="Export format (default: json)",
)
@click.option(
    "--output",
    "-o",
    default=None,
    help="Output file (default: stdout)",
)
def record_export(session_id: str, format: str, output: str | None) -> None:
    """Export a recorded session.

    Exports messages from a session in the specified format.
    SML format uses SECS-II Message Language notation.

    Examples:
        scavenger simulator record export abc123... --format json
        scavenger simulator record export abc123... --format sml -o session.sml
    """
    click.echo(f"Exporting session: {session_id}")
    click.echo(f"  Format: {format}")
    click.echo(f"  Output: {output or 'stdout'}")
    click.echo()
    click.echo("Export functionality not yet implemented.")
