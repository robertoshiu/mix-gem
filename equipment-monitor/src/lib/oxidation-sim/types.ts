// ─── Enums & Unions ───
export type OxidationType = 'dry' | 'wet' | 'n2o' | 'pyrogenic' | 'hcl' | 'hibox';
export type GeometryType = 'blanket' | 'locos' | 'sti';
export type SubstrateOrientation = '100' | '110' | '111';
export type ThermalPhase = 'ramp' | 'soak' | 'cool';
export type MaterialType = 'Si' | 'SiO2' | 'Si3N4';

// ─── FEA Mesh ───
export interface FEANode {
  r: number;           // radial position (mm)
  z: number;           // depth position (nm)
  material: MaterialType;
  T: number;           // temperature (C)
  stress: number;      // von Mises stress (MPa)
  oxideThickness: number; // local oxide thickness (nm)
}

export interface FEAElement {
  nodes: [number, number, number, number]; // quad node indices
}

export interface FEAMesh {
  nodes: FEANode[];
  elements: FEAElement[];
  nr: number;
  nz: number;
}

// ─── Simulation Parameters (14 user-facing) ───
export interface SimulationParams {
  peakTemperature: number;
  rampRate: number;
  soakTime: number;
  coolingRate: number;
  oxidationType: OxidationType;
  geometryType: GeometryType;
  pressure: number;
  hclConcentration: number;
  initialOxideThickness: number;
  substrateOrientation: SubstrateOrientation;
  nitrideMaskWidth: number;
  trenchDepth: number;
  trenchWidth: number;
  lampBalance: number;
  totalSteps?: number;
}

// ─── Thermal Step ───
export interface ThermalStep {
  time: number;
  temperature: number;
  dt: number;
  phase: ThermalPhase;
}

// ─── Solver State (mutable, WeakMap cached) ───
export interface SolverState {
  mesh: FEAMesh;
  oxideThickness: number[];     // per-surface-node
  interfaceStress: number[];    // sigma_n at Si/SiO2 per surface node
  oxidationRate: number[];      // Q_oxidation source per surface node
  temperature: number;
  time: number;
  thermalBudget: number;
}

// ─── Per-Step Snapshot ───
export interface StepState {
  stepIndex: number;
  time: number;
  temperature: number;
  thermalPhase: ThermalPhase;
  oxideThicknessCenter: number;
  oxideThicknessMid: number;
  oxideThicknessEdge: number;
  temperatureCenter: number;
  temperatureMid: number;
  temperatureEdge: number;
  peakStress: number;
  birdBeakLength: number;
  oxidationRate: number;
  oxideUniformity: number;
  trenchCornerStress: number;
  thermalBudget: number;
  // Full field data for 3D scene
  nodeTemperatures: number[];
  nodeStresses: number[];
  nodeOxideThicknesses: number[];
}

// ─── Top-Level Simulation State (immutable) ───
export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
  thermalProfile: ThermalStep[];
  mesh: FEAMesh;
}

// ─── Metric Union ───
export type OxidationMetric =
  | 'oxideThickness'
  | 'temperature'
  | 'peakStress'
  | 'birdBeakLength'
  | 'oxidationRate'
  | 'oxideUniformity'
  | 'trenchCornerStress'
  | 'thermalBudget';

// ─── Preset Union ───
export type PresetId =
  | 'dry-gate-oxide'
  | 'wet-field-oxide'
  | 'pad-oxide'
  | 'locos-isolation'
  | 'sti-liner'
  | 'n2o-oxynitride'
  | 'pyrogenic-wet'
  | 'hcl-gettering'
  | 'hibox-thick'
  | 'thermal-stress-overshoot'
  | 'edge-nonuniformity'
  | 'ultra-thin-rto';

export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams) => SimulationParams;
}
