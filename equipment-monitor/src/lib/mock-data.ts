/**
 * Synthetic Mock Data for Equipment Monitor Dashboard
 *
 * DISCLAIMER: All data is synthetic and illustrative only.
 * Values are physics-based estimates for semiconductor lithography processes.
 * No proprietary fab data or real equipment identifiers are used.
 *
 * References:
 * - SEMI E30 GEM Standard for alarm severity levels
 * - SEMI E5 SECS-II for equipment status mapping
 * - Industry-typical process window ranges for DUV/EUV lithography
 */

import {
  Equipment,
  ProcessParameter,
  TrendDataPoint,
  Alarm,
  AlarmSeverity,
} from "@/types/equipment";

const MOCK_NOW = new Date("2026-05-13T04:00:00.000Z").getTime();

// ============================================================================
// EQUIPMENT DEFINITIONS
// ============================================================================

export const mockEquipment: Equipment[] = [
  {
    id: "scanner-01",
    name: "SCANNER-01",
    type: "scanner",
    model: "NXE_3600D",
    module: "wafer_stage",
    status: "process",
    currentRecipe: "METAL1_EUV_N5",
    lotId: "SYN_LOT_A2847",
    waferCount: 847,
    lastUpdate: new Date(),
  },
  {
    id: "scanner-02",
    name: "SCANNER-02",
    type: "scanner",
    model: "NXT_2050i",
    module: "reticle_handler",
    status: "warning",
    currentRecipe: "CONTACT_DUV_N7",
    lotId: "SYN_LOT_B1923",
    waferCount: 423,
    lastUpdate: new Date(),
  },
  {
    id: "track-01",
    name: "TRACK-01",
    type: "track",
    model: "LITHIUS_ProZ",
    module: "coat_cup_1",
    status: "process",
    currentRecipe: "COAT_EUV_POS_80nm",
    lotId: "SYN_LOT_A2847",
    waferCount: 1205,
    lastUpdate: new Date(),
  },
  {
    id: "track-02",
    name: "TRACK-02",
    type: "track",
    model: "LITHIUS_ProZ",
    module: "develop_cup_2",
    status: "process",
    currentRecipe: "DEV_TMAH_238",
    lotId: "SYN_LOT_C0412",
    waferCount: 892,
    lastUpdate: new Date(),
  },
  {
    id: "etch-01",
    name: "ETCH-01",
    type: "etch",
    model: "Sym3_Y",
    module: "chamber_A",
    status: "alarm",
    currentRecipe: "POLY_ETCH_N5",
    lotId: "SYN_LOT_D7821",
    waferCount: 156,
    lastUpdate: new Date(),
  },
  {
    id: "etch-02",
    name: "ETCH-02",
    type: "etch",
    model: "Sym3_Y",
    module: "chamber_B",
    status: "process",
    currentRecipe: "METAL_ETCH_N5",
    lotId: "SYN_LOT_E4563",
    waferCount: 312,
    lastUpdate: new Date(),
  },
  {
    id: "cvd-01",
    name: "CVD-01",
    type: "cvd",
    model: "Producer_GT",
    module: "reactor_1",
    status: "idle",
    currentRecipe: null,
    lotId: null,
    waferCount: 0,
    lastUpdate: new Date(),
  },
  {
    id: "metrology-01",
    name: "CDSEM-01",
    type: "metrology",
    model: "CG6300",
    module: "measure_stage",
    status: "process",
    currentRecipe: "CD_METAL1_N5",
    lotId: "SYN_LOT_A2847",
    waferCount: 24,
    lastUpdate: new Date(),
  },
  {
    id: "pvd-01",
    name: "PVD-01",
    type: "pvd",
    model: "Endura_Clover",
    status: "pm",
    currentRecipe: null,
    lotId: null,
    waferCount: 0,
    lastUpdate: new Date(),
  },
];

