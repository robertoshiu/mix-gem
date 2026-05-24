// ---------------------------------------------------------------------------
// Dashboard Facility Engine — Hash-based deterministic data generation
// ---------------------------------------------------------------------------
import type {
  MetricDef,
  SubsystemId,
  SubsystemSnapshot,
  MetricSnapshot,
  FacilityEvent,
} from './dashboard-facility-types';
import {
  SUBSYSTEM_IDS,
  SUBSYSTEM_DEFS,
  ALL_TEMPLATES,
} from './dashboard-facility-types';

// ---------------------------------------------------------------------------
// PRNG — Mulberry32
// ---------------------------------------------------------------------------

/**
 * Mulberry32 PRNG. Returns a function that produces deterministic floats
 * in [0, 1) for a given seed.
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Hash — FNV-1a
// ---------------------------------------------------------------------------

/**
 * FNV-1a hash combining tick number and string id into a 32-bit seed.
 */
export function hashSeed(tick: number, id: string): number {
  let hash = 0x811c9dc5;
  // Mix in tick bytes (4 bytes, little-endian)
  for (let i = 0; i < 4; i++) {
    hash ^= (tick >> (i * 8)) & 0xff;
    hash = Math.imul(hash, 0x01000193);
  }
  // Mix in id string
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // unsigned 32-bit
}

// ---------------------------------------------------------------------------
// Metric generation
// ---------------------------------------------------------------------------

/**
 * Generates a metric value using a smooth sin wave mixed with hash noise.
 * Deterministic for the same tick + metricIndex combination.
 */
export function generateMetricValue(
  tick: number,
  def: MetricDef,
  metricIndex: number,
): number {
  // Smooth wave component
  const wave = Math.sin(tick * def.frequency * Math.PI * 2);

  // Hash noise component — uses tick + metricIndex for unique perturbation per tick
  const seed = hashSeed(tick, `metric_${def.key}_${metricIndex}`);
  const rng = mulberry32(seed);
  const noise = rng() * 2 - 1; // [-1, 1]

  // Second noise source for additional high-frequency variation
  const seed2 = hashSeed(tick * 7 + metricIndex * 31, `hf_${def.key}`);
  const rng2 = mulberry32(seed2);
  const noise2 = rng2() * 2 - 1; // [-1, 1]

  // Combine: wave (50%), noise1 (30%), noise2 (20%) — ensures high variation
  const combined = wave * 0.5 + noise * 0.3 + noise2 * 0.2;
  const raw = def.baseline + combined * def.amplitude;

  // Round to precision
  const factor = Math.pow(10, def.precision);
  return Math.round(raw * factor) / factor;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Format a metric value to fixed precision string. */
export function formatMetricValue(value: number, precision: number): string {
  return value.toFixed(precision);
}

// ---------------------------------------------------------------------------
// Subsystem snapshot
// ---------------------------------------------------------------------------

/** Determine status of a single metric based on warn thresholds. */
function metricStatus(value: number, def: MetricDef): string {
  // Critical if more than 20% beyond warning bounds
  const warnRange = def.warnHi - def.warnLo;
  const critMargin = warnRange * 0.2;
  if (value < def.warnLo - critMargin || value > def.warnHi + critMargin) {
    return 'critical';
  }
  if (value < def.warnLo || value > def.warnHi) {
    return 'warning';
  }
  return 'normal';
}

/** Worst status wins (critical > warning > normal). */
const STATUS_RANK: Record<string, number> = {
  normal: 0,
  warning: 1,
  critical: 2,
};

function worstStatus(statuses: string[]): string {
  let worst = 'normal';
  for (const s of statuses) {
    if ((STATUS_RANK[s] ?? 0) > (STATUS_RANK[worst] ?? 0)) {
      worst = s;
    }
  }
  return worst;
}

/**
 * Generate a full subsystem snapshot (4 metrics + overall status).
 * Deterministic for the same tick + subsystem id.
 */
export function generateSubsystemSnapshot(
  tick: number,
  id: SubsystemId,
): SubsystemSnapshot {
  const def = SUBSYSTEM_DEFS[id];
  const metrics = def.metrics.map((m, i) => {
    const value = generateMetricValue(tick, m, i);
    return {
      key: m.key,
      value,
      status: metricStatus(value, m),
    } as MetricSnapshot;
  }) as [MetricSnapshot, MetricSnapshot, MetricSnapshot, MetricSnapshot];

  return {
    id,
    metrics,
    status: worstStatus(metrics.map((m) => m.status)),
  };
}

// ---------------------------------------------------------------------------
// Event generation
// ---------------------------------------------------------------------------

const ZONES = ['A', 'B', 'C', 'D', 'E'];
const BAYS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

/** Fill template placeholders using tick + slot as seeds for uniqueness. */
function fillTemplate(
  template: string,
  tick: number,
  slot: number,
): string {
  const seed = hashSeed(tick * 100 + slot, `tpl_fill`);
  const rng = mulberry32(seed);

  return template
    .replace(/\{zone\}/g, ZONES[Math.floor(rng() * ZONES.length)])
    .replace(/\{bay\}/g, BAYS[Math.floor(rng() * BAYS.length)])
    .replace(/\{val\}/g, () => {
      const v = rng() * 100;
      return v < 10 ? v.toFixed(1) : Math.round(v).toString();
    });
}

/**
 * Convert tick (0-179) to HH:MM:SS timestamp string.
 * tick 0 = 16:40:00, tick 179 = 16:42:59.
 */
function tickToTimestamp(tick: number): string {
  const t = tick % 180;
  const baseSeconds = 16 * 3600 + 40 * 60; // 16:40:00
  const totalSeconds = baseSeconds + t;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Generate 0-3 events for a given tick. Fully deterministic.
 *
 * Count distribution: ~15% zero, ~45% one, ~30% two, ~10% three.
 * Target: ~90-120 events over 180 ticks.
 */
export function generateEvents(tick: number): FacilityEvent[] {
  const countSeed = hashSeed(tick, 'event_count');
  const countRng = mulberry32(countSeed);
  const r = countRng();

  // Distribution: 0→55%, 1→28%, 2→12%, 3→5%
  // Expected: 180 * (0.28 + 0.24 + 0.15) = 180 * 0.67 ≈ 120
  let count: number;
  if (r < 0.55) count = 0;
  else if (r < 0.83) count = 1;
  else if (r < 0.95) count = 2;
  else count = 3;

  const events: FacilityEvent[] = [];

  for (let slot = 0; slot < count; slot++) {
    // Subsystem selection: round-robin base with hash jitter
    const subIdx = ((tick * 3 + slot * 7) % SUBSYSTEM_IDS.length +
      Math.floor(mulberry32(hashSeed(tick, `sub_${slot}`))() * 2)) % SUBSYSTEM_IDS.length;
    const subsystem = SUBSYSTEM_IDS[subIdx];

    // Template selection
    const templates = ALL_TEMPLATES[subsystem];
    const tplSeed = hashSeed(tick * 10 + slot, `tpl_${subsystem}`);
    const tplRng = mulberry32(tplSeed);
    const tplIdx = Math.floor(tplRng() * templates.length);
    const tpl = templates[tplIdx];

    // Fill placeholders (tick + slot ensures uniqueness)
    const message = fillTemplate(tpl.msg, tick, slot);

    events.push({
      id: `ev-${tick}-${slot}`,
      tick,
      timestamp: tickToTimestamp(tick),
      subsystem,
      severity: tpl.severity,
      message,
    });
  }

  return events;
}
