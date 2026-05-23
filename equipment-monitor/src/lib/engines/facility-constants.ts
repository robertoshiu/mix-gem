// src/lib/engines/facility-constants.ts

import type {
  HvacNodeId,
  HvacNodeState,
  HvacNetworkState,
  GasSensorState,
  GasSpecies,
  ScrubberState,
  PowerNodeId,
  PowerNodeState,
  UpsState,
  FacilityScenario,
  FacilityScenarioId,
  CoupledVariables,
} from './facility-types';

// ── HVAC Constants ──

export const HVAC_TICK_DT = 1; // seconds

/** Node connectivity: each node flows into the next */
export const HVAC_TOPOLOGY: [HvacNodeId, HvacNodeId][] = [
  ['chiller', 'ahu-supply'],
  ['ahu-supply', 'duct-main'],
  ['duct-main', 'zone-cr'],
  ['duct-main', 'zone-prod'],
  ['zone-cr', 'ffu-array'],
  ['ffu-array', 'zone-cr'],
  ['zone-cr', 'return-plenum'],
  ['zone-prod', 'return-plenum'],
  ['return-plenum', 'chiller'],
];

export const CHILLER_CAPACITY_KW = 150;
export const CHILLER_COP = 4.5;
export const AHU_FAN_CFM = 15000;
export const AHU_FAN_FLOW_KGS = 7.08; // 15000 CFM -> ~7.08 kg/s air
export const AHU_FAN_POWER_KW = 18.5;
export const ZONE_VOLUME_M3 = 400;
export const ZONE_CR_PRESSURE_PA = 20; // positive differential
export const AIR_CP = 1005; // J/(kg*K)
export const AIR_DENSITY = 1.2; // kg/m3
export const ZONE_MASS_KG = ZONE_VOLUME_M3 * AIR_DENSITY; // ~480 kg

export const FFU_EFFICIENCY = 0.9999; // HEPA
export const OCCUPANT_HEAT_W = 120; // per person
export const OCCUPANT_MOISTURE_GS = 0.0139; // 50 g/hr -> g/s
export const OCCUPANT_PARTICLES = 1667; // 10^5/min -> /s per person
export const OCCUPANT_COUNT = 8;
export const EQUIPMENT_HEAT_W = 45000; // 45 kW from process tools
export const AMBIENT_PARTICLE_COUNT = 35200000; // ISO 8 ambient
export const ISO5_LIMIT = 3520;
export const ISO7_LIMIT = 352000;

export const INITIAL_HVAC_NODE: HvacNodeState = {
  T: 22,
  RH: 45,
  P: 20,
  flow: AHU_FAN_FLOW_KGS,
  particleCount: 1000,
};

export const INITIAL_HVAC_NODES: HvacNetworkState = {
  'chiller': { T: 7, RH: 95, P: 0, flow: AHU_FAN_FLOW_KGS, particleCount: 0 },
  'ahu-supply': { T: 14, RH: 85, P: 250, flow: AHU_FAN_FLOW_KGS, particleCount: 0 },
  'duct-main': { T: 16, RH: 60, P: 120, flow: AHU_FAN_FLOW_KGS, particleCount: 100 },
  'zone-cr': { T: 22, RH: 45, P: 20, flow: AHU_FAN_FLOW_KGS * 0.6, particleCount: 1000 },
  'zone-prod': { T: 23, RH: 48, P: 15, flow: AHU_FAN_FLOW_KGS * 0.4, particleCount: 50000 },
  'return-plenum': { T: 24, RH: 50, P: -5, flow: AHU_FAN_FLOW_KGS, particleCount: 30000 },
  'ffu-array': { T: 22, RH: 45, P: 50, flow: AHU_FAN_FLOW_KGS * 0.6, particleCount: 100 },
};

// ── Gas Constants ──

export const SENSOR_TAU_S = 3; // first-order lag time constant
export const SENSOR_DRIFT_PER_S = 0.001 / 3600; // 0.1% per hour in per-second
export const DIFFUSION_COEFF = 2e-5; // m2/s typical gas in air