// ============================================================================
// PROCESS PARAMETERS BY EQUIPMENT TYPE
// ============================================================================

// Scanner (Lithography) parameters - typical EUV N5/N3 values
export const scannerParameters: ProcessParameter[] = [
  {
    name: "Focus Offset",
    value: 2.3,
    unit: "nm",
    nominal: 0,
    lsl: -30,
    usl: 30,
    tolerance: 15,
    timestamp: new Date(),
  },
  {
    name: "Dose",
    value: 33.2,
    unit: "mJ/cm²",
    nominal: 33.0,
    lsl: 32.0,
    usl: 34.0,
    tolerance: 0.5,
    timestamp: new Date(),
  },
  {
    name: "Overlay X",
    value: 1.8,
    unit: "nm",
    nominal: 0,
    lsl: -5,
    usl: 5,
    tolerance: 2.5,
    timestamp: new Date(),
  },
  {
    name: "Overlay Y",
    value: -0.9,
    unit: "nm",
    nominal: 0,
    lsl: -5,
    usl: 5,
    tolerance: 2.5,
    timestamp: new Date(),
  },
  {
    name: "CD Mean",
    value: 24.8,
    unit: "nm",
    nominal: 25.0,
    lsl: 23.5,
    usl: 26.5,
    tolerance: 1.0,
    timestamp: new Date(),
  },
  {
    name: "CDU 3σ",
    value: 1.2,
    unit: "nm",
    nominal: 1.0,
    lsl: 0,
    usl: 1.8,
    tolerance: 0.4,
    timestamp: new Date(),
  },
];

// Track parameters - coat/develop process
export const trackParameters: ProcessParameter[] = [
  {
    name: "PEB Temp",
    value: 110.2,
    unit: "°C",
    nominal: 110.0,
    lsl: 109.7,
    usl: 110.3,
    tolerance: 0.15,
    timestamp: new Date(),
  },
  {
    name: "PEB Time",
    value: 60.1,
    unit: "s",
    nominal: 60.0,
    lsl: 58,
    usl: 62,
    tolerance: 1.0,
    timestamp: new Date(),
  },
  {
    name: "Develop Time",
    value: 30.0,
    unit: "s",
    nominal: 30.0,
    lsl: 28,
    usl: 32,
    tolerance: 1.0,
    timestamp: new Date(),
  },
  {
    name: "Coat Thickness",
    value: 80.5,
    unit: "nm",
    nominal: 80.0,
    lsl: 76,
    usl: 84,
    tolerance: 2.0,
    timestamp: new Date(),
  },
  {
    name: "Dispense Volume",
    value: 1.98,
    unit: "mL",
    nominal: 2.0,
    lsl: 1.8,
    usl: 2.2,
    tolerance: 0.1,
    timestamp: new Date(),
  },
];

// Etch parameters
export const etchParameters: ProcessParameter[] = [
  {
    name: "Chamber Pressure",
    value: 847,
    unit: "mTorr",
    nominal: 800,
    lsl: 750,
    usl: 850,
    tolerance: 25,
    timestamp: new Date(),
  },
  {
    name: "RF Power",
    value: 1205,
    unit: "W",
    nominal: 1200,
    lsl: 1100,
    usl: 1300,
    tolerance: 50,
    timestamp: new Date(),
  },
  {
    name: "Etch Rate",
    value: 285,
    unit: "nm/min",
    nominal: 280,
    lsl: 260,
    usl: 300,
    tolerance: 10,
    timestamp: new Date(),
  },
  {
    name: "Selectivity",
    value: 8.2,
    unit: ":1",
    nominal: 8.0,
    lsl: 6.0,
    usl: 10.0,
    tolerance: 1.0,
    timestamp: new Date(),
  },
];

