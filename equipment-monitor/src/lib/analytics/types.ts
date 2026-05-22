// src/lib/analytics/types.ts

// ── Shared ──
export type AnalyticsTab = 'vpp' | 'apc' | 'yield' | 'reliability' | 'optimization' | 'replication';

export type ProcessStepId = 'oxidation' | 'lithography' | 'etching' | 'deposition' | 'implant' | 'diffusion' | 'cmp' | 'metallization';

// ── Yield Forecast ──
export interface StepYield {
  stepId: ProcessStepId;
  d0: number;
  yield: number;
  yieldLoss: number;
}

export interface YieldResult {
  perStep: StepYield[];
  lineYield: number;
  worstStep: ProcessStepId;
}

export interface YieldWaterfallPoint {
  stepId: ProcessStepId;
  cumulative: number;
}

export interface YieldCurvePoint {
  d0: number;
  yield: number;
}

// ── APC R2R ──
export interface EwmaState {
  level: number;
  slope: number;
  correction: number;
  forecast: number;
}

export interface ApcRunResult {
  run: number;
  controlled: number;
  uncontrolled: number;
  ewmaLevel: number;
  ewmaSlope: number;
  correction: number;
  drift: number;
}

export type DriftType = 'none' | 'linear' | 'sinusoidal' | 'step-shift' | 'mixed';

export interface DriftConfig {
  type: DriftType;
  slope?: number;
  amplitude?: number;
  period?: number;
  magnitude?: number;
  triggerRun?: number;
}

export interface ApcConfig {
  target: number;
  lambda: number;
  lambdaSlope: number;
  noise: number;
}

export interface ResidualStats {
  mean: number;
  std: number;
  cpk: number;
  histogram: { bin: number; count: number }[];
}

// ── Reliability ──
export type RbdTopology = 'series' | 'parallel' | 'series-parallel';

export interface Subsystem {
  id: ProcessStepId;
  name: string;
  lambda: number;
  mu: number;
  k?: number;
  n?: number;
}

export interface RbdResult {
  systemAvail: number;
  subsystemAvails: { id: ProcessStepId; availability: number }[];
  bottleneck: ProcessStepId;
  systemMtbf: number;
}

export interface LifeProjectionPoint {
  tempC: number;
  arrhenius: number;
  eyring: number;
}

// ── Cross-Process Optimization ──
export type ObjectiveId = 'yield' | 'throughput' | 'cost' | 'defectDensity';
export type ObjectiveDirection = 'maximize' | 'minimize';

export interface Objective {
  id: ObjectiveId;
  direction: ObjectiveDirection;
}

export interface RecipeKnob {
  stepId: ProcessStepId;
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
}

export interface ParetoPoint {
  objectives: Record<ObjectiveId, number>;
  recipe: number[];
  dominated: boolean;
}

export interface RsmFit {
  coefficients: number[];
  rSquared: number;
}

export interface SensitivityBar {
  stepId: ProcessStepId;
  label: string;
  impact: number;
}

export interface ConstraintSet {
  minYield?: number;
  maxD0?: number;
  minThroughput?: number;
  maxCost?: number;
}

// ── Multi-Fab Replication ──
export type FabId = 'hq' | 'satellite' | 'new-build';

export interface FabConfig {
  id: FabId;
  name: string;
  location: string;
  maturity: 'Mature' | 'Established' | 'Ramping';
  bias: number;
  spreadFactor: number;
}

export interface TostResult {
  fab1: FabId;
  fab2: FabId;
  meanDiff: number;
  ciLower: number;
  ciUpper: number;
  equivalenceLower: number;
  equivalenceUpper: number;
  pass: boolean;
}

export interface TransferFit {
  fromFab: FabId;
  toFab: FabId;
  coefficients: number[];
  rSquared: number;
  bias: number;
}

export interface DistributionCurvePoint {
  x: number;
  pdf: number;
}

export type ReplicationParam = 'cd' | 'overlay' | 'thickness' | 'dose' | 'etchDepth' | 'implantDepth' | 'diffusionDepth' | 'cmpRemoval';

// ── VPP ──
export interface PipelineStep {
  stepId: ProcessStepId;
  presetName: string;
  overrides: Record<string, number>;
}

export interface PipelineStepResult {
  stepId: ProcessStepId;
  yield: number;
  thickness: number;
  stress: number;
  defectDensity: number;
}

export interface FilmLayer {
  material: string;
  thickness: number;
  color: string;
}

export interface PipelineResult {
  perStep: PipelineStepResult[];
  filmStack: FilmLayer[];
  cumulativeYield: number;
}

// ── VPP Accordion Panels ──
export type SubstrateType = 'Si(100)' | 'Si(111)' | 'SiGe' | 'SOI';
export type StressMode = 'biaxial' | 'plane-stress' | 'plane-strain';
export type DefectSource = 'particles' | 'scratches' | 'voids' | 'inclusions';
export type DopantSpeciesId = 'B' | 'P' | 'As' | 'Sb' | 'In' | 'Ga';

export interface StressLayerResult {
  stepId: ProcessStepId;
  material: string;
  intrinsicStress: number;
  thermalStress: number;
  totalStress: number;
  thickness: number;
}

export interface StressProfileResult {
  layers: StressLayerResult[];
  netStress: number;
  waferBow: number;
  cumulativeStress: { depth: number; stress: number }[];
}

export interface DefectSourceBreakdown {
  source: DefectSource;
  density: number;
  killerDensity: number;
  color: string;
}

export interface DefectStepResult {
  stepId: ProcessStepId;
  totalD0: number;
  killerD0: number;
  sources: DefectSourceBreakdown[];
  yieldImpact: number;
}

export interface DefectMapResult {
  perStep: DefectStepResult[];
  totalD0: number;
  totalKillerD0: number;
  totalYieldImpact: number;
  paretoPoints: { stepId: ProcessStepId; cumPct: number }[];
  waferDots: { x: number; y: number; source: DefectSource }[];
}

export interface DopantProfilePoint {
  depth: number;
  concentration: number;
  activeConcentration: number;
}

export interface DopantSpeciesResult {
  species: DopantSpeciesId;
  profile: DopantProfilePoint[];
  peakConcentration: number;
  junctionDepth: number;
  dose: number;
  color: string;
}

export interface DopantProfileResult {
  species: DopantSpeciesResult[];
  backgroundDoping: number;
}

export interface ThermalBudgetStep {
  stepId: ProcessStepId;
  temperature: number;
  time: number;
  dt: number;
  cumulativeDt: number;
}
