"""Equipment state management."""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ProcessState(str, Enum):
    """Equipment process state."""

    IDLE = "IDLE"
    SETUP = "SETUP"
    READY = "READY"
    EXECUTING = "EXECUTING"
    PAUSED = "PAUSED"


class VariableType(str, Enum):
    """SECS-II variable types."""

    SV = "SV"    # Status Variable
    DV = "DV"    # Data Variable
    ECV = "ECV"  # Equipment Constant Variable


@dataclass
class AlarmState:
    """State of a single alarm."""

    alid: int
    alcd: int
    altx: str
    is_set: bool = False


@dataclass
class EquipmentState:
    """Complete equipment state for simulation."""

    equipment_id: int
    process_state: ProcessState = ProcessState.IDLE
    control_state: str = "OFFLINE"

    # Variables: {vid: value}
    _svs: dict[int, Any] = field(default_factory=dict)
    _dvs: dict[int, Any] = field(default_factory=dict)
    _ecvs: dict[int, Any] = field(default_factory=dict)

    # Alarms: {alid: AlarmState}
    _alarms: dict[int, AlarmState] = field(default_factory=dict)

    # Collection events enabled: {ceid: bool}
    _ceids_enabled: dict[int, bool] = field(default_factory=dict)

    def set_variable(self, var_type: VariableType, vid: int, value: Any) -> None:
        """Set a variable value."""
        store = self._get_variable_store(var_type)
        store[vid] = value

    def get_variable(self, var_type: VariableType, vid: int) -> Any:
        """Get a variable value, returns None if not set."""
        store = self._get_variable_store(var_type)
        return store.get(vid)

    def get_variables(self, var_type: VariableType, vids: list[int]) -> list[Any]:
        """Get multiple variable values."""
        return [self.get_variable(var_type, vid) for vid in vids]

    def _get_variable_store(self, var_type: VariableType) -> dict[int, Any]:
        """Get the storage dict for a variable type."""
        return {
            VariableType.SV: self._svs,
            VariableType.DV: self._dvs,
            VariableType.ECV: self._ecvs,
        }[var_type]

    def set_alarm(self, alid: int, alcd: int, altx: str) -> None:
        """Set (raise) an alarm."""
        self._alarms[alid] = AlarmState(alid=alid, alcd=alcd, altx=altx, is_set=True)

    def clear_alarm(self, alid: int) -> None:
        """Clear an alarm."""
        if alid in self._alarms:
            self._alarms[alid].is_set = False

    def get_alarm(self, alid: int) -> AlarmState | None:
        """Get alarm state by ALID."""
        return self._alarms.get(alid)

    def get_set_alarms(self) -> list[AlarmState]:
        """Get all currently set alarms."""
        return [a for a in self._alarms.values() if a.is_set]

    def enable_ceid(self, ceid: int, enabled: bool = True) -> None:
        """Enable or disable a collection event."""
        self._ceids_enabled[ceid] = enabled

    def is_ceid_enabled(self, ceid: int) -> bool:
        """Check if a collection event is enabled."""
        return self._ceids_enabled.get(ceid, True)  # Default enabled

    def to_dict(self) -> dict[str, Any]:
        """Serialize state for snapshots."""
        return {
            "equipment_id": self.equipment_id,
            "process_state": self.process_state.value,
            "control_state": self.control_state,
            "svs": dict(self._svs),
            "dvs": dict(self._dvs),
            "ecvs": dict(self._ecvs),
            "alarms": {
                alid: {
                    "alid": a.alid,
                    "alcd": a.alcd,
                    "altx": a.altx,
                    "is_set": a.is_set,
                }
                for alid, a in self._alarms.items()
            },
            "ceids_enabled": dict(self._ceids_enabled),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "EquipmentState":
        """Restore state from snapshot dict."""
        state = cls(equipment_id=data["equipment_id"])
        state.process_state = ProcessState(data["process_state"])
        state.control_state = data["control_state"]
        state._svs = data.get("svs", {})
        state._dvs = data.get("dvs", {})
        state._ecvs = data.get("ecvs", {})
        state._ceids_enabled = data.get("ceids_enabled", {})

        for alid, alarm_data in data.get("alarms", {}).items():
            state._alarms[int(alid)] = AlarmState(
                alid=alarm_data["alid"],
                alcd=alarm_data["alcd"],
                altx=alarm_data["altx"],
                is_set=alarm_data["is_set"],
            )

        return state
