// Lot
export type LotStatus = 'pending' | 'in_process' | 'on_hold' | 'completed';

export interface Lot {
  id: string;
  product: string;
  recipeId: string;
  waferCount: number;
  status: LotStatus;
  startedAt: Date;
}

// Recipe
export interface Recipe {
  id: string;
  name: string;
  process: string;
  chamber: string;
  exposure: number;   // mJ/cm²
  focus: number;      // nm offset
}

// SPC Measurement — one per wafer, all 5 parameters
export interface SpcMeasurement {
  id: string;
  lotId: string;
  waferNumber: number;
  timestamp: Date;
  cd: number;
  cdu: number;
  ovl_x: number;
  ovl_y: number;
  ler: number;
}

// SPC Violation
export type SpcRule = 'rule_1' | 'rule_2' | 'rule_5';
export type SpcParameter = 'cd' | 'cdu' | 'ovl_x' | 'ovl_y' | 'ler';

export interface SpcViolation {
  id: string;
  lotId: string;
  waferNumber: number;
  parameter: SpcParameter;
  rule: SpcRule;
  value: number;
  limit: number;
  acknowledged: boolean;
  timestamp: Date;
}

// SECS Event (display only)
export type SecsEventType =
  | 's6f11_spc_data'
  | 's2f41_stop'
  | 's2f42_ack'
  | 's2f41_resume'
  | 's2f49_recipe_push'
  | 's2f50_recipe_ack'
  | 's2f49_apply'
  | 's2f50_apply_ack'
  | 's2f49_override'
  | 's2f50_override_ack'
  | 's6f11_notification';

export interface SecsEvent {
  id: string;
  type: SecsEventType;
  label: string;
  timestamp: Date;
  secsMessage: Record<string, unknown>;
}

// Fault
export type FaultType =
  | 'sudden_shift'
  | 'gradual_drift'
  | 'increased_variance'
  | 'overlay_excursion'
  | 'focus_degradation';

export interface FaultConfig {
  type: FaultType;
  parameter: SpcParameter;
  severity: number;
  startedAtWafer: number;
}

// AI Recommendation
export type AiRecommendationType = 'energy' | 'predictive-maintenance' | 'production-optimization' | 'carbon-reduction' | 'quality' | 'scheduling';
export type AiRecommendationStatus = 'pending' | 'applied' | 'overridden';

export interface AiRecommendation {
  id: string;
  type: AiRecommendationType;
  title: string;
  description: string;
  confidence: number;  // 0-100
  impact: string;
  status: AiRecommendationStatus;
  createdAt: Date;
}

// Notification
export type NotificationSeverity = 'critical' | 'warning' | 'info';
export type NotificationType = 'violation' | 'lot_status' | 'equipment_state' | 'recipe' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// MES UI Reconstruction — Yield & Defect
export interface YieldTrendPoint {
  date: string;
  overallYield: number;
  targetYield: number;
}

export interface DefectRecord {
  type: string;
  count: number;
  cumulativePercent: number;
}

export interface WaferDie {
  row: number;
  col: number;
  status: 'pass' | 'fail' | 'retest' | 'not_tested';
}

export interface ProcessStepYield {
  name: string;
  yield: number;
  status: 'running' | 'warning' | 'alarm';
}

export interface HeatmapCell {
  lot: string;
  param: string;
  value: number;
  status: 'ok' | 'warning' | 'alarm';
}

export type ConfidenceLevel = number; // 0-100

// Equipment (for fab floor map)
export type EquipmentType = 'lithography' | 'coater' | 'developer' | 'metrology' | 'cmp';
export type EquipmentStatus = 'running' | 'idle' | 'down';

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  x: number;
  y: number;
  zone: string;
  powerKw: number;
  recipe: string;
  currentWafer: number;
  totalWafers: number;
}
