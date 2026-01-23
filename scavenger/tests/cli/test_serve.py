"""Tests for serve CLI command."""
from click.testing import CliRunner

from scavenger.cli.main import cli


def test_serve_command_help():
    """serve command is registered and shows help."""
    runner = CliRunner()
    result = runner.invoke(cli, ["serve", "--help"])

    assert result.exit_code == 0
    assert "Run the FastAPI server" in result.output