export const GAS_SENSOR_CONFIGS: Omit<GasSensorState, 'concentration' | 'concentrationActual' | 'status' | 'drift'>[] = [
  { id: 'gas-01', species: 'O2', position_r: 2, unit: '%', lowAlarm: 19.5, highAlarm: 23.5 },
  { id: 'gas-02', species: 'O2', position_r: 5, unit: '%', lowAlarm: 19.5, highAlarm: 23.5 },
  { id: 'gas-03', species: 'CO', position_r: 1.5, unit: 'ppm', lowAlarm: 25, highAlarm: 50 },
  { id: 'gas-04', species: 'H2', position_r: 2, unit: 'ppm', lowAlarm: 100, highAlarm: 500 },
  { id: 'gas-05', species: 'NH3', position_r: 1.8, unit: 'ppm', lowAlarm: 25, highAlarm: 50 },
  { id: 'gas-06', species: 'H2S', position_r: 1.5, unit: 'ppm', lowAlarm: 5, highAlarm: 10 },
  { id: 'gas-07', species: 'Cl2', position_r: 2.5, unit: 'ppm', lowAlarm: 0.5, highAlarm: 1 },
  { id: 'gas-08', species: 'CO', position_r: 4, unit: 'ppm', lowAlarm: 25, highAlarm: 50 },
];

export const GAS_BASELINES: Record<GasSpecies, number> = {
  O2: 20.9,
  H2: 8,
  NH3: 2,
  CO: 4,
  Cl2: 0.1,
  H2S: 0.5,
};

export const SCRUBBER_FLOW_MAX = 0.5; // m3/s
export const SCRUBBER_ETA_MAX = 0.98;
export const SCRUBBER_POWER_BASE = 5; // kW
export const SCRUBBER_POWER_K = 40; // kW/(m3/s)^2
export const CABINET_PRESSURE_PA = 300000; // ~3 atm
export const LEAK_RATE_K = 5e-6; // baseline leak coefficient (tuned for turbulent cleanroom transport)
export const LEAK_TEMP_ALPHA = 0.02; // per degree C above 22

export const INITIAL_SCRUBBER: ScrubberState = {
  inletFlow: 0.05,
  efficiency: SCRUBBER_ETA_MAX,
  powerDraw: SCRUBBER_POWER_BASE + SCRUBBER_POWER_K * 0.05 * 0.05,
  online: true,
};

// ── Power Constants ──

export const UTILITY_VOLTAGE = 230;
export const UTILITY_FREQ_HZ = 50;
export const TRANSFORMER_KVA = 500;
export const TRANSFORMER_Z_PCT = 0.05;
export const TRANSFORMER_TURNS_RATIO = 1.0;
export const TRANSFORMER_THETA_RISE_MAX = 65; // C above ambient
export const TRANSFORMER_TAU_S = 300; // thermal time constant
export const AMBIENT_TEMP_C = 25;
export const TRANSFORMER_ALARM_TEMP = 85;
export const UPS_KVA = 120;
export const UPS_BATTERY_V = 384; // 384V DC bus
export const UPS_CAPACITY_AH = 100;
export const UPS_SOC_CRITICAL = 0.20;
export const UPS_TRANSFER_V = 210; // voltage sag threshold
export const PDU_RATED_A = 400;
export const LIGHTING_LOAD_KW = 12;
export const PROCESS_TOOLS_LOAD_KW = 85;
export const PF_ALARM_THRESHOLD = 0.85;

export const INITIAL_POWER_NODES: Record<PowerNodeId, PowerNodeState> = {
  'utility': { V: 230, I: 0, P_active: 0, P_reactive: 0, PF: 1, theta: 25 },
  'transformer-t1': { V: 230, I: 260, P_active: 55, P_reactive: 18, PF: 0.95, theta: 45 },
  'transformer-t2': { V: 230, I: 0, P_active: 0, P_reactive: 0, PF: 1, theta: 28 },
  'switchgear': { V: 228, I: 260, P_active: 55, P_reactive: 18, PF: 0.95, theta: 30 },
  'pdu-a': { V: 227, I: 260, P_active: 55, P_reactive: 18, PF: 0.95, theta: 32 },
  'load-bus': { V: 226, I: 260, P_active: 55, P_reactive: 18, PF: 0.95, theta: 30 },
};

