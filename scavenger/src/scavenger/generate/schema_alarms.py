"""Schema-layer alarm generator (SEMI E30 compliant)."""
import random

from scavenger.db.models.alarm import Alarm, AlarmCategory, DataLayer


class SchemaAlarmGenerator:
    """Generate schema-accurate alarms following SEMI E30."""

    MODULES = [
        "Chamber",
        "Robot",
        "Chuck",
        "Pump",
        "Valve",
        "MFC",
        "Heater",
        "Cooler",
        "Sensor",
        "Motor",
        "Loader",
        "Aligner",
        "Stage",
        "Shutter",
        "Lift",
    ]

    FAULT_TYPES = [
        "pressure low",
        "pressure high",
        "temperature high",
        "temperature low",
        "timeout",
        "communication error",
        "position error",
        "interlock",
        "sensor fault",
        "motor fault",
        "flow rate error",
        "vacuum loss",
        "power failure",
        "calibration error",
        "limit exceeded",
    ]

    SEVERITIES = ["warning", "alarm", "critical"]

    PROBABLE_CAUSES = {
        "pressure": ["Leak in chamber", "Pump malfunction", "Valve stuck"],
        "temperature": ["Heater failure", "Coolant flow blocked", "Thermocouple drift"],
        "timeout": ["Communication loss", "Controller busy", "Network congestion"],
        "position": ["Encoder error", "Mechanical obstruction", "Motor failure"],
        "default": ["Hardware malfunction", "Calibration drift", "External interference"],
    }

    def __init__(self, seed: int | None = None):
        self._rng = random.Random(seed)

    def generate_one(self, alid: int) -> Alarm:
        """Generate a single schema-layer alarm."""
        module = self._rng.choice(self.MODULES)
        fault_type = self._rng.choice(self.FAULT_TYPES)
        alcd = self._rng.choice(list(AlarmCategory))
        severity = self._rng.choice(self.SEVERITIES)

        altx = f"{module} {fault_type}"

        causes_key = "default"
        for key in self.PROBABLE_CAUSES:
            if key in fault_type:
                causes_key = key
                break
        probable_causes = self.PROBABLE_CAUSES[causes_key]

        return Alarm(
            alid=alid,
            alcd=alcd,
            altx=altx,
            module_name=module,
            severity=severity,
            probable_causes=probable_causes,
            recommended_actions=[f"Check {module}", "Contact maintenance"],
            data_layer=DataLayer.SCHEMA_ONLY,
        )

    def generate_batch(self, count: int, start_alid: int = 1) -> list[Alarm]:
        """Generate multiple alarms with sequential ALIDs."""
        return [self.generate_one(alid=start_alid + i) for i in range(count)]
