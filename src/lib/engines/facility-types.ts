// src/lib/engines/facility-types.ts

// ── HVAC Node Types ──

export type HvacNodeId =
  | 'chiller'
  | 'ahu-supply'
  | 'duct-main'
  | 'zone-cr'
  | 'zone-prod'
  | 'return-plenum'
  | 'ffu-array';

export interface HvacNodeState {
  T: number;           // temperature (C)
  RH: number;          // relative humidity (%)
  P: number;           // pressure (Pa gauge)
  flow: number;        // mass flow rate (kg/s)
  particleCount: number; // particles/m3
}

export type HvacNetworkState = Record<HvacNodeId, HvacNodeState>;

export interface HvacEngineState {
  nodes: HvacNetworkState;
  chillerOnline: boolean;
  ahuFanOnline: boolean;
  doorBreached: boolean;
}

// ── Gas Types ──

export type GasSpecies = 'O2' | 'H2' | 'NH3' | 'CO' | 'Cl2' | 'H2S';

export interface GasSensorState {
  id: string;
  species: GasSpecies;
  position_r: number;      // distance from source (m)
  concentration: number;   // measured (after lag), ppm or %
  concentrationActual: number; // true value before sensor lag
  unit: 'ppm' | '%';
  lowAlarm: number;
  highAlarm: number;
  status: 'normal' | 'alarm' | 'fault';
  drift: number;           // cumulative drift
}

export interface ScrubberState {
  inletFlow: number;       // m3/s
  efficiency: number;      // 0-1
  powerDraw: number;       // kW
  online: boolean;
}

export interface GasEngineState {
  sensors: GasSensorState[];
  scrubber: ScrubberState;
  cabinetPressure: number; // Pa
  leakRateMultiplier: number; // 1 = normal, 50 = leak scenario
}

// ── Power Types ──

export type PowerNodeId =
  | 'utility'
  | 'transformer-t1'
  | 'transformer-t2'
  | 'switchgear'
  | 'pdu-a'
  | 'load-bus';

export interface PowerNodeState {
  V: number;          // voltage (V)
  I: number;          // current (A)
  P_active: number;   // active power (kW)
  P_reactive: number; // reactive power (kVAr)
  PF: number;         // power factor
  theta: number;      // temperature (C)
}

export interface UpsState {
  online: boolean;       // true = battery active
  soc: number;           // state of charge 0-1
  outputV: number;       // output voltage
}

export interface PowerEngineState {
  nodes: Record<PowerNodeId, PowerNodeState>;
  ups: UpsState;
  totalLoad: number;      // kW (sum of all loads)
  t1Online: boolean;
  t2Online: boolean;
}

// ── Coupling ──

export interface CoupledVariables {
  hvac_zone_cr_temp: number;
  hvac_ahu_flow: number;
  hvac_ahu_power_draw: number;
  hvac_pressure_diff: number;
  gas_scrubber_power_draw: number;
  gas_total_leak_rate: number;
  gas_scrubber_exhaust_temp: number;
  power_voltage: number;
  power_available: boolean;
  power_ups_active: boolean;
}

// ── Scenarios ──

export type FacilityScenarioId =
  | 'nominal'
  | 'ups-depletion'
  | 'transformer-overload'
  | 'chiller-failure'
  | 'ahu-fan-failure'
  | 'pressure-breach'
  | 'chemical-leak'
  | 'scrubber-failure';

export interface FacilityScenario {
  id: FacilityScenarioId;
  label: string;
  origin: 'power' | 'hvac' | 'gas';
  description: string;
}

// ── Facility State ──

export interface FacilitySimState {
  hvac: HvacEngineState;
  gas: GasEngineState;
  power: PowerEngineState;
  coupled: CoupledVariables;
  scenario: FacilityScenarioId;
  tick: number;
  scenarioStartTick: number;
}

// ── Alarm ──

export interface FacilityAlarm {
  subsystem: 'hvac' | 'gas' | 'power';
  message: string;
  severity: 'critical' | 'warning' | 'info';
  tick: number;
}

// ── Equipment health for 3D ──

export type HealthLevel = 'normal' | 'warning' | 'alarm';

export interface EquipmentHealth {
  id: string;
  subsystem: 'hvac' | 'gas' | 'power';
  health: HealthLevel;
}

export interface CascadeLine {
  fromId: string;
  toId: string;
  severity: HealthLevel;
  progress: number; // 0-1 animation progress
}
