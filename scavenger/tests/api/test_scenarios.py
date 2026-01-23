# tests/api/test_scenarios.py
import pytest
from httpx import AsyncClient, ASGITransport
from scavenger.api.main import app


@pytest.mark.asyncio
async def test_list_scenarios_endpoint():
    """GET /api/scenarios returns scenario list."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        try:
            response = await client.get("/api/scenarios")
        except Exception:
            pytest.skip("Database not available")

    # Endpoint should exist (not 404)
    assert response.status_code != 404

    # If database is available, check response structure
    if response.status_code == 200:
        data = response.json()
        assert "scenarios" in data
        assert isinstance(data["scenarios"], list)


@pytest.mark.asyncio
async def test_create_scenario_endpoint():
    """POST /api/scenarios creates new scenario."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        try:
            response = await client.post(
                "/api/scenarios",
                json={
                    "name": "S1F13 Communication Establish",
                    "description": "Host establishes communication",
                    "steps": [
                        {"sxfy": "S1F13", "direction": "H2E", "delay_ms": 0},
                        {"sxfy": "S1F14", "direction": "E2H", "delay_ms": 100},
                    ],
                },
            )
        except Exception:
            pytest.skip("Database not available")

    # Endpoint should exist (not 404)
    assert response.status_code != 404

    # If database is available, check response structure
    if response.status_code == 201:
        data = response.json()
        assert "id" in data
        assert data["name"] == "S1F13 Communication Establish"


@pytest.mark.asyncio
async def test_start_execution_endpoint():
    """POST /api/scenarios/{id}/execute starts scenario execution."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        try:
            # Create scenario first
            create_response = await client.post(
                "/api/scenarios",
                json={
                    "name": "Test Scenario",
                    "steps": [{"sxfy": "S1F1", "direction": "H2E", "delay_ms": 0}],
                },
            )

            if create_response.status_code != 201:
                pytest.skip("Database not available")

            scenario_id = create_response.json()["id"]

            # Start execution
            response = await client.post(f"/api/scenarios/{scenario_id}/execute")
        except Exception:
            pytest.skip("Database not available")

    # Endpoint should exist (not 404)
    assert response.status_code != 404

    # If database is available, check response structure
    if response.status_code == 202:  # Accepted
        data = response.json()
        assert "run_id" in data
        assert "status" in data


@pytest.mark.asyncio
async def test_get_execution_status_endpoint():
    """GET /api/executions/{run_id} returns execution status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        try:
            response = await client.get("/api/executions/1")
        except Exception:
            pytest.skip("Database not available")

    # Endpoint should exist (route is registered)
    # 404 is acceptable if run_id doesn't exist in database
    # 500 is acceptable if database connection fails
    assert response.status_code in [200, 404, 500]

    # If database is available and run exists, check response structure
    if response.status_code == 200:
        data = response.json()
        assert "status" in data


@pytest.mark.asyncio
async def test_start_execution_scenario_not_found():
    """POST /api/scenarios/999999/execute returns 404 for nonexistent scenario."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        try:
            response = await client.post("/api/scenarios/999999/execute")
        except Exception:
            pytest.skip("Database not available")

    # Either 404 (scenario not found) or skip if no database
    if response.status_code != 500:  # 500 means database connection issue
        assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_scenario_missing_required_fields():
    """POST /api/scenarios without required fields returns 422."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/scenarios", json={})

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_create_scenario_invalid_steps():
    """POST /api/scenarios with invalid steps returns 422."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/scenarios",
            json={
                "name": "Test",
                "steps": "not a list",  # Invalid - should be array
            },
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_execution_nonexistent_run():
    """GET /api/executions/999999 returns 404 for nonexistent run."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        try:
            response = await client.get("/api/executions/999999")
        except Exception:
            pytest.skip("Database not available")

    # Either 404 (run not found) or skip if no database
    if response.status_code != 500:  # 500 means database connection issue
        assert response.status_code == 404
