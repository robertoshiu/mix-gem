import { Equipment, ProcessParameter, TrendDataPoint, Alarm } from "@/types/equipment";

export const mockEquipment: Equipment[] = [
  {
    id: "litho01",
    name: "LITHO01",
    type: "litho",
    status: "normal",
    currentRecipe: "L42-CONTACT",
    waferCount: 847,
    lastUpdate: new Date(),
  },
  {
    id: "litho02",
    name: "LITHO02",
    type: "litho",
    status: "warning",
    currentRecipe: "L42-METAL1",
    waferCount: 423,
    lastUpdate: new Date(),
  },
  {
    id: "track01",
    name: "TRACK01",
    type: "track",
    status: "normal",
    currentRecipe: "COAT-STD",
    waferCount: 1205,
    lastUpdate: new Date(),
  },
  {
    id: "etch01",
    name: "ETCH01",
    type: "etch",
    status: "alarm",
    currentRecipe: "POLY-ETCH",
    waferCount: 156,
    lastUpdate: new Date(),
  },
  {
    id: "cvd01",
    name: "CVD01",
    type: "cvd",
    status: "idle",
    currentRecipe: null,
    waferCount: 0,
    lastUpdate: new Date(),
  },
  {
    id: "pvd01",
    name: "PVD01",
    type: "pvd",
    status: "offline",
    currentRecipe: null,
    waferCount: 0,
    lastUpdate: new Date(),
  },
];

export const mockParameters: ProcessParameter[] = [
  { name: "Focus Offset", value: 2.3, unit: "nm", lsl: -10, usl: 10, timestamp: new Date() },
  { name: "CDU", value: 4.2, unit: "nm", lsl: 0, usl: 5, timestamp: new Date() },
  { name: "Overlay", value: 1.8, unit: "nm", lsl: 0, usl: 3, timestamp: new Date() },
  { name: "Dose", value: 15.2, unit: "mJ", lsl: 14, usl: 16, timestamp: new Date() },
];

export function generateTrendData(
  hours: number,
  baseValue: number,
  variance: number
): TrendDataPoint[] {
  const points: TrendDataPoint[] = [];
  const now = Date.now();
  const interval = (hours * 60 * 60 * 1000) / 60; // 60 data points

  for (let i = 60; i >= 0; i--) {
    const timestamp = now - i * interval;
    const noise = (Math.random() - 0.5) * variance * 2;
    const trend = Math.sin(i / 10) * variance * 0.3; // Slow drift
    points.push({
      timestamp,
      value: baseValue + noise + trend,
    });
  }

  return points;
}

export const mockAlarms: Alarm[] = [
  {
    id: "alarm-1",
    equipmentId: "etch01",
    severity: "alarm",
    message: "Chamber pressure out of spec (847 mTorr)",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: "alarm-2",
    equipmentId: "litho02",
    severity: "warning",
    message: "Focus offset approaching limit (+8.2 nm)",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: "alarm-3",
    equipmentId: "litho01",
    severity: "warning",
    message: "CDU trending upward",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    acknowledged: true,
  },
];
