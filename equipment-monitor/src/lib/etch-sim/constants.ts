import type { SimulationParams } from './types';

export const STRIKE_END = 40;
export const MAIN_ETCH_END = 160;
export const DEFAULT_TOTAL_STEPS = 200;

export const IONIZATION_EFFICIENCY = 1e15;
export const CHAMBER_VOLUME = 5000;
export const ELECTRON_TEMP_EV = 3.0;
export const CF4_ION_MASS_KG = 69 * 1.66e-27;
export const ELECTRON_CHARGE = 1.602e-19;
export const BOLTZMANN_J = 1.381e-23;

export const ION_THERMAL_EV = 0.03;

export const ETCH_PROFILE_POINTS = 20;

export const ETCH_ACTIVATION_ENERGY = 0.3;
export const KB_EV = 8.617e-5;
export const ETCH_REF_TEMP = 40;
export const BASE_SELECTIVITY = 15;
export const BASE_ROUGHNESS = 0.5;

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

export const PARAM_BOUNDS = {
  icpPower:        { min: 200,  max: 2000, default: 800,  step: 50,  unit: 'W' },
  biasPower:       { min: 0,    max: 500,  default: 100,  step: 10,  unit: 'W' },
  chamberPressure: { min: 1,    max: 100,  default: 15,   step: 1,   unit: 'mTorr' },
  cf4Flow:         { min: 10,   max: 200,  default: 80,   step: 5,   unit: 'sccm' },
  o2Flow:          { min: 0,    max: 100,  default: 20,   step: 5,   unit: 'sccm' },
  chuckTemp:       { min: 10,   max: 80,   default: 40,   step: 1,   unit: '\u00B0C' },
  trenchWidth:     { min: 20,   max: 500,  default: 100,  step: 10,  unit: 'nm' },
  aspectRatio:     { min: 1,    max: 20,   default: 5,    step: 1,   unit: '' },
  totalSteps:      { min: 50,   max: 400,  default: 200,  step: 10,  unit: 'steps' },
} as const;

export const DEFAULT_PARAMS: SimulationParams = {
  icpPower:        PARAM_BOUNDS.icpPower.default,
  biasPower:       PARAM_BOUNDS.biasPower.default,
  chamberPressure: PARAM_BOUNDS.chamberPressure.default,
  cf4Flow:         PARAM_BOUNDS.cf4Flow.default,
  o2Flow:          PARAM_BOUNDS.o2Flow.default,
  chuckTemp:       PARAM_BOUNDS.chuckTemp.default,
  trenchWidth:     PARAM_BOUNDS.trenchWidth.default,
  aspectRatio:     PARAM_BOUNDS.aspectRatio.default,
  totalSteps:      PARAM_BOUNDS.totalSteps.default,
};
