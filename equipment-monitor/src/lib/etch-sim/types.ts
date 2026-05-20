export type ProcessPhase = 'strike' | 'main-etch' | 'over-etch';

export interface SimulationParams {
  icpPower: number;
  biasPower: number;
  chamberPressure: number;
  cf4Flow: number;
  o2Flow: number;
  chuckTemp: number;
  trenchWidth: number;
  aspectRatio: number;
  totalSteps: number;
}

export interface StepState {
  stepIndex: number;
  phase: ProcessPhase;
  timeSeconds: number;
  electronDensity: number;
  ionFlux: number;
  ionEnergy: number;
  sheathPotential: number;
  etchProfile: number[];
  etchDepth: number;
  etchRate: number;
  selectivity: number;
  cdBias: number;
  profileAngle: number;
  etchRateMap: number[];
  uniformityMap: number[];
  cdBiasMap: number[];
  roughnessMap: number[];
  uniformity: number;
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

export type WaferMetric = 'etchRate' | 'selectivity' | 'cdBias' | 'profileAngle';

export type PresetId =
  | 'plasma-nonuniformity'
  | 'ion-bombardment'
  | 'micro-loading'
  | 'polymer-buildup'
  | 'selectivity-loss'
  | 'endpoint-drift';

export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams, stepIndex: number) => SimulationParams;
}
