"""Integration tests for full-text triggers."""
import pytest

from scavenger.db.models.alarm import Alarm, AlarmCategory, DataLayer
from scavenger.db.session import get_session


@pytest.mark.asyncio
async def test_alarm_altx_tsv_trigger(initialized_db):
    """Alarm altx_tsv is populated by trigger on insert/update."""
    async with get_session() as session:
        alarm = Alarm(
            alid=1001,
            alcd=AlarmCategory.EQUIPMENT_SAFETY,
            altx="Vacuum pressure low",
            data_layer=DataLayer.SCHEMA_ONLY,
        )
        session.add(alarm)
        await session.flush()
        await session.refresh(alarm)

        assert alarm.altx_tsv is not None

        alarm.altx = "Temperature high"
        await session.flush()
        await session.refresh(alarm)

        assert alarm.altx_tsv is not None
