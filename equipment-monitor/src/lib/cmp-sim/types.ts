export type ProcessPhase = 'ramp-up' | 'bulk-cu' | 'barrier' | 'buff';

export interface SimulationParams {
  downForce: number;        // PSI (1-10)
  waferRpm: number;         // RPM (10-150)
  platenRpm: number;        // RPM (10-150)
  slurryFlow: number;       // mL/min (50-500)
  abrasiveConc: number;     // wt% (1-15)
  slurryPh: number;         // pH (2-12)
  padStiffness: number;     // MPa (10-100)
  asperityDensity: number;  // 1/mm^2 (100-2000)
  cuThickness: number;      // nm (500-2000)
  patternDensity: number;   // % (10-90)
  totalSteps: number;
}

export interface StepState {
  stepIndex: number;
  phase: ProcessPhase;
  timeSeconds: number;
  filmThickness: number[];
  fluidPressure: number[];
  realContactArea: number;
  padCreepStrain: number;
  contactPressure: number[];
  removalRate: number;
  cuRemaining: number;
  barrierRemaining: number;
  removalRateMap: number[];
  wiwnuMap: number[];
  dishingMap: number[];
  erosionMap: number[];
  roughnessMap: number[];
  thicknessMap: number[];
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
}

export type WaferMetric = 'removalRate' | 'wiwnu' | 'dishing' | 'erosion' | 'roughness' | 'thickness';

export type PresetId =
  | 'slurry-starvation'
  | 'pad-glazing'
  | 'over-polish'
  | 'downforce-imbalance'
  | 'retaining-ring-wear'
  | 'slurry-ph-drift'
  | 'hydroplaning'
  | 'pattern-density';

export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams, stepIndex: number) => SimulationParams;
}
