# tests/test_config.py
import os
import pytest
from scavenger.config import Settings


def test_settings_from_env(monkeypatch):
    """Settings loads from environment variables."""
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test-key")

    settings = Settings()

    assert "localhost" in str(settings.database_url)
    assert settings.openai_api_key.get_secret_value() == "sk-test-key"


def test_settings_defaults():
    """Settings has sensible defaults."""
    settings = Settings(_env_file=None)

    assert settings.hsms_port == 5000
    assert settings.hsms_device_id == 1
    assert settings.api_host == "0.0.0.0"
    assert settings.api_port == 8000
