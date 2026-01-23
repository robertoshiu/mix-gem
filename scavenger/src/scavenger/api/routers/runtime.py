"""Runtime API router."""
from fastapi import APIRouter

from scavenger.api.schemas.runtime import RuntimeStatus, ConnectionConfig
from scavenger.config import get_settings
from scavenger.runtime.connection import ConnectionState

router = APIRouter(prefix="/runtime", tags=["runtime"])


@router.get("/status", response_model=RuntimeStatus)
async def get_runtime_status():
    """Get HSMS runtime connection status."""
    settings = get_settings()

    # For now, return NOT_CONNECTED state (Phase 6 only has config, no live runtime yet)
    return RuntimeStatus(
        state=ConnectionState.NOT_CONNECTED.value,
        config=ConnectionConfig(
            host=settings.hsms_host,
            port=settings.hsms_port,
            mode=settings.hsms_mode,
            device_id=settings.hsms_device_id,
        ),
    )
