/**
 * War Room Industrial Subsystem Types
 * Real-time monitoring data for power, building automation, gas detection, and fire alarm systems.
 */

/** Subsystem zone classification */
export type SubsystemZoneType = 'power' | 'building-auto' | 'gas' | 'fire';

/** Transformer operational status */
export type TransformerStatus = 'online' | 'offline' | 'alarm';

/** HVAC operating mode */
export type HvacMode = 'heating' | 'cooling' | 'auto';

/** Gas type for detection sensors */
export type GasType = 'O2' | 'H2' | 'NH3' | 'CO' | 'Cl2' | 'H2S';

/** Gas concentration unit */
export type GasUnit = 'ppm' | '%';

/** Sensor health status */
export type SensorStatus = 'normal' | 'alarm' | 'fault';

/** Detector type for fire alarm system */
export type DetectorType = 'smoke' | 'heat' | 'flame' | 'manual';

/** Suppression system type */
export type SuppressionType = 'sprinkler' | 'gas';

/** Suppression system status */
export type SuppressionStatus = 'armed' | 'discharged' | 'fault';

/** Evacuation zone status */
export type ZoneStatus = 'normal' | 'evacuated' | 'partial';

/** Common alarm entry */
export interface AlarmEntry {
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: Date;
}

/**
 * Power Distribution Subsystem
 * Monitors electrical infrastructure including transformers, voltage, current, and power quality.
 */
export interface PowerSubsystemData {
  voltage: number;             // Volts (V)
  current: number;             // Amperes (A)
  powerFactor: number;         // 0.00 - 1.00
  activePower: number;         // kilowatts (kW)
  reactivePower: number;       // kilovolt-amperes reactive (kVAr)
  energyConsumption: number;  // kilowatt-hours (kWh)
  loadPercentage: number;      // 0-100%
  transformer1Status: TransformerStatus;
  transformer2Status: TransformerStatus;
  alarms: AlarmEntry[];
}

/**
 * Building Automation Subsystem
 * Controls HVAC, lighting, and elevator systems across facility zones.
 */
export interface HvacZone {
  id: string;
  name: string;
  temperature: number;        // Celsius (°C)
  humidity: number;          // Percentage (%)
  setpoint: number;          // Target temperature (°C)
  mode: HvacMode;
}

export interface LightingGroup {
  id: string;
  area: string;
  brightnessPercent: number; // 0-100%
  schedule: string;          // e.g., "08:00-18:00"
}

export interface ElevatorStatus {
  id: string;
  status: 'operational' | 'maintenance' | 'out_of_service';
  currentFloor: number;
}

export interface BuildingAutoSubsystemData {
  hvacZones: HvacZone[];
  lightingGroups: LightingGroup[];
  elevators: ElevatorStatus[];
  alarms: AlarmEntry[];
}

/**
 * Gas Detection Subsystem
 * Monitors atmospheric gas concentrations for worker safety.
 */
export interface GasSensor {
  id: string;
  gasType: GasType;
  concentration: number;
  unit: GasUnit;
  lowAlarm: number;          // Threshold for low alarm
  highAlarm: number;         // Threshold for high alarm
  status: SensorStatus;
}

export interface GasDetectionSubsystemData {
  sensors: GasSensor[];
  alarms: AlarmEntry[];
}

/**
 * Fire Alarm Subsystem
 * Manages fire detection, suppression systems, and evacuation coordination.
 */
export interface Detector {
  id: string;
  type: DetectorType;
  zone: string;
  status: SensorStatus;
  lastTestDate: Date;
}

export interface SuppressionSystem {
  id: string;
  type: SuppressionType;
  status: SuppressionStatus;
}

export interface EvacuationZone {
  zone: string;
  occupancy: number;
  status: ZoneStatus;
}

export interface FireAlarmSubsystemData {
  detectors: Detector[];
  suppressionSystems: SuppressionSystem[];
  evacuationZones: EvacuationZone[];
  alarms: AlarmEntry[];
}

/**
 * Aggregated War Room State
 * Consolidates all subsystem data with zone selection and overlay state.
 */
export interface WarRoomState {
  activeZone: SubsystemZoneType | null;
  overlayOpen: boolean;
  subsystemData: {
    power: PowerSubsystemData;
    'building-auto': BuildingAutoSubsystemData;
    gas: GasDetectionSubsystemData;
    fire: FireAlarmSubsystemData;
  };
  lastUpdated: Date;
}