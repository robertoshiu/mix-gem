// equipment-monitor/src/lib/damascene-sim/constants.ts
import type { SimulationParams } from './types';

// ---- Phase boundaries (out of 200 total steps) ----
export const ECD_FILL_END = 120;     // steps 0-119
export const ANNEAL_END = 160;       // steps 120-159
export const DEFAULT_TOTAL_STEPS = 200;

// ---- ECD / Electroplating Constants ----

/** Electrolyte conductivity (S/cm) */
export const ELECTROLYTE_CONDUCTIVITY = 0.05;

/** Exchange current density (mA/cm²) */
export const EXCHANGE_CURRENT_DENSITY = 5.0;

/** Characteristic length for Wagner number (cm) */
export const CHARACTERISTIC_LENGTH = 0.5;

/** Seed layer sheet resistance coefficient (ohm/sq per nm inverse) */
export const SEED_RESISTANCE_COEFF = 0.5;

/** Terminal effect strength (fraction of extra current at edge) */
export const TERMINAL_EFFECT_STRENGTH = 0.15;

/** Faraday efficiency for Cu deposition */
export const FARADAY_EFFICIENCY = 0.95;

/** Molar mass of Cu (g/mol) */
export const CU_MOLAR_MASS = 63.546;

/** Cu density (g/cm³) */
export const CU_DENSITY = 8.96;

/** Faraday constant (C/mol) */
export const FARADAY_CONST = 96485;

/** Valence for Cu²⁺ */
export const CU_VALENCE = 2;

// ---- Fill Profile Constants ----

/** Number of discrete points across trench width */
export const FILL_PROFILE_POINTS = 20;

/** Superfill threshold — additive health above this gives bottom-up fill */
export const SUPERFILL_THRESHOLD = 0.6;

/** Void threshold — additive health below this causes pinch-off */
export const VOID_THRESHOLD = 0.3;

// ---- CMP Constants ----

/** Preston coefficient (nm/(psi·m/s·s)) */
export const PRESTON_K = 120;

/** Dishing coefficient (nm per nm trench width per second overpolish) */
export const DISHING_COEFF = 0.0005;

/** Erosion rate (nm/s) for dense features */
export const EROSION_RATE = 0.02;

/** Barrier thickness (nm) — CMP target is to expose this layer */
export const BARRIER_THICKNESS = 15;

// ---- Thermal Constants ----

/** Activation energy for Cu ECD (eV) */
export const ECD_EA = 0.25;

/** Reference bath temperature (°C) */
export const BATH_T_REF = 25;

/** Boltzmann constant (eV/K) */
export const KB_EV = 8.617e-5;

/** Anneal temperature (°C) */
export const ANNEAL_TEMP = 200;

/** Post-anneal resistance reduction factor */
export const ANNEAL_RS_FACTOR = 0.85;

/** Base roughness for ideal ECD (nm RMS) */
export const BASE_ROUGHNESS = 1.5;

/** Roughness increase per °C above reference */
export const ROUGHNESS_PER_DEGREE = 0.08;

// ---- Die Grid (same as dep-sim / lens-sim) ----

export const DIE_GRID_COLS = 9;
export const DIE_GRID_ROWS = 9;

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

// ---- Slider parameter bounds ----

export const PARAM_BOUNDS = {
  appliedCurrent: { min: 5,   max: 60,  default: 30,    step: 1,    unit: 'mA/cm\u00B2' },
  bathTemp:       { min: 15,  max: 45,  default: 25,    step: 1,    unit: '\u00B0C' },
  additiveConc:   { min: 0,   max: 1.0, default: 0.8,   step: 0.05, unit: '' },
  seedThickness:  { min: 10,  max: 100, default: 50,    step: 5,    unit: 'nm' },
  trenchWidth:    { min: 30,  max: 500, default: 100,   step: 10,   unit: 'nm' },
  trenchDepth:    { min: 50,  max: 500, default: 200,   step: 10,   unit: 'nm' },
  padPressure:    { min: 1,   max: 10,  default: 4,     step: 0.5,  unit: 'psi' },
  padVelocity:    { min: 0.5, max: 3.0, default: 1.5,   step: 0.1,  unit: 'm/s' },
  totalSteps:     { min: 50,  max: 400, default: 200,   step: 10,   unit: 'steps' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  appliedCurrent: PARAM_BOUNDS.appliedCurrent.default,
  bathTemp:       PARAM_BOUNDS.bathTemp.default,
  additiveConc:   PARAM_BOUNDS.additiveConc.default,
  seedThickness:  PARAM_BOUNDS.seedThickness.default,
  trenchWidth:    PARAM_BOUNDS.trenchWidth.default,
  trenchDepth:    PARAM_BOUNDS.trenchDepth.default,
  padPressure:    PARAM_BOUNDS.padPressure.default,
  padVelocity:    PARAM_BOUNDS.padVelocity.default,
  totalSteps:     PARAM_BOUNDS.totalSteps.default,
};
