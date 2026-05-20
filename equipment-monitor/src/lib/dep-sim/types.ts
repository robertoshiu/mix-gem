// equipment-monitor/src/lib/dep-sim/types.ts

/** ALD cycle phase */
export type CyclePhase = 'bdeas-pulse' | 'purge-a' | 'o3-pulse' | 'purge-b';

/** Simulation input parameters (driven by sliders) */
export interface SimulationParams {
  bdeasFlowRate: number;     // sccm
  bdeasPulseTime: number;    // seconds
  o3FlowRate: number;        // sccm
  o3PulseTime: number;       // seconds
  purgeTime: number;         // seconds
  pedestalTemp: number;      // degC
  chamberPressure: number;   // Torr
  carrierGasFlow: number;    // sccm (N2)
  totalCycles: number;       // target cycle count (e.g. 200)
}

/** Per-cycle simulation result */
export interface CycleState {
  cycleIndex: number;
  phase: CyclePhase;
  coverageA: number;            // BDEAS surface coverage (0-1)
  coverageB: number;            // O3 oxidation coverage (0-1)
  gpc: number;                  // Angstrom this cycle
  cumulativeThickness: number;  // Angstrom total
  thicknessMap: number[];       // per-die thickness (Angstrom)
  roughnessMap: number[];       // per-die roughness (Angstrom RMS)
  riMap: number[];              // per-die refractive index
  uniformity: number;           // % 1-sigma/mean
  dieCount: number;
  dieGridCols: number;
  dieGridRows: number;
}

/** Full simulation state */
export interface SimulationState {
  params: SimulationParams;
  cycles: CycleState[];       // history for all completed cycles
  currentIndex: number;       // -1 = not started, 0..N
  totalCycles: number;        // target
}

/** Wafer metric layer for display */
export type WaferMetric = 'thickness' | 'uniformity' | 'roughness' | 'ri';

/** What-if preset identifier */
export type PresetId =
  | 'precursor-starvation'
  | 'purge-leak-through'
  | 'temperature-excursion'
  | 'o3-degradation'
  | 'chamber-seasoning';

/** What-if preset definition */
export interface Preset {
  id: PresetId;
  label: string;
  labelCN: string;
  color: string;
  apply: (params: SimulationParams, cycleIndex: number) => SimulationParams;
}

/** Reactor flow state */
export interface FlowState {
  residenceTime: number;          // seconds
  effectiveO3Fraction: number;    // 0-1 (after thermal decomposition)
  purgeEfficiency: number;        // 0-1 (1 = perfect purge)
  residualFraction: number;       // 0-1 (leftover precursor after purge)
}

/** Thermal regime classification */
export type ThermalRegime = 'condensation' | 'ald-window' | 'decomposition';
