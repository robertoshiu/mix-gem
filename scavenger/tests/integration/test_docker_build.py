"""Docker image build test."""
import os
import shutil
import subprocess
from pathlib import Path

import docker
import pytest


def _docker_available() -> bool:
    if shutil.which("docker") is None:
        return False
    try:
        client = docker.from_env()
        client.ping()
    except Exception:
        return False
    return True


def test_docker_image_build():
    """Docker image builds successfully."""
    if os.environ.get("SKIP_DOCKER_TESTS") == "1":
        pytest.skip("Docker tests skipped via SKIP_DOCKER_TESTS")

    if not _docker_available():
        pytest.skip("Docker daemon is not available")

    scavenger_root = Path(__file__).resolve().parents[2]

    result = subprocess.run(
        [
            "docker",
            "build",
            "-f",
            str(scavenger_root / "Dockerfile"),
            "-t",
            "scavenger:test",
            str(scavenger_root),
        ],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
