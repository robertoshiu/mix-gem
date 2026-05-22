export { createSimulation, stepForward, stepN, applyPreset } from './simulation-engine';
export { PRESETS, getPreset } from './presets';
export {
  DEFAULT_PARAMS, PARAM_BOUNDS, DEFAULT_TOTAL_STEPS,
  MATERIAL_PROPS, getDealGroveCoeffs, ORIENTATION_FACTOR,
} from './constants';
export type {
  SimulationParams,
  SimulationState,
  StepState,
  SolverState,
  FEAMesh,
  FEANode,
  FEAElement,
  ThermalStep,
  OxidationMetric,
  PresetId,
  Preset,
  OxidationType,
  GeometryType,
  SubstrateOrientation,
  ThermalPhase,
  MaterialType,
} from './types';