export const INITIAL_UPS: UpsState = {
  online: false,
  soc: 1.0,
  outputV: 230,
};

// ── Fault Scenarios ──

export const FACILITY_SCENARIOS: FacilityScenario[] = [
  { id: 'nominal', label: 'Nominal', origin: 'hvac', description: 'Steady-state baseline operation' },
  { id: 'ups-depletion', label: 'UPS Battery Depletion', origin: 'power', description: 'SOC forced to 18%, utility voltage sag to 205V' },
  { id: 'transformer-overload', label: 'Transformer Overload', origin: 'power', description: 'Load spike to 110% rated, T1 temp ramp to 95C' },
  { id: 'chiller-failure', label: 'Chiller Failure', origin: 'hvac', description: 'Chiller cooling capacity drops to 0' },
  { id: 'ahu-fan-failure', label: 'AHU Fan Failure', origin: 'hvac', description: 'AHU flow and fan power drop to 0' },
  { id: 'pressure-breach', label: 'Cleanroom Pressure Breach', origin: 'hvac', description: 'Pressure differential forced to 0 Pa' },
  { id: 'chemical-leak', label: 'Chemical Leak (NH3)', origin: 'gas', description: 'NH3 cabinet leak rate x50' },
  { id: 'scrubber-failure', label: 'Scrubber Failure', origin: 'gas', description: 'Scrubber efficiency drops to 0%' },
];

// ── Coupled Variables Initial ──

export const INITIAL_COUPLED: CoupledVariables = {
  hvac_zone_cr_temp: 22,
  hvac_ahu_flow: AHU_FAN_FLOW_KGS,
  hvac_ahu_power_draw: AHU_FAN_POWER_KW,
  hvac_pressure_diff: ZONE_CR_PRESSURE_PA,
  gas_scrubber_power_draw: SCRUBBER_POWER_BASE,
  gas_total_leak_rate: 0,
  gas_scrubber_exhaust_temp: 30,
  power_voltage: UTILITY_VOLTAGE,
  power_available: true,
  power_ups_active: false,
};

// ── 3D Equipment Mapping ──

export const SUBSYSTEM_EQUIPMENT_MAP: Record<string, 'hvac' | 'gas' | 'power'> = {
  'PDU-A-01': 'power',
  'UPS-A': 'power',
  'AHU-SUPPLY-01': 'hvac',
  'CHILLED-WATER-LOOP': 'hvac',
  'GAS-CABINET-01': 'gas',
  'SCRUBBER-SUBFAB-01': 'gas',
};

// ── Cascade Line Definitions (per scenario) ──

export const SCENARIO_CASCADE_PATHS: Record<FacilityScenarioId, [string, string][]> = {
  'nominal': [],
  'ups-depletion': [['UPS-A', 'PDU-A-01'], ['PDU-A-01', 'AHU-SUPPLY-01'], ['AHU-SUPPLY-01', 'GAS-CABINET-01']],
  'transformer-overload': [['PDU-A-01', 'AHU-SUPPLY-01'], ['AHU-SUPPLY-01', 'CHILLED-WATER-LOOP']],
  'chiller-failure': [['CHILLED-WATER-LOOP', 'AHU-SUPPLY-01'], ['AHU-SUPPLY-01', 'GAS-CABINET-01'], ['GAS-CABINET-01', 'SCRUBBER-SUBFAB-01'], ['SCRUBBER-SUBFAB-01', 'PDU-A-01']],
  'ahu-fan-failure': [['AHU-SUPPLY-01', 'GAS-CABINET-01'], ['GAS-CABINET-01', 'SCRUBBER-SUBFAB-01']],
  'pressure-breach': [['AHU-SUPPLY-01', 'GAS-CABINET-01']],
  'chemical-leak': [['GAS-CABINET-01', 'SCRUBBER-SUBFAB-01'], ['SCRUBBER-SUBFAB-01', 'PDU-A-01'], ['PDU-A-01', 'AHU-SUPPLY-01']],
  'scrubber-failure': [['SCRUBBER-SUBFAB-01', 'GAS-CABINET-01'], ['GAS-CABINET-01', 'AHU-SUPPLY-01'], ['AHU-SUPPLY-01', 'PDU-A-01']],
};
