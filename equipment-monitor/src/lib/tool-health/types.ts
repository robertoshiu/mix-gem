// ── Tool Performance ──
export interface ToolPerformanceTrend {
  hour: number;
  oee: number;
  availability: number;
  utilization: number;
}

export interface ToolPerformance {
  equipmentId: string;
  oee: number;
  availability: number;
  utilization: number;
  trend24h: ToolPerformanceTrend[];
}

// ── PM Schedule ──
export type PmEventType = 'scheduled' | 'unscheduled' | 'completed';

export interface PmEvent {
  id: string;
  type: PmEventType;
  date: string;
  durationHours: number;
  description: string;
}

export interface PmSchedule {
  equipmentId: string;
  nextPmDate: string;
  pmIntervalDays: number;
  lastPmDate: string;
  history: PmEvent[];
}

// ── MTBF Prediction (Weibull) ──
export interface WeibullPoint {
  hours: number;
  probability: number;
}

export interface MtbfPrediction {
  equipmentId: string;
  mtbfHours: number;
  currentAgeHours: number;
  failureProbability: number;
  weibullShape: number;
  weibullScale: number;
  survivalCurve: WeibullPoint[];
}

// ── FDC ──
export type FdcParamId = 'pressure' | 'rfPower' | 'temperature' | 'gasFlow1' | 'gasFlow2' | 'biasVoltage';
export type FdcAnomalyType = 'drift' | 'spike' | 'oscillation' | 'step-shift';

export interface FdcParam {
  id: FdcParamId;
  label: string;
  unit: string;
  setpoint: number;
  fdcUpper: number;
  fdcLower: number;
}

export interface FdcSample {
  t: number;
  value: number;
  anomaly: boolean;
}

export interface FdcTrace {
  chamberId: string;
  paramId: FdcParamId;
  samples: FdcSample[];
}

// ── Chamber Matching ──
export interface ChamberMatchStat {
  chamberId: string;
  chamberName: string;
  paramId: FdcParamId;
  mean: number;
  sigma: number;
  min: number;
  max: number;
  n: number;
}
