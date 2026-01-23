"""Tests for simulator configuration."""
import pytest

from scavenger.config import Settings


def test_settings_has_redis_url():
    """Settings includes Redis URL for simulator."""
    settings = Settings()
    assert hasattr(settings, "redis_url")
    assert "redis://" in settings.redis_url


def test_settings_has_grpc_ports():
    """Settings includes gRPC ports for services."""
    settings = Settings()

    assert settings.equipment_sim_grpc_port == 8001
    assert settings.eap_client_grpc_port == 8002
    assert settings.scenario_engine_grpc_port == 8003
    assert settings.msg_recorder_grpc_port == 8005
    assert settings.replay_service_grpc_port == 8006


def test_settings_has_recorder_config():
    """Settings includes message recorder configuration."""
    settings = Settings()

    assert settings.recorder_batch_size == 100
    assert settings.recorder_flush_interval_ms == 500
