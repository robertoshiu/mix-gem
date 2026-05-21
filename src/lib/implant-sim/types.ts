export type IonSpecies = 'B' | 'P' | 'As' | 'BF2';
export type CrystalOrientation = '100' | '110' | '111';
export type TargetMaterial = 'Si' | 'SiO2' | 'photoresist';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CollisionEvent {
  position: Vec3;
  energyTransfer: number;
  isDisplacement: boolean;
  recoilCreated: boolean;
}

export interface IonTrajectory {
  points: Vec3[];
  collisions: CollisionEvent[];
  finalPosition: Vec3;
  recoilCascades: Vec3[][];
  channeled: boolean;
  backscattered: boolean;
  energyAtPoints: number[];
}

export interface LayerDef {
  material: TargetMaterial;
  startNm: number;
  endNm: number;
}

export interface SimulationParams {
  ionSpecies: IonSpecies;
  beamEnergy: number;
  dose: number;
  beamCurrent: number;
  tiltAngle: number;
  twistAngle: number;
  crystalOrientation: CrystalOrientation;
  screenOxideThickness: number;
  photoresistThickness: number;
  substrateTemperature: number;
  amorphizationThreshold: number;
  damageAnnealingRate: number;
  totalSteps: number;
}

export interface StepState {
  stepIndex: number;
  ionsSimulated: number;
  totalIons: number;
  trajectories: IonTrajectory[];
  depthProfile: number[];
  damageProfile: number[];
  lateralProfile: number[];
  amorphousMap: boolean[];
  layers: LayerDef[];
  maxDepthNm: number;
  projectedRange: number;
  straggle: number;
  junctionDepth: number;
  peakConcentration: number;
  channelingTailDepth: number;
  damagePeakDensity: number;
  lateralStraggle: number;
  retainedDoseFraction: number;
}

export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;
  totalSteps: number;
}

export type ImplantMetric =
  | 'projectedRange'
  | 'straggle'
  | 'junctionDepth'
  | 'peakConcentration'
  | 'channelingTailDepth'
  | 'damagePeakDensity'
  | 'lateralStraggle'
  | 'retainedDoseFraction';

export type PresetId =
  | 'channeling-implant'
  | 'high-dose-amorphization'
  | 'implant-through-oxide'
  | 'shallow-junction'
  | 'retrograde-well'
  | 'dose-rate-heating'
  | 'resist-punch-through'
  | 'pre-amorphization'
  | 'twin-well-cmos'
  | 'high-tilt-halo';

export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams) => SimulationParams;
}
