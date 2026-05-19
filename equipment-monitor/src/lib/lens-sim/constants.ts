// equipment-monitor/src/lib/lens-sim/constants.ts
import type { SimulationParams } from './types';

/** Number of lens elements modeled (L1 closest to wafer, L5 farthest) */
export const LENS_COUNT = 5;

/** Number of Zernike coefficients (Z1-Z16) */
export const ZERNIKE_COUNT = 16;

/** Default lot size */
export const LOT_SIZE = 25;

/** Exposure time per wafer (seconds) - typical ArFi scanner */
export const EXPOSURE_TIME_PER_WAFER = 12;

/** Wafer diameter (mm) */
export const WAFER_DIAMETER_MM = 300;

/** Die grid layout (approximation for 300mm wafer) */
export const DIE_GRID_COLS = 9;
export const DIE_GRID_ROWS = 9;

/** Valid die positions (1 = active die, 0 = outside wafer) - row-major */
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

/** Number of active dies */
export const ACTIVE_DIE_COUNT = DIE_MASK.filter((d) => d === 1).length;

// ---- Lens element physical properties ----

/** Absorption fraction per pass for each element [L1..L5] */
export const ABSORPTION_FRACTION = [0.003, 0.002, 0.0015, 0.001, 0.0008];

/** Thermal time constant tau (seconds) per element [L1..L5] */
export const THERMAL_TAU = [80, 120, 160, 220, 300];

/** Max temperature rise at 100% cooling (degC) per element [L1..L5] */
export const DELTA_T_MAX_BASE = [0.15, 0.10, 0.07, 0.04, 0.02];

/** Element thickness (mm) [L1..L5] */
export const ELEMENT_THICKNESS_MM = [15, 20, 25, 30, 40];

// ---- Optical constants ----

/** Fused silica dn/dT at 193nm (per degC) */
export const SILICA_DN_DT = 10e-6;

/** Water dn/dT at 193nm (per degC) — negative */
export const WATER_DN_DT = -100e-6;

/** Water refractive index at 193nm (baseline) */
export const WATER_N_193 = 1.437;

/** Immersion gap height (um) */
export const IMMERSION_GAP_UM = 100;

// ---- Zernike sensitivities (nm wavefront per degC of L1) ----

export const ZERNIKE_SENSITIVITY: readonly number[] = [
  0,     // Z1 piston (ignored)
  0.05,  // Z2 tilt-x
  0.05,  // Z3 tilt-y
  1.2,   // Z4 defocus (dominant)
  0.3,   // Z5 astigmatism-0
  0.25,  // Z6 astigmatism-45
  0.15,  // Z7 coma-x
  0.12,  // Z8 coma-y
  0.5,   // Z9 spherical (significant)
  0.08,  // Z10 trefoil
  0.06,  // Z11 trefoil
  0.04,  // Z12
  0.03,  // Z13
  0.02,  // Z14
  0.015, // Z15
  0.01,  // Z16
];

// ---- Wafer impact sensitivities ----

/** CD change per nm of defocus (nm CD / nm defocus) */
export const CD_PER_DEFOCUS = 0.4;

/** CD change per mJ/cm2 dose error (nm CD / mJ) */
export const CD_PER_DOSE = 1.5;

/** Overlay per nm of coma wavefront (nm OVL / nm wavefront) */
export const OVERLAY_PER_COMA = 0.6;

/** Overlay per nm of tilt wavefront */
export const OVERLAY_PER_TILT = 0.8;

/** Base LER 3sigma (nm) */
export const BASE_LER = 2.8;

/** LER sensitivity to dose margin (nm LER per % dose error) */
export const LER_PER_DOSE_PCT = 0.15;

// ---- Fluid dynamics ----

/** Water surface tension at 22.5C (N/m) */
export const WATER_SURFACE_TENSION = 0.0728;

/** Water dynamic viscosity at 22.5C (Pa*s) */
export const WATER_VISCOSITY = 0.00095;

/** Meniscus length (mm) */
export const MENISCUS_LENGTH_MM = 2.0;

/** Base contact angle (degrees) */
export const BASE_CONTACT_ANGLE = 60;

/** Fraction of L1 heat removed by immersion water */
export const WATER_COOLING_FRACTION = 0.7;

// ---- Slider parameter bounds ----

export const PARAM_BOUNDS = {
  dose:            { min: 20, max: 45, default: 30, step: 0.5, unit: 'mJ/cm\u00B2' },
  scanSpeed:       { min: 200, max: 700, default: 500, step: 10, unit: 'mm/s' },
  coolingPower:    { min: 0, max: 1, default: 0.8, step: 0.01, unit: '%', displayScale: 100 },
  fluidFlowRate:   { min: 0.3, max: 2.0, default: 1.2, step: 0.1, unit: 'L/min' },
  resistThickness: { min: 60, max: 120, default: 90, step: 1, unit: 'nm' },
  ambientTemp:     { min: 22.0, max: 23.0, default: 22.5, step: 0.1, unit: '\u00B0C' },
} as const;

/** Default simulation parameters */
export const DEFAULT_PARAMS: SimulationParams = {
  dose: PARAM_BOUNDS.dose.default,
  scanSpeed: PARAM_BOUNDS.scanSpeed.default,
  coolingPower: PARAM_BOUNDS.coolingPower.default,
  fluidFlowRate: PARAM_BOUNDS.fluidFlowRate.default,
  resistThickness: PARAM_BOUNDS.resistThickness.default,
  ambientTemp: PARAM_BOUNDS.ambientTemp.default,
};
