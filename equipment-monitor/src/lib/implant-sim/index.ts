export { createSimulation, stepForward, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export {
  DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_STEPS,
  DEPTH_BINS, ION_DB, MATERIAL_DB, DEFAULT_ION_COUNT,
} from './constants';
export type {
  SimulationParams,
  SimulationState,
  StepState,
  IonTrajectory,
  Vec3,
  CollisionEvent,
  LayerDef,
  ImplantMetric,
  PresetId,
  Preset,
  IonSpecies,
  CrystalOrientation,
  TargetMaterial,
} from './types';
