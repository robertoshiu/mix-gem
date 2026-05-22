import type {
  ToolPerformance,
  PmSchedule,
  MtbfPrediction,
  FdcTrace,
  FdcAnomalyType,
  ChamberMatchStat,
  FdcParamId,
} from './types';
import {
  FDC_PARAMS,
  FDC_PARAM_IDS,
  FDC_TRACE_SAMPLES,
  WEIBULL_DEFAULTS,
  SURVIVAL_CURVE_POINTS,
  ANOMALY_WINDOW,
} from './constants';

// ── mulberry32 PRNG ──
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// ── 1. Tool Performance ──
export function generateToolPerformance(equipmentId: string, baseOee: number): ToolPerformance {
  const rng = mulberry32(hashCode(equipmentId));

  const oeeOffset = rng() * 4 - 2;
  const oee = Math.max(0, Math.min(100, baseOee + oeeOffset));
  const availability = Math.max(0, Math.min(100, oee + rng() * 5));
  const utilFactor = 0.85 + rng() * 0.10;
  const utilization = Math.max(0, Math.min(100, availability * utilFactor));

  const dipHour = Math.floor(rng() * 24);
  const dipAmount = 8 + rng() * 7;

  const seed = hashCode(equipmentId);
  const trend24h = Array.from({ length: 24 }, (_, hour) => {
    const sinBase = Math.sin(hour / 3.8 + seed) * 2;
    let hourOee = oee + sinBase;
    let hourAvail = availability + sinBase * 0.8;
    let hourUtil = utilization + sinBase * 0.6;

    if (hour === dipHour) {
      hourOee -= dipAmount;
      hourAvail -= dipAmount * 0.7;
      hourUtil -= dipAmount * 0.5;
    }

    return {
      hour,
      oee: Math.max(0, Math.min(100, Number(hourOee.toFixed(1)))),
      availability: Math.max(0, Math.min(100, Number(hourAvail.toFixed(1)))),
      utilization: Math.max(0, Math.min(100, Number(hourUtil.toFixed(1)))),
    };
  });

  return {
    equipmentId,
    oee: Number(oee.toFixed(1)),
    availability: Number(availability.toFixed(1)),
    utilization: Number(utilization.toFixed(1)),
    trend24h,
  };
}

// ── 2. PM Schedule ──

function getWeibullDefaults(equipmentId: string) {
  const prefix = equipmentId.split('-')[0];
  return WEIBULL_DEFAULTS[prefix] ?? WEIBULL_DEFAULTS.DEFAULT;
}

export function generatePmSchedule(equipmentId: string): PmSchedule {
  const rng = mulberry32(hashCode(equipmentId + '-pm'));
  const { pmIntervalDays } = getWeibullDefaults(equipmentId);

  const today = new Date('2026-05-22');
  const history: PmSchedule['history'] = [];
  let cursor = new Date(today);

  for (let i = 0; i < 6; i++) {
    const jitter = Math.floor(rng() * 5) - 2;
    cursor = new Date(cursor.getTime() - (pmIntervalDays + jitter) * 86400000);

    const roll = rng();
    const type = roll < 0.8 ? 'completed' as const : 'unscheduled' as const;
    const durationHours = 2 + Math.floor(rng() * 10);

    const descriptions: Record<string, string[]> = {
      completed: ['Chamber clean', 'Consumable swap', 'Calibration', 'Filter replacement'],
      unscheduled: ['RF generator fault repair', 'Leak fix', 'Sensor replacement'],
    };
    const descList = descriptions[type];
    const description = descList[Math.floor(rng() * descList.length)];

    history.push({
      id: `pm-${equipmentId}-${i}`,
      type,
      date: cursor.toISOString().split('T')[0],
      durationHours,
      description,
    });
  }

  const lastPmDate = history[0].date;
  const nextPm = new Date(new Date(lastPmDate).getTime() + pmIntervalDays * 86400000);

  return {
    equipmentId,
    nextPmDate: nextPm.toISOString().split('T')[0],
    pmIntervalDays,
    lastPmDate,
    history,
  };
}

// ── 3. MTBF Prediction (Weibull) ──

/** Lanczos approximation for Gamma function */
function gammaApprox(x: number): number {
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gammaApprox(1 - x));
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  const xm1 = x - 1;
  let sum = c[0];
  for (let i = 1; i < g + 2; i++) {
    sum += c[i] / (xm1 + i);
  }
  const t = xm1 + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, xm1 + 0.5) * Math.exp(-t) * sum;
}

export function generateMtbfPrediction(equipmentId: string): MtbfPrediction {
  const rng = mulberry32(hashCode(equipmentId + '-mtbf'));
  const { shape: beta, scale: eta } = getWeibullDefaults(equipmentId);

  const mtbfHours = Math.round(eta * gammaApprox(1 + 1 / beta));

  const ageFraction = 0.1 + rng() * 0.7;
  const currentAgeHours = Math.round(eta * ageFraction);

  const survivalCurve: MtbfPrediction['survivalCurve'] = [];
  for (let i = 0; i < SURVIVAL_CURVE_POINTS; i++) {
    const t = (2 * eta * i) / (SURVIVAL_CURVE_POINTS - 1);
    const probability = Math.exp(-Math.pow(t / eta, beta));
    survivalCurve.push({
      hours: Math.round(t),
      probability: Number(probability.toFixed(6)),
    });
  }

  const failureProbability = Number(
    (1 - Math.exp(-Math.pow(currentAgeHours / eta, beta))).toFixed(4)
  );

  return {
    equipmentId,
    mtbfHours,
    currentAgeHours,
    failureProbability,
    weibullShape: beta,
    weibullScale: eta,
    survivalCurve,
  };
}
