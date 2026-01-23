import pytest
from click.testing import CliRunner
from unittest.mock import AsyncMock, MagicMock, patch
from scavenger.cli.main import cli


def test_db_group_exists():
    """db command group exists."""
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "--help"])
    assert result.exit_code == 0
    assert "migrate" in result.output or "init" in result.output


def test_db_help_shows_all_commands():
    """db help shows init, migrate, and upgrade commands."""
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "--help"])
    assert result.exit_code == 0
    assert "init" in result.output
    assert "migrate" in result.output
    assert "upgrade" in result.output


def test_db_init_command_exists():
    """db init command exists and shows help."""
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "init", "--help"])
    assert result.exit_code == 0
    assert "Initialize" in result.output or "initialize" in result.output.lower()


def test_db_migrate_command_exists():
    """db migrate command exists and requires message."""
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "migrate", "--help"])
    assert result.exit_code == 0
    assert "message" in result.output.lower()


def test_db_migrate_requires_message():
    """db migrate command requires --message option."""
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "migrate"])
    assert result.exit_code != 0
    assert "message" in result.output.lower() or "Missing option" in result.output


def test_db_upgrade_command_exists():
    """db upgrade command exists and shows help."""
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "upgrade", "--help"])
    assert result.exit_code == 0
    assert "migration" in result.output.lower() or "Apply" in result.output


@patch("scavenger.db.session.init_db")
@patch("asyncio.run")
def test_db_init_calls_init_db(mock_run, mock_init_db):
    """db init command calls init_db function."""
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "init"])
    assert result.exit_code == 0
    assert mock_run.called
    assert "Initializing" in result.output or "Done" in result.output


@patch("subprocess.run")
def test_db_migrate_calls_alembic(mock_subprocess):
    """db migrate command calls alembic revision."""
    mock_subprocess.return_value = MagicMock(
        stdout="Migration created", stderr="", returncode=0
    )
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "migrate", "-m", "test migration"])
    assert result.exit_code == 0
    mock_subprocess.assert_called_once()
    call_args = mock_subprocess.call_args[0][0]
    assert "alembic" in call_args
    assert "revision" in call_args
    assert "--autogenerate" in call_args
    assert "test migration" in call_args


@patch("subprocess.run")
def test_db_upgrade_calls_alembic(mock_subprocess):
    """db upgrade command calls alembic upgrade head."""
    mock_subprocess.return_value = MagicMock(
        stdout="Migrations applied", stderr="", returncode=0
    )
    runner = CliRunner()
    result = runner.invoke(cli, ["db", "upgrade"])
    assert result.exit_code == 0
    mock_subprocess.assert_called_once()
    call_args = mock_subprocess.call_args[0][0]
    assert "alembic" in call_args
    assert "upgrade" in call_args
    assert "head" in call_args
