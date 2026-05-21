import type { SimulationParams } from './types';

export const RAMP_UP_END = 20;
export const BULK_CU_END = 120;
export const BARRIER_END = 170;
export const DEFAULT_TOTAL_STEPS = 200;

export const RADIAL_NODES = 20;
export const WAFER_RADIUS_MM = 150;
export const SLURRY_VISCOSITY = 0.001;
export const PAD_GROOVE_POSITIONS = [0.25, 0.45, 0.65, 0.85];
export const ATMOSPHERIC_PA = 101325;

export const ASPERITY_TIP_RADIUS_UM = 5;
export const ASPERITY_HEIGHT_STD_UM = 2;
export const COMPOSITE_MODULUS_MPA = 200;
export const PAD_RELAXATION_TIME_S = 3;
export const GW_SEPARATIONS = 20;

export const KP_CU = 5e-14;
export const KP_BARRIER = 1e-14;
export const KP_OXIDE = 0.3e-14;

export const BARRIER_THICKNESS_NM = 25;

export const FRICTION_COEFF = 0.3;
export const THERMAL_MASS = 500;
export const AMBIENT_TEMP_C = 25;
export const ARRHENIUS_EA = 0.3;
export const KB_EV = 8.617e-5;

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

export const PHASE_CHEMISTRY = {
  'ramp-up':  { ph: 4,  kp: KP_CU,      pressureFactor: 0.5 },
  'bulk-cu':  { ph: 4,  kp: KP_CU,      pressureFactor: 1.0 },
  'barrier':  { ph: 10, kp: KP_BARRIER,  pressureFactor: 0.7 },
  'buff':     { ph: 10, kp: KP_OXIDE,    pressureFactor: 0.15 },
} as const;

export const PARAM_BOUNDS = {
  downForce:       { min: 1,    max: 10,   default: 3,    step: 0.5, unit: 'PSI' },
  waferRpm:        { min: 10,   max: 150,  default: 60,   step: 5,   unit: 'RPM' },
  platenRpm:       { min: 10,   max: 150,  default: 60,   step: 5,   unit: 'RPM' },
  slurryFlow:      { min: 50,   max: 500,  default: 200,  step: 10,  unit: 'mL/min' },
  abrasiveConc:    { min: 1,    max: 15,   default: 5,    step: 1,   unit: 'wt%' },
  slurryPh:        { min: 2,    max: 12,   default: 4,    step: 0.5, unit: '' },
  padStiffness:    { min: 10,   max: 100,  default: 50,   step: 5,   unit: 'MPa' },
  asperityDensity: { min: 100,  max: 2000, default: 500,  step: 50,  unit: '/mm\u00B2' },
  cuThickness:     { min: 500,  max: 2000, default: 1000, step: 50,  unit: 'nm' },
  patternDensity:  { min: 10,   max: 90,   default: 50,   step: 5,   unit: '%' },
  totalSteps:      { min: 50,   max: 400,  default: 200,  step: 10,  unit: 'steps' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  downForce:       PARAM_BOUNDS.downForce.default,
  waferRpm:        PARAM_BOUNDS.waferRpm.default,
  platenRpm:       PARAM_BOUNDS.platenRpm.default,
  slurryFlow:      PARAM_BOUNDS.slurryFlow.default,
  abrasiveConc:    PARAM_BOUNDS.abrasiveConc.default,
  slurryPh:        PARAM_BOUNDS.slurryPh.default,
  padStiffness:    PARAM_BOUNDS.padStiffness.default,
  asperityDensity: PARAM_BOUNDS.asperityDensity.default,
  cuThickness:     PARAM_BOUNDS.cuThickness.default,
  patternDensity:  PARAM_BOUNDS.patternDensity.default,
  totalSteps:      PARAM_BOUNDS.totalSteps.default,
};
