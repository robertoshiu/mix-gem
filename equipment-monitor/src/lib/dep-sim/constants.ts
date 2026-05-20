// equipment-monitor/src/lib/dep-sim/constants.ts
import type { SimulationParams } from './types';

// ---- ALD Process: SiO2 from BDEAS + O3 ----

/** Maximum growth per cycle at full saturation (Angstrom) */
export const GPC_MAX = 0.6;

/** Ideal refractive index of stoichiometric SiO2 at 633nm */
export const IDEAL_RI = 1.46;

/** ALD temperature window bounds (degC) */
export const ALD_WINDOW_LOW = 100;
export const ALD_WINDOW_HIGH = 300;

/** Default total ALD cycles for a ~120 Angstrom film */
export const DEFAULT_TOTAL_CYCLES = 200;

// ---- Langmuir Adsorption Constants ----

/** BDEAS adsorption equilibrium constant K_A (1/(Torr*s)) */
export const K_BDEAS = 12.0;

/** O3 oxidation equilibrium constant K_B (1/(Torr*s)) */
export const K_O3 = 8.0;

// ---- Reactor Flow Constants ----

/** Chamber volume (liters) */
export const CHAMBER_VOLUME_L = 2.5;

/** O3 thermal decomposition activation energy (eV) */
export const O3_DECOMP_EA = 1.05;

/** O3 decomposition pre-exponential (1/s) */
export const O3_DECOMP_A = 1e12;

/** Boltzmann constant in eV/K */
export const KB_EV = 8.617e-5;

// ---- Thermal / Arrhenius Constants ----

/** Surface reaction activation energy (eV) */
export const SURFACE_EA = 0.45;

/** Surface reaction pre-exponential (1/s) */
export const SURFACE_A = 1e8;

/** Reference temperature for nominal GPC (degC) */
export const T_REF = 200;

// ---- Roughness Model ----

/** Base roughness for ideal ALD (Angstrom RMS) */
export const BASE_ROUGHNESS = 0.3;

/** Roughness penalty per unit residual fraction (Angstrom RMS) */
export const ROUGHNESS_PER_RESIDUAL = 4.0;

/** Roughness penalty for thermal decomposition (Angstrom RMS per degC above window) */
export const ROUGHNESS_PER_DECOMP_DEGREE = 0.05;

// ---- Refractive Index Model ----

/** RI deviation per unit of incomplete oxidation (coverage B deficit) */
export const RI_PER_COVERAGE_DEFICIT = 0.08;

// ---- Die Grid (same as lens-sim for consistency) ----

export const DIE_GRID_COLS = 9;
export const DIE_GRID_ROWS = 9;

/** Valid die positions (1 = active, 0 = outside wafer) - row-major 9x9 */
export const DIE_MASK: readonly number[] = [
  0, 0, 0, 1, 1, 1, 0, 0, 0,
  0, 0, 1, 1, 1, 1, 1, 0, 0,
  0, 1, 1, 1, 1, 1, 1, 1, 0,
  1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1,
  0, 1, 1, 1, 1, 1, 1, 1, 0,
  0, 0, 1, 1, 1, 1, 1, 0, 0,
  0, 0, 0, 1, 1, 1, 0, 0, 0,
];

export const ACTIVE_DIE_COUNT = DIE_MASK.filter((d) => d === 1).length;

// ---- Showerhead Flow Profile ----

/** Center-to-edge flow non-uniformity factor (0 = uniform, higher = more edge starvation) */
export const SHOWERHEAD_NONUNIFORMITY = 0.12;

// ---- Slider parameter bounds ----

export const PARAM_BOUNDS = {
  bdeasFlowRate:  { min: 10,  max: 200, default: 80,   step: 5,    unit: 'sccm' },
  bdeasPulseTime: { min: 0.1, max: 5.0, default: 1.5,  step: 0.1,  unit: 's' },
  o3FlowRate:     { min: 50,  max: 500, default: 200,  step: 10,   unit: 'sccm' },
  o3PulseTime:    { min: 0.5, max: 8.0, default: 3.0,  step: 0.5,  unit: 's' },
  purgeTime:      { min: 0.5, max: 10,  default: 4.0,  step: 0.5,  unit: 's' },
  pedestalTemp:   { min: 50,  max: 400, default: 200,  step: 5,    unit: '\u00B0C' },
  chamberPressure:{ min: 0.1, max: 5.0, default: 1.0,  step: 0.1,  unit: 'Torr' },
  carrierGasFlow: { min: 50,  max: 500, default: 200,  step: 10,   unit: 'sccm' },
  totalCycles:    { min: 10,  max: 500, default: 200,  step: 10,   unit: 'cycles' },
} as const;

/** Default simulation parameters */
export const DEFAULT_PARAMS: SimulationParams = {
  bdeasFlowRate:  PARAM_BOUNDS.bdeasFlowRate.default,
  bdeasPulseTime: PARAM_BOUNDS.bdeasPulseTime.default,
  o3FlowRate:     PARAM_BOUNDS.o3FlowRate.default,
  o3PulseTime:    PARAM_BOUNDS.o3PulseTime.default,
  purgeTime:      PARAM_BOUNDS.purgeTime.default,
  pedestalTemp:   PARAM_BOUNDS.pedestalTemp.default,
  chamberPressure:PARAM_BOUNDS.chamberPressure.default,
  carrierGasFlow: PARAM_BOUNDS.carrierGasFlow.default,
  totalCycles:    PARAM_BOUNDS.totalCycles.default,
};