// Export combined parameters map by equipment type
export const parametersByEquipmentType: Record<string, ProcessParameter[]> = {
  scanner: scannerParameters,
  track: trackParameters,
  etch: etchParameters,
  cvd: [], // TODO: Add CVD parameters
  pvd: [], // TODO: Add PVD parameters
  metrology: [], // TODO: Add metrology parameters
};

// ============================================================================
// ALARM DATA - SECS/GEM ALIGNED
// ============================================================================

export const mockAlarms: Alarm[] = [
  {
    id: "alarm-001",
    alarmId: 7042,
    alarmCode: "CH_PRESS_OOS",
    equipmentId: "etch-01",
    module: "chamber_A",
    severity: "CRITICAL",
    message: "Chamber pressure out of spec (847 mTorr > USL 850 mTorr)",
    timestamp: new Date(MOCK_NOW - 2 * 60 * 1000),
    acknowledged: false,
    contextParams: [
      { name: "chamber_pressure", value: 847, unit: "mTorr", nominal: 800, tolerance: 50 },
      { name: "throttle_valve_position", value: 78, unit: "%", nominal: 65, tolerance: 10 },
      { name: "pump_speed", value: 2850, unit: "rpm", nominal: 3000, tolerance: 100 },
    ],
    rootCause: {
      cause: "Throttle valve drift causing pressure regulation failure",
      probability: "high",
      evidence: "Valve position 13% above nominal, pump speed normal",
      containmentAction: "Hold current wafer and lot for inspection",
      correctiveAction: "Recalibrate throttle valve; if recurring, replace valve actuator",
    },
  },
  {
    id: "alarm-002",
    alarmId: 3021,
    alarmCode: "WS_FOCUS_WARN",
    equipmentId: "scanner-02",
    module: "wafer_stage",
    severity: "MAJOR",
    message: "Focus offset approaching limit (+8.2 nm, tolerance ±10 nm)",
    timestamp: new Date(MOCK_NOW - 15 * 60 * 1000),
    acknowledged: false,
    contextParams: [
      { name: "focus_offset", value: 8.2, unit: "nm", nominal: 0, tolerance: 10 },
      { name: "leveling_correction", value: 45, unit: "nm", nominal: 30, tolerance: 20 },
      { name: "wafer_flatness_range", value: 180, unit: "nm", nominal: 120, tolerance: 60 },
    ],
    rootCause: {
      cause: "Wafer flatness variation exceeding nominal range",
      probability: "medium",
      evidence: "Leveling correction elevated; may indicate incoming wafer quality issue",
      containmentAction: "Monitor next 5 wafers; hold lot if trend continues",
      correctiveAction: "Review incoming wafer bow/warp specs with upstream process",
    },
  },
  {
    id: "alarm-003",
    alarmId: 5012,
    alarmCode: "CDU_TREND_WARN",
    equipmentId: "scanner-01",
    module: "wafer_stage",
    severity: "MINOR",
    message: "CDU 3σ trending upward (1.2 nm → 1.4 nm over last 50 wafers)",
    timestamp: new Date(MOCK_NOW - 45 * 60 * 1000),
    acknowledged: true,
    contextParams: [
      { name: "cdu_3sigma", value: 1.4, unit: "nm", nominal: 1.0, tolerance: 0.4 },
      { name: "dose_uniformity", value: 0.8, unit: "%", nominal: 0.5, tolerance: 0.3 },
      { name: "source_power_stability", value: 0.95, unit: "arb", nominal: 0.98, tolerance: 0.02 },
    ],
    rootCause: {
      cause: "EUV source power stability degradation",
      probability: "medium",
      evidence: "Source stability below nominal; correlates with dose uniformity drift",
      containmentAction: "Continue monitoring; schedule source health check",
      correctiveAction: "Run source qualification after current lot; PM if confirmed",
    },
  },
  {
    id: "alarm-004",
    alarmId: 8103,
    alarmCode: "PEB_TEMP_DRIFT",
    equipmentId: "track-01",
    module: "PEB_module_1",
    severity: "MINOR",
    message: "PEB temperature uniformity degraded (±0.4°C vs ±0.15°C spec)",
    timestamp: new Date(MOCK_NOW - 2 * 60 * 60 * 1000),
    acknowledged: true,
    contextParams: [
      { name: "peb_temp_uniformity", value: 0.4, unit: "°C", nominal: 0.1, tolerance: 0.15 },
      { name: "hotplate_age", value: 8500, unit: "wafers", nominal: 0, tolerance: 10000 },
      { name: "ambient_temp", value: 23.2, unit: "°C", nominal: 23.0, tolerance: 0.5 },
    ],
    rootCause: {
      cause: "Hotplate aging approaching end-of-life",
      probability: "high",
      evidence: "8500 wafers processed; uniformity typically degrades after 8000",
      containmentAction: "Monitor CD across wafer; flag for PM scheduling",
      correctiveAction: "Schedule hotplate replacement in next PM window",
    },
  },
  {
    id: "alarm-005",
    alarmId: 1001,
    alarmCode: "RETICLE_CONTAM",
    equipmentId: "scanner-02",
    module: "reticle_handler",
    severity: "MAJOR",
    message: "Reticle contamination detected (particle count: 3, spec: 0)",
    timestamp: new Date(MOCK_NOW - 30 * 60 * 1000),
    acknowledged: false,
    contextParams: [
      { name: "particle_count", value: 3, unit: "count", nominal: 0, tolerance: 0 },
      { name: "reticle_id", value: 0, unit: "N/A", nominal: 0, tolerance: 0 }, // Would be string in real system
      { name: "last_clean_date_days", value: 45, unit: "days", nominal: 30, tolerance: 15 },
    ],
    rootCause: {
      cause: "Reticle due for scheduled cleaning (45 days since last clean)",
      probability: "high",
      evidence: "Particle count exceeded zero-tolerance spec; cleaning overdue",
      containmentAction: "Stop exposure immediately; send reticle for cleaning",
      correctiveAction: "Update reticle maintenance schedule; reduce cleaning interval to 30 days",
    },
  },
  {
    id: "alarm-006",
    alarmId: 9501,
    alarmCode: "LOT_COMPLETE",
    equipmentId: "scanner-01",
    module: "wafer_stage",
    severity: "INFO",
    message: "Lot SYN_LOT_A2847 completed (25/25 wafers processed)",
    timestamp: new Date(MOCK_NOW - 10 * 60 * 1000),
    acknowledged: true,
    contextParams: [
      { name: "wafers_processed", value: 25, unit: "wafers", nominal: 25, tolerance: 0 },
      { name: "yield_estimate", value: 98.5, unit: "%", nominal: 99.0, tolerance: 2.0 },
      { name: "cycle_time", value: 48, unit: "s/wafer", nominal: 45, tolerance: 5 },
    ],
  },
];

