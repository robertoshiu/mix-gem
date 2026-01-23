import pytest
from click.testing import CliRunner
from scavenger.cli.main import cli


def test_generate_group_exists():
    """generate command group exists."""
    runner = CliRunner()
    result = runner.invoke(cli, ["generate", "--help"])
    assert result.exit_code == 0
    assert "alarms" in result.output


def test_generate_alarms_dry_run():
    """generate alarms --dry-run shows preview."""
    runner = CliRunner()
    result = runner.invoke(
        cli,
        [
            "generate",
            "alarms",
            "--count",
            "5",
            "--layer",
            "schema",
            "--dry-run",
        ],
    )
    assert result.exit_code == 0
    assert "ALID" in result.output or "alid" in result.output.lower()
