// equipment-monitor/src/lib/damascene-sim/types.ts

/** Process phase within the 200-step simulation */
export type ProcessPhase = 'ecd-fill' | 'anneal' | 'cmp';

/** Simulation input parameters (driven by sliders) */
export interface SimulationParams {
  appliedCurrent: number;      // mA/cm²
  bathTemp: number;            // °C
  additiveConc: number;        // normalized 0-1 (suppressor/accelerator health)
  seedThickness: number;       // nm
  trenchWidth: number;         // nm
  trenchDepth: number;         // nm
  padPressure: number;         // psi (CMP)
  padVelocity: number;         // m/s (CMP relative velocity)
  totalSteps: number;          // 200 default
}

/** Per-step simulation result */
export interface StepState {
  stepIndex: number;
  phase: ProcessPhase;
  timeSeconds: number;
  currentDensityMap: number[];  // per-die j (mA/cm²)
  fillProfile: number[];        // 20-point trench cross-section heights (0-1 normalized)
  fillFraction: number;         // 0-1 overall trench fill
  copperThickness: number;      // nm overburden above trench
  sheetResistance: number;      // ohm/sq
  viaResistance: number;        // ohm
  stepCoverage: number;         // %
  dishingDepth: number;         // nm (CMP only)
  thicknessMap: number[];       // per-die copper thickness (nm)
  resistanceMap: number[];      // per-die sheet resistance (ohm/sq)
  roughnessMap: number[];       // per-die surface roughness (nm RMS)
  uniformity: number;           // % 1-sigma/mean
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

/** Full simulation state */
export interface SimulationState {
  params: SimulationParams;
  steps: StepState[];
  currentIndex: number;         // -1 = not started
  totalSteps: number;
}

/** Wafer metric layer for display */
export type WaferMetric = 'sheetResistance' | 'viaResistance' | 'stepCoverage' | 'thickness';

/** What-if preset identifier */
export type PresetId =
  | 'current-crowding'
  | 'additive-depletion'
  | 'seed-thinning'
  | 'over-polish'
  | 'under-polish'
  | 'bath-temp-drift';

/** What-if preset definition */
export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams, stepIndex: number) => SimulationParams;
}
