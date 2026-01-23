"""Tests for embedding CLI commands."""
import pytest
from click.testing import CliRunner
from scavenger.cli.main import cli


def test_embeddings_command_exists():
    """embeddings command group exists."""
    runner = CliRunner()
    result = runner.invoke(cli, ["embeddings", "--help"])
    assert result.exit_code == 0
    assert "populate" in result.output.lower()


def test_embeddings_populate_requires_api_key():
    """embeddings populate fails without API key."""
    runner = CliRunner()
    result = runner.invoke(cli, ["embeddings", "populate"], env={"OPENAI_API_KEY": ""})
    # Should fail or show error about missing API key
    assert result.exit_code != 0 or "api key" in result.output.lower()


def test_embeddings_populate_help():
    """embeddings populate --help shows options."""
    runner = CliRunner()
    result = runner.invoke(cli, ["embeddings", "populate", "--help"])
    assert result.exit_code == 0
    assert "--batch-size" in result.output
    assert "--alarms-only" in result.output
    assert "--recipes-only" in result.output
