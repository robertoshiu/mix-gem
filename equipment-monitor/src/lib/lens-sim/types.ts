// equipment-monitor/src/lib/lens-sim/types.ts

/** Simulation input parameters (driven by sliders) */
export interface SimulationParams {
  dose: number;            // mJ/cm2
  scanSpeed: number;       // mm/s
  coolingPower: number;    // 0-1 (fraction)
  fluidFlowRate: number;   // L/min
  resistThickness: number; // nm
  ambientTemp: number;     // degC
}

/** Per-lens-element thermal state */
export interface LensElementState {
  index: number;       // 0=L1 (closest to wafer) .. 4=L5
  temperature: number; // degC
  deltaT: number;      // degC above ambient
  deltaOPL: number;    // nm optical path length change
}

/** Per-wafer exposure result */
export interface WaferState {
  waferIndex: number;           // 0-24
  elapsedTime: number;          // seconds since lot start
  lensElements: LensElementState[];
  zernikes: number[];           // Z1-Z16 coefficients (nm wavefront)
  cdMap: number[];              // per-die CD deviation (nm) - flat array, row-major
  overlayMap: number[];         // per-die overlay magnitude (nm)
  lerMap: number[];             // per-die LER 3sigma (nm)
  defectMap: number[];          // per-die defect count
  dieCount: number;             // number of dies
  dieGridCols: number;          // columns in die grid
  dieGridRows: number;          // rows in die grid
}

/** Full simulation state */
export interface SimulationState {
  params: SimulationParams;
  wafers: WaferState[];     // history for all exposed wafers so far
  currentIndex: number;     // 0-24
  lotSize: number;          // 25
}

/** Wafer metric layer for display */
export type WaferMetric = 'cd' | 'overlay' | 'ler' | 'defectivity';

/** What-if preset identifier */
export type PresetId = 'cooling-failure' | 'flow-drop' | 'dose-drift' | 'cold-start';

/** What-if preset definition */
export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams, waferIndex: number) => SimulationParams;
}

/** Defect type from immersion fluid */
export type DefectType = 'watermark' | 'bubble' | 'particle' | 'film-pull';

/** Fluid state at a given moment */
export interface FluidState {
  flowVelocity: number;      // m/s
  meniscusContactAngle: number; // degrees
  criticalScanSpeed: number; // mm/s
  bubbleProbability: number; // 0-1
  watermarkRisk: number;     // 0-1
  waterTemp: number;         // degC
}
