import pytest
from scavenger.generate.schema_alarms import SchemaAlarmGenerator
from scavenger.db.models.alarm import AlarmCategory, DataLayer


def test_generate_single_alarm():
    """Generator creates valid schema-layer alarm."""
    gen = SchemaAlarmGenerator(seed=42)
    alarm = gen.generate_one(alid=1001)

    assert alarm.alid == 1001
    assert alarm.alcd in list(AlarmCategory)
    assert alarm.altx != ""
    assert alarm.data_layer == DataLayer.SCHEMA_ONLY


def test_generate_batch():
    """Generator creates multiple unique alarms."""
    gen = SchemaAlarmGenerator(seed=42)
    alarms = gen.generate_batch(count=10, start_alid=1000)

    assert len(alarms) == 10
    alids = [a.alid for a in alarms]
    assert alids == list(range(1000, 1010))


def test_reproducible_with_seed():
    """Same seed produces same alarms."""
    gen1 = SchemaAlarmGenerator(seed=42)
    gen2 = SchemaAlarmGenerator(seed=42)

    alarm1 = gen1.generate_one(alid=1)
    alarm2 = gen2.generate_one(alid=1)

    assert alarm1.altx == alarm2.altx
    assert alarm1.alcd == alarm2.alcd
