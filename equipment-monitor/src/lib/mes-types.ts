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
  | 's2f50_recipe_ack';

export interface SecsEvent {
  id: string;
  type: SecsEventType;
  label: string;
  timestamp: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  secsMessage: Record<string, any>;
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
