import pytest
from click.testing import CliRunner
from scavenger.cli.main import cli


def test_cli_version():
    """CLI shows version."""
    runner = CliRunner()
    result = runner.invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert "0.1.0" in result.output


def test_cli_help():
    """CLI shows help."""
    runner = CliRunner()
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0
    assert "Scavenger" in result.output


def test_cli_version_shows_program_name():
    """CLI version shows program name."""
    runner = CliRunner()
    result = runner.invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert "scavenger" in result.output.lower()


def test_cli_help_shows_subcommands():
    """CLI help shows available subcommands."""
    runner = CliRunner()
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0
    assert "db" in result.output
    assert "generate" in result.output or "Commands" in result.output


def test_info_command():
    """Info command displays configuration."""
    runner = CliRunner()
    result = runner.invoke(cli, ["info"])
    assert result.exit_code == 0
    assert "Database" in result.output or "database" in result.output.lower()


def test_info_command_shows_hsms_port():
    """Info command shows HSMS port configuration."""
    runner = CliRunner()
    result = runner.invoke(cli, ["info"])
    assert result.exit_code == 0
    assert "HSMS" in result.output or "hsms" in result.output.lower()


def test_info_command_shows_api_port():
    """Info command shows API port configuration."""
    runner = CliRunner()
    result = runner.invoke(cli, ["info"])
    assert result.exit_code == 0
    assert "API" in result.output or "api" in result.output.lower()