// ============================================================================
// TREND DATA GENERATION
// ============================================================================

const TREND_DATA_ANCHOR = MOCK_NOW;

function seededUnit(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate realistic trend data with physics-based patterns
 *
 * @param hours - Number of hours of historical data
 * @param baseValue - Nominal/target value
 * @param variance - Random noise amplitude
 * @param driftRate - Optional systematic drift (nm/hour or units/hour)
 * @param excursionProbability - Probability of out-of-spec excursion (0-1)
 */
export function generateTrendData(
  hours: number,
  baseValue: number,
  variance: number,
  driftRate: number = 0,
  excursionProbability: number = 0.02
): TrendDataPoint[] {
  const points: TrendDataPoint[] = [];
  const now = TREND_DATA_ANCHOR;
  const pointsCount = Math.max(60, hours * 12); // At least 60 points, 12 per hour
  const interval = (hours * 60 * 60 * 1000) / pointsCount;
  const seedBase = hours * 1000 + baseValue * 100 + variance * 10 + driftRate;

  for (let i = pointsCount; i >= 0; i--) {
    const timestamp = now - i * interval;
    const hoursAgo = i / 12;

    // Random noise (normal distribution approximation)
    const noise = (
      seededUnit(seedBase + i * 3) +
      seededUnit(seedBase + i * 3 + 1) +
      seededUnit(seedBase + i * 3 + 2) -
      1.5
    ) * variance;

    // Slow sinusoidal drift (simulates thermal/environmental cycles)
    const cyclicDrift = Math.sin(hoursAgo / 4 * Math.PI) * variance * 0.3;

    // Systematic drift (simulates tool aging/degradation)
    const systematicDrift = driftRate * (hours - hoursAgo);

    // Occasional excursion
    const excursion = seededUnit(seedBase + i * 7) < excursionProbability
      ? (seededUnit(seedBase + i * 7 + 1) > 0.5 ? 1 : -1) * variance * 3
      : 0;

    points.push({
      timestamp,
      value: baseValue + noise + cyclicDrift + systematicDrift + excursion,
    });
  }

  return points;
}

/**
 * Generate correlated parameter trends (e.g., focus and overlay often correlate)
 */
export function generateCorrelatedTrends(
  hours: number,
  params: { name: string; base: number; variance: number }[],
  correlationStrength: number = 0.6
): Map<string, TrendDataPoint[]> {
  const result = new Map<string, TrendDataPoint[]>();
  const pointsCount = Math.max(60, hours * 12);
  const now = TREND_DATA_ANCHOR;
  const interval = (hours * 60 * 60 * 1000) / pointsCount;

  // Generate common noise component
  const commonNoise: number[] = [];
  for (let i = 0; i <= pointsCount; i++) {
    commonNoise.push((seededUnit(hours * 1000 + i) - 0.5) * 2);
  }

  for (const param of params) {
    const points: TrendDataPoint[] = [];

    for (let i = pointsCount; i >= 0; i--) {
      const timestamp = now - i * interval;
      const idx = pointsCount - i;

      // Independent noise
      const independentNoise =
        (seededUnit(hours * 2000 + idx + param.base * 100) - 0.5) *
        param.variance *
        (1 - correlationStrength);

      // Correlated noise
      const correlatedNoise = commonNoise[idx] * param.variance * correlationStrength;

      points.push({
        timestamp,
        value: param.base + independentNoise + correlatedNoise,
      });
    }

    result.set(param.name, points);
  }

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get equipment by ID
 */
export function getEquipmentById(id: string): Equipment | undefined {
  return mockEquipment.find((eq) => eq.id === id);
}

/**
 * Get parameters for a specific equipment type
 */
export function getParametersForEquipment(equipmentId: string): ProcessParameter[] {
  const equipment = getEquipmentById(equipmentId);
  if (!equipment) return [];
  return parametersByEquipmentType[equipment.type] || [];
}

/**
 * Get alarms for a specific equipment
 */
export function getAlarmsForEquipment(equipmentId: string): Alarm[] {
  return mockAlarms.filter((alarm) => alarm.equipmentId === equipmentId);
}

/**
 * Get unacknowledged alarms by severity
 */
export function getActiveAlarmsBySeverity(severity?: AlarmSeverity): Alarm[] {
  return mockAlarms.filter(
    (alarm) => !alarm.acknowledged && (!severity || alarm.severity === severity)
  );
}

/**
 * Count active alarms by severity level
 */
export function countAlarmsBySeverity(): Record<AlarmSeverity, number> {
  const counts: Record<AlarmSeverity, number> = {
    CRITICAL: 0,
    MAJOR: 0,
    MINOR: 0,
    INFO: 0,
  };

  for (const alarm of mockAlarms) {
    if (!alarm.acknowledged) {
      counts[alarm.severity]++;
    }
  }

  return counts;
}

export const mockParameters = scannerParameters;
