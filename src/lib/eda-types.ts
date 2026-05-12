export type EdaStage =
  | 'rtl'
  | 'synthesis'
  | 'floorplan'
  | 'place_route'
  | 'cts'
  | 'sta'
  | 'drc_lvs'
  | 'tapeout';

export type StageStatus = 'queued' | 'running' | 'completed' | 'failed' | 'warning';
export type TechNode = '3nm' | '5nm' | '7nm';
export type FaultType =
  | 'timing_closure_fail'
  | 'congestion_hotspot'
  | 'drc_storm'
  | 'power_budget_exceeded';

export type LogLevel = 'info' | 'warning' | 'error' | 'milestone';

export interface LogEntry {
  id: string;
  timestamp: number;
  stage: EdaStage;
  level: LogLevel;
  message: string;
}

export interface RtlMetrics {
  kind: 'rtl';
  lineCount: number;
  moduleCount: number;
  lintWarnings: number;
  coverage: number;
}

export interface SynthesisMetrics {
  kind: 'synthesis';
  gateCount: number;
  area: number;
  maxFreq: number;
  power: number;
  slack: number;
}

export interface FloorplanMetrics {
  kind: 'floorplan';
  dieArea: number;
  utilization: number;
  macroCount: number;
  aspectRatio: number;
}

export interface PlaceRouteMetrics {
  kind: 'place_route';
  cellCount: number;
  routedNets: number;
  wireLength: number;
  congestion: number;
  drcViolations: number;
}

export interface CtsMetrics {
  kind: 'cts';
  clockSkew: number;
  bufferCount: number;
  insertionDelay: number;
  powerOverhead: number;
}

export interface StaMetrics {
  kind: 'sta';
  wns: number;
  tns: number;
  failingPaths: number;
  holdViolations: number;
}

export interface DrcLvsMetrics {
  kind: 'drc_lvs';
  drcErrors: number;
  lvsMismatches: number;
  antennaViolations: number;
  densityViolations: number;
}

export interface TapeoutMetrics {
  kind: 'tapeout';
  gdsSize: number;
  layerCount: number;
  metalFill: number;
  maskCount: number;
}

export type StageMetrics =
  | RtlMetrics
  | SynthesisMetrics
  | FloorplanMetrics
  | PlaceRouteMetrics
  | CtsMetrics
  | StaMetrics
  | DrcLvsMetrics
  | TapeoutMetrics;

export interface MetricSample {
  tick: number;
  stage: EdaStage;
  primary: number;
  cpu: number;
  memory: number;
  diskIo: number;
}

export interface StageState {
  stage: EdaStage;
  status: StageStatus;
  progress: number;
  startedAt: number | null;
  metrics: StageMetrics;
  logs: LogEntry[];
  artifacts: string[];
  samples: MetricSample[];
  retries: number;
}

export interface PipelineRun {
  id: string;
  chipName: string;
  techNode: TechNode;
  stages: StageState[];
  currentStage: EdaStage | null;
  elapsedMs: number;
  tick: number;
  running: boolean;
  speed: SimulatorSpeed;
}

export type SimulatorSpeed = 1 | 2 | 5 | 10;

export interface SimulatorConfig {
  chipName: string;
  techNode: TechNode;
  fault?: { type: FaultType; stage: EdaStage } | null;
  seed?: number;
}

export interface StageDefinition {
  stage: EdaStage;
  label: string;
  shortLabel: string;
  tool: string;
  artifact: string;
  baseTicks: number;
  color: string;
  primaryMetricLabel: string;
  primaryMetricUnit: string;
  warningLimit?: number;
  criticalLimit?: number;
}
