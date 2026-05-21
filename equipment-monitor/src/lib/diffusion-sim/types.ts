// ─── Enums & Unions ───
export type DopantSpecies = 'B' | 'P' | 'As' | 'Sb' | 'In' | 'Ge';
export type ThermalMode = 'furnace' | 'rta' | 'spike' | 'flash' | 'laser';
export type AmbientGas = 'N2' | 'O2' | 'N2O2';
export type SubstrateOrientation = '100' | '110' | '111';
export type ThermalPhase = 'ramp' | 'soak' | 'cool' | 'pulse';

// ─── Layer definition ───
export interface LayerDef {
  material: 'Si' | 'SiO2';
  startNm: number;
  endNm: number;
}

// ─── Thermal step ───
export interface ThermalStep {
  time: number;
  temperature: number;
  tempProfile: number[];
  dt: number;
  phase: ThermalPhase;
}

// ─── Point defect state ───
export interface PointDefectState {
  vacancies: number[];
  interstitials: number[];
  defect311: number[];
}

// ─── Solver state (mutable, cached via WeakMap) ───
export interface SolverState {
  dopantProfile: number[];
  activeProfile: number[];
  clusteredProfile: number[];
  defects: PointDefectState;
  carrierProfile: number[];
  temperature: number;
  time: number;
  thermalBudget: number;
}

// ─── Simulation parameters (14 user-facing) ───
export interface SimulationParams {
  peakTemperature: number;
  rampRate: number;
  soakTime: number;
  coolingRate: number;
  dopantSpecies: DopantSpecies;
  thermalMode: ThermalMode;
  ambientGas: AmbientGas;
  initialDose: number;
  initialDepth: number;
  screenOxideThickness: number;
  substrateOrientation: SubstrateOrientation;
  backgroundDoping: number;
  interstitialFactor: number;
  vacancyFactor: number;
  clusteringThreshold: number;
  totalSteps?: number;
}

// ─── Per-step snapshot ───
export interface StepState {
  stepIndex: number;
  time: number;
  temperature: number;
  thermalPhase: ThermalPhase;
  dopantProfile: number[];
  activeProfile: number[];
  clusteredProfile: number[];
  interstitialProfile: number[];
  vacancyProfile: number[];
  carrierProfile: number[];
  temperatureProfile: number[];
  junctionDepth: number;
  sheetResistance: number;
  peakConcentration: number;
  thermalBudget: number;
  activationFraction: number;
  interstitialSupersaturation: number;
  profileAbruptness: number;
  segregationRatio: number;
  vacancyConcentration: number;
  diffusionLength: number;
  maxDepthNm: number;
  layers: LayerDef[];
}

// ─── Top-level simulation state (immutable) ───
export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
  thermalProfile: ThermalStep[];
}

// ─── Metric union ───
export type DiffusionMetric =
  | 'junctionDepth'
  | 'sheetResistance'
  | 'peakConcentration'
  | 'thermalBudget'
  | 'activationFraction'
  | 'interstitialSupersaturation'
  | 'profileAbruptness'
  | 'segregationRatio'
  | 'vacancyConcentration'
  | 'diffusionLength';

// ─── Preset union ───
export type PresetId =
  | 'furnace-drive-in'
  | 'rta-activation'
  | 'spike-anneal'
  | 'flash-anneal'
  | 'laser-anneal'
  | 'ted-showcase'
  | 'oed-effect'
  | 'retrograde-well'
  | 'dopant-pile-up'
  | 'high-conc-clustering'
  | 'co-diffusion'
  | 'thermal-budget-overshoot';

export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams) => SimulationParams;
}
