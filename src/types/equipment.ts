export type EquipmentStatus = "normal" | "warning" | "alarm" | "idle" | "offline";

export interface Equipment {
  id: string;
  name: string;
  type: "litho" | "track" | "etch" | "cvd" | "pvd";
  status: EquipmentStatus;
  currentRecipe: string | null;
  waferCount: number;
  lastUpdate: Date;
}

export interface ProcessParameter {
  name: string;
  value: number;
  unit: string;
  lsl: number;  // Lower Spec Limit
  usl: number;  // Upper Spec Limit
  timestamp: Date;
}

export interface Alarm {
  id: string;
  equipmentId: string;
  severity: "warning" | "alarm";
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface TrendDataPoint {
  timestamp: number;
  value: number;
}
