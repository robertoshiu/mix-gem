// SEMI E30 GEM-aligned equipment status
export type EquipmentStatus =
  | "process"    // Actively processing wafers
  | "idle"       // Available but not processing
  | "warning"    // Minor issue, can continue
  | "alarm"      // Serious issue, stopped
  | "offline"    // Scheduled maintenance
  | "pm";        // Preventive maintenance

// SEMI E5 SECS-II aligned equipment types
export type EquipmentType =
  | "scanner"    // Lithography scanner (DUV/EUV)
  | "track"      // Coat/develop track
  | "etch"       // Dry etch system
  | "cvd"        // Chemical vapor deposition
  | "pvd"        // Physical vapor deposition
  | "metrology"; // CD-SEM, overlay, etc.

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  model: string;           // Equipment model identifier
  module?: string;         // Active module (e.g., "wafer_stage", "chamber_A")
  status: EquipmentStatus;
  currentRecipe: string | null;
  lotId: string | null;    // Current lot being processed
  waferCount: number;
  lastUpdate: Date;
}

export interface ProcessParameter {
  name: string;
  value: number;
  unit: string;
  nominal: number;  // Target/expected value
  lsl: number;      // Lower Spec Limit
  usl: number;      // Upper Spec Limit
  tolerance: number; // Acceptable deviation from nominal
  timestamp: Date;
}

// SEMI E30 GEM-aligned alarm severity levels
export type AlarmSeverity = "CRITICAL" | "MAJOR" | "MINOR" | "INFO";

export interface Alarm {
  id: string;
  alarmId: number;         // ALID - numeric alarm identifier
  alarmCode: string;       // ALCD - equipment-specific code
  equipmentId: string;
  module?: string;
  severity: AlarmSeverity;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  // Context parameters at alarm time
  contextParams?: ContextParameter[];
  // Root cause hypothesis
  rootCause?: RootCauseHypothesis;
}

export interface ContextParameter {
  name: string;
  value: number;
  unit: string;
  nominal: number;
  tolerance: number;
}

export interface RootCauseHypothesis {
  cause: string;
  probability: "high" | "medium" | "low";
  evidence: string;
  containmentAction?: string;
  correctiveAction?: string;
}

export interface TrendDataPoint {
  timestamp: number;
  value: number;
}
