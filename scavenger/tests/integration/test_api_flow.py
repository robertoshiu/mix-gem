"""End-to-end API flow tests using a real database."""
import pytest
from httpx import ASGITransport, AsyncClient

from scavenger.api.main import app


@pytest.mark.asyncio
async def test_scenario_execution_flow(initialized_db):
    """Create scenario, start execution, and fetch status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        create_response = await client.post(
            "/api/scenarios",
            json={
                "name": "Integration Scenario",
                "description": "Integration flow test",
                "steps": [
                    {"sxfy": "S1F13", "direction": "H2E", "delay_ms": 0},
                    {"sxfy": "S1F14", "direction": "E2H", "delay_ms": 100},
                ],
            },
        )
        assert create_response.status_code == 201
        scenario_id = create_response.json()["id"]

        execute_response = await client.post(f"/api/scenarios/{scenario_id}/execute")
        assert execute_response.status_code == 202
        run_id = execute_response.json()["run_id"]

        status_response = await client.get(f"/api/executions/{run_id}")
        assert status_response.status_code == 200
        assert status_response.json()["status"] in [
            "pending",
            "running",
            "completed",
            "failed",
        ]
