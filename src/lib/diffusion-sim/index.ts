export { createSimulation, stepForward, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export {
  DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_STEPS,
  DEPTH_BINS, DOPANT_DB, THERMAL_MODES,
} from './constants';
export type {
  SimulationParams,
  SimulationState,
  StepState,
  ThermalStep,
  SolverState,
  PointDefectState,
  LayerDef,
  DiffusionMetric,
  PresetId,
  Preset,
  DopantSpecies,
  ThermalMode,
  AmbientGas,
  SubstrateOrientation,
  ThermalPhase,
} from './types';
