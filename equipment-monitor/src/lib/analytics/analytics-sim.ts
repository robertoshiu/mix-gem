// ---------------------------------------------------------------------------
// Analytics Live-Data Engine — deterministic, hash-seeded tick generation
// ---------------------------------------------------------------------------
//
// Shared live-data layer for the /mes/analytics redesign (design doc §
// "Live-data engine"). Modeled on the STRUCTURE of
// `engines/dashboard-facility-engine.ts` (generateEvents / generateMetricValue):
// a smooth sin wave mixed with hash-seeded noise per channel, looped over a
// fixed 180-tick window so it is deterministic, reproducible, and seamlessly
// cyclic.
//
//   - 180 ticks @ 1 Hz = 3 minutes per the spec ("3 分鐘不重複，每 3 分鐘循環").
//   - Index every channel with `tick % 180` so tick 180 === tick 0 (wrap).
//   - Every value is hash-seeded via `hashSeed(tick, channel)` → `mulberry32`,
//     so the whole shift is re-derivable from the tick number alone.
//
// Per eng-review D3 this engine produces LIVE INPUT SNAPSHOTS that drive the
// existing per-tab math engines (yield-engine, apc-engine, …). It deliberately
// does NOT re-implement that math — it nudges the inputs so the tab charts and
// the Hero aggregate keep moving.
// ---------------------------------------------------------------------------

import { mulberry32, hashSeed } from '@/lib/prng';
import {
  PROCESS_STEPS,
  STEP_SHORT_NAMES,
  DEFAULT_D0,
  DEFAULT_DIE_AREA,
  DEFAULT_ALPHA,
  DEFAULT_APC_TARGET,
  DEFAULT_LAMBDA,
  DEFAULT_LAMBDA_SLOPE,
  DEFAULT_NOISE,
  FAB_IDS,
} from './constants';
import type {
  ProcessStepId,
  FabId,
  DriftType,
} from './types';

// ---------------------------------------------------------------------------
// Cycle constants
// ---------------------------------------------------------------------------

/** Ticks per loop. 180 ticks @ 1 Hz = 3 minutes (matches the facility engine). */
export const ANALYTICS_CYCLE_TICKS = 180;

/** The six analytics modules this engine feeds, in Hero / tab-bar order. */
export const ANALYTICS_MODULE_IDS = [
  'yield',
  'apc',
  'reliability',
  'optimization',
  'replication',
  'vpp',
] as const;

export type AnalyticsModuleId = (typeof ANALYTICS_MODULE_IDS)[number];

// ---------------------------------------------------------------------------
// Event categories
// ---------------------------------------------------------------------------

/** Multi-category event pools — every category must surface over a 180-tick window. */
export const ANALYTICS_EVENT_CATEGORIES = [
  'yield-excursion',
  'apc-drift',
  'reliability-alarm',
  'multifab-divergence',
  'tool-maintenance',
  'recipe-change',
] as const;

export type AnalyticsEventCategory = (typeof ANALYTICS_EVENT_CATEGORIES)[number];

export type AnalyticsEventSeverity = 'info' | 'warning' | 'critical';

export interface AnalyticsEvent {
  id: string;
  tick: number;
  timestamp: string;
  category: AnalyticsEventCategory;
  severity: AnalyticsEventSeverity;
  /** Module the event drills into when clicked (Hero → tab). */
  module: AnalyticsModuleId;
  message: string;
}

// ---------------------------------------------------------------------------
// Per-module input snapshots — the live inputs each tab engine consumes
// ---------------------------------------------------------------------------

export interface YieldInputSnapshot {
  /** Per-step defect density (D0), nudged around the engineered baseline. */
  steps: { stepId: ProcessStepId; d0: number }[];
  area: number;
  alpha: number;
}

export interface ApcInputSnapshot {
  target: number;
  lambda: number;
  lambdaSlope: number;
  noise: number;
  driftType: DriftType;
  /** Latest run measurement before R2R correction, for the live readout. */
  rawMeasurement: number;
}

export interface ReliabilityInputSnapshot {
  /** Per-subsystem instantaneous availability fraction in [0,1]. */
  availabilities: { id: ProcessStepId; availability: number }[];
  /** Acceleration factor at the reference junction temperature. */
  accelerationFactor: number;
  junctionTempC: number;
}

export interface OptimizationInputSnapshot {
  objectives: {
    yield: number;
    throughput: number;
    cost: number;
    defectDensity: number;
  };
  /** Live R² of the response-surface fit. */
  rSquared: number;
}

export interface ReplicationInputSnapshot {
  /** Per-fab mean offset (bias) from target and process spread factor. */
  fabs: { id: FabId; meanOffset: number; spread: number }[];
  /** Live transfer-function R² between HQ and the satellite fabs. */
  transferRSquared: number;
}

export interface VppInputSnapshot {
  /** Cumulative pipeline yield in [0,1] across the 8 process steps. */
  cumulativeYield: number;
  /** Net wafer stress (MPa) and resulting bow (µm). */
  netStress: number;
  waferBow: number;
}

export interface ModuleSnapshots {
  yield: YieldInputSnapshot;
  apc: ApcInputSnapshot;
  reliability: ReliabilityInputSnapshot;
  optimization: OptimizationInputSnapshot;
  replication: ReplicationInputSnapshot;
  vpp: VppInputSnapshot;
}

export interface AnalyticsTick {
  /** Wrapped tick index in [0, 179]. */
  tick: number;
  timestamp: string;
  modules: ModuleSnapshots;
  events: AnalyticsEvent[];
}

// ---------------------------------------------------------------------------
// Seeded value helper — sin wave + two hash-noise sources (facility-engine shape)
// ---------------------------------------------------------------------------

interface WaveDef {
  baseline: number;
  amplitude: number;
  frequency: number;
}

/**
 * Smooth sin wave mixed with two hash-seeded noise sources, mirroring
 * `generateMetricValue` in dashboard-facility-engine.ts. Deterministic for the
 * same (tick, channel) pair; never repeats exactly inside the 180-tick window
 * because each tick reseeds from a distinct hash.
 *
 * Weighting: wave 50%, noise 30%, high-freq noise 20%.
 */
function seededValue(tick: number, channel: string, def: WaveDef): number {
  const wave = Math.sin(tick * def.frequency * Math.PI * 2);

  const seed = hashSeed(tick, `analytics_${channel}`);
  const noise = mulberry32(seed)() * 2 - 1; // [-1, 1]

  const seed2 = hashSeed(tick * 7 + 13, `analytics_hf_${channel}`);
  const noise2 = mulberry32(seed2)() * 2 - 1; // [-1, 1]

  const combined = wave * 0.5 + noise * 0.3 + noise2 * 0.2;
  return def.baseline + combined * def.amplitude;
}

/** Clamp helper. */
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Round to a fixed number of decimal places. */
function round(v: number, precision: number): number {
  const f = Math.pow(10, precision);
  return Math.round(v * f) / f;
}

// ---------------------------------------------------------------------------
// Per-module snapshot generators
// ---------------------------------------------------------------------------

/** Per-step D0 wave parameters: gentle drift around the engineered baseline. */
function buildYieldSnapshot(tick: number): YieldInputSnapshot {
  const steps = PROCESS_STEPS.map((stepId, i) => {
    const base = DEFAULT_D0[stepId];
    const d0 = clamp(
      seededValue(tick, `yield_d0_${stepId}`, {
        baseline: base,
        amplitude: base * 0.35,
        frequency: 0.013 + i * 0.0015,
      }),
      base * 0.4,
      base * 2.2,
    );
    return { stepId, d0: round(d0, 4) };
  });
  return { steps, area: DEFAULT_DIE_AREA, alpha: DEFAULT_ALPHA };
}

const DRIFT_TYPES: DriftType[] = ['none', 'linear', 'sinusoidal', 'step-shift', 'mixed'];

function buildApcSnapshot(tick: number): ApcInputSnapshot {
  const lambda = clamp(
    seededValue(tick, 'apc_lambda', { baseline: DEFAULT_LAMBDA, amplitude: 0.12, frequency: 0.011 }),
    0.05,
    0.6,
  );
  const lambdaSlope = clamp(
    seededValue(tick, 'apc_lambda_slope', { baseline: DEFAULT_LAMBDA_SLOPE, amplitude: 0.05, frequency: 0.017 }),
    0.02,
    0.25,
  );
  const noise = clamp(
    seededValue(tick, 'apc_noise', { baseline: DEFAULT_NOISE, amplitude: 0.6, frequency: 0.023 }),
    0.5,
    3,
  );
  // Drift regime changes slowly across the window (one of 5 every ~36 ticks).
  const driftIdx = Math.floor((tick / ANALYTICS_CYCLE_TICKS) * DRIFT_TYPES.length) % DRIFT_TYPES.length;
  const rawMeasurement = round(
    seededValue(tick, 'apc_raw', { baseline: DEFAULT_APC_TARGET, amplitude: 2.5, frequency: 0.029 }),
    2,
  );
  return {
    target: DEFAULT_APC_TARGET,
    lambda: round(lambda, 3),
    lambdaSlope: round(lambdaSlope, 3),
    noise: round(noise, 2),
    driftType: DRIFT_TYPES[driftIdx],
    rawMeasurement,
  };
}

function buildReliabilitySnapshot(tick: number): ReliabilityInputSnapshot {
  const availabilities = PROCESS_STEPS.map((stepId, i) => {
    const availability = clamp(
      seededValue(tick, `rel_avail_${stepId}`, {
        baseline: 0.965,
        amplitude: 0.03,
        frequency: 0.009 + i * 0.001,
      }),
      0.85,
      0.999,
    );
    return { id: stepId, availability: round(availability, 4) };
  });
  const junctionTempC = round(
    seededValue(tick, 'rel_tj', { baseline: 125, amplitude: 8, frequency: 0.015 }),
    1,
  );
  // Arrhenius-style acceleration factor relative to 55°C use temp, Ea ≈ 0.7 eV.
  const af = clamp(
    seededValue(tick, 'rel_af', { baseline: 220, amplitude: 60, frequency: 0.012 }),
    80,
    400,
  );
  return { availabilities, accelerationFactor: round(af, 1), junctionTempC };
}

function buildOptimizationSnapshot(tick: number): OptimizationInputSnapshot {
  const yieldObj = round(
    clamp(seededValue(tick, 'opt_yield', { baseline: 91, amplitude: 4, frequency: 0.014 }), 70, 99.5),
    2,
  );
  const throughput = round(
    clamp(seededValue(tick, 'opt_throughput', { baseline: 52, amplitude: 8, frequency: 0.019 }), 25, 80),
    1,
  );
  const cost = round(
    clamp(seededValue(tick, 'opt_cost', { baseline: 118, amplitude: 14, frequency: 0.021 }), 80, 160),
    1,
  );
  const defectDensity = round(
    clamp(seededValue(tick, 'opt_defect', { baseline: 0.32, amplitude: 0.12, frequency: 0.016 }), 0.05, 0.8),
    3,
  );
  const rSquared = round(
    clamp(seededValue(tick, 'opt_r2', { baseline: 0.94, amplitude: 0.05, frequency: 0.01 }), 0.7, 0.999),
    3,
  );
  return {
    objectives: { yield: yieldObj, throughput, cost, defectDensity },
    rSquared,
  };
}

function buildReplicationSnapshot(tick: number): ReplicationInputSnapshot {
  const fabs = FAB_IDS.map((id, i) => {
    // HQ is the reference (near-zero bias); satellites drift more.
    const biasAmp = i === 0 ? 0.4 : 0.4 + i * 0.6;
    const meanOffset = round(
      seededValue(tick, `repl_bias_${id}`, { baseline: i * 0.5, amplitude: biasAmp, frequency: 0.013 + i * 0.002 }),
      3,
    );
    const spread = round(
      clamp(seededValue(tick, `repl_spread_${id}`, { baseline: 1 + i * 0.12, amplitude: 0.18, frequency: 0.018 }), 0.7, 2),
      3,
    );
    return { id, meanOffset, spread };
  });
  const transferRSquared = round(
    clamp(seededValue(tick, 'repl_transfer_r2', { baseline: 0.93, amplitude: 0.06, frequency: 0.011 }), 0.65, 0.999),
    3,
  );
  return { fabs, transferRSquared };
}

function buildVppSnapshot(tick: number): VppInputSnapshot {
  const cumulativeYield = round(
    clamp(seededValue(tick, 'vpp_yield', { baseline: 0.82, amplitude: 0.08, frequency: 0.012 }), 0.5, 0.98),
    4,
  );
  const netStress = round(
    seededValue(tick, 'vpp_stress', { baseline: 180, amplitude: 90, frequency: 0.017 }),
    1,
  );
  const waferBow = round(
    seededValue(tick, 'vpp_bow', { baseline: 22, amplitude: 12, frequency: 0.02 }),
    2,
  );
  return { cumulativeYield, netStress, waferBow };
}

// ---------------------------------------------------------------------------
// Event generation — multi-category, hash-seeded (generateEvents shape)
// ---------------------------------------------------------------------------

const SHORT = STEP_SHORT_NAMES;

/** Per-category templates. {step}/{fab}/{val}/{tool} placeholders are hash-filled. */
const EVENT_TEMPLATES: Record<
  AnalyticsEventCategory,
  { module: AnalyticsModuleId; severity: AnalyticsEventSeverity; msg: string }[]
> = {
  'yield-excursion': [
    { module: 'yield', severity: 'warning', msg: '{step} D0 excursion +{val}% above baseline' },
    { module: 'yield', severity: 'critical', msg: '{step} killer-defect cluster — lot {lot} on hold' },
    { module: 'yield', severity: 'info', msg: 'Line yield forecast revised to {val}.{val2}%' },
  ],
  'apc-drift': [
    { module: 'apc', severity: 'info', msg: '{step} R2R correction applied {val} units' },
    { module: 'apc', severity: 'warning', msg: '{step} EWMA drift detected — slope {val}/run' },
    { module: 'apc', severity: 'critical', msg: '{step} control loop saturated, Cpk < 1.0' },
  ],
  'reliability-alarm': [
    { module: 'reliability', severity: 'warning', msg: '{tool} MTBF trending down — {val}h remaining' },
    { module: 'reliability', severity: 'critical', msg: '{tool} availability breach, subsystem {step}' },
    { module: 'reliability', severity: 'info', msg: '{step} RBD recomputed, system avail {val}.{val2}%' },
  ],
  'multifab-divergence': [
    { module: 'replication', severity: 'warning', msg: '{fab} {step} CD diverging {val}nm from HQ' },
    { module: 'replication', severity: 'critical', msg: '{fab} TOST equivalence FAILED on {step}' },
    { module: 'replication', severity: 'info', msg: '{fab} transfer fit refreshed, R2 {val}.{val2}' },
  ],
  'tool-maintenance': [
    { module: 'reliability', severity: 'info', msg: '{tool} PM scheduled — {step} chamber' },
    { module: 'reliability', severity: 'warning', msg: '{tool} entered maintenance, {step} throughput down' },
    { module: 'optimization', severity: 'info', msg: '{tool} qualified, {step} back online' },
  ],
  'recipe-change': [
    { module: 'optimization', severity: 'info', msg: '{step} recipe knob tuned to {val} (Pareto move)' },
    { module: 'vpp', severity: 'info', msg: 'VPP pipeline {step} preset swapped → variant {val}' },
    { module: 'optimization', severity: 'warning', msg: '{step} recipe change pending review, {fab}' },
  ],
};

const TOOL_PREFIXES = ['ASML', 'LAM', 'AMAT', 'TEL', 'KLA', 'HITACHI'];

/** Fill {step}/{fab}/{tool}/{val}/{val2}/{lot} placeholders deterministically. */
function fillTemplate(
  template: string,
  tick: number,
  slot: number,
  category: AnalyticsEventCategory,
): string {
  const rng = mulberry32(hashSeed(tick * 100 + slot, `tpl_${category}`));
  const step = PROCESS_STEPS[Math.floor(rng() * PROCESS_STEPS.length)];
  const fab = FAB_IDS[Math.floor(rng() * FAB_IDS.length)];
  const tool = `${TOOL_PREFIXES[Math.floor(rng() * TOOL_PREFIXES.length)]}-${String(Math.floor(rng() * 90) + 10)}`;
  const lot = `L${String(Math.floor(rng() * 9000) + 1000)}`;
  return template
    .replace(/\{step\}/g, SHORT[step])
    .replace(/\{fab\}/g, fab.toUpperCase())
    .replace(/\{tool\}/g, tool)
    .replace(/\{lot\}/g, lot)
    .replace(/\{val2\}/g, () => String(Math.floor(rng() * 9)))
    .replace(/\{val\}/g, () => {
      const v = rng() * 100;
      return v < 10 ? v.toFixed(1) : Math.round(v).toString();
    });
}

/**
 * Convert a wrapped tick (0-179) into an HH:MM:SS shift timestamp.
 * tick 0 = 08:00:00, tick 179 = 08:02:59 — a 3-minute loop.
 */
function tickToTimestamp(tick: number): string {
  const t = ((tick % ANALYTICS_CYCLE_TICKS) + ANALYTICS_CYCLE_TICKS) % ANALYTICS_CYCLE_TICKS;
  const total = 8 * 3600 + t; // base 08:00:00
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Generate the multi-category events for a tick. Each of the 6 categories is
 * sampled independently against its own hash-seeded probability, so every
 * category surfaces repeatedly across a 180-tick window while the per-tick
 * count stays bounded (0–4 typical). Fully deterministic.
 */
export function generateAnalyticsEvents(tick: number): AnalyticsEvent[] {
  const wrapped = ((tick % ANALYTICS_CYCLE_TICKS) + ANALYTICS_CYCLE_TICKS) % ANALYTICS_CYCLE_TICKS;
  const events: AnalyticsEvent[] = [];
  const timestamp = tickToTimestamp(wrapped);

  ANALYTICS_EVENT_CATEGORIES.forEach((category, catIdx) => {
    // ~22% chance per category per tick → expected ≈ 0.22 * 6 * 180 ≈ 238 events
    // across the window, with every category appearing many times.
    const fireRng = mulberry32(hashSeed(wrapped, `evt_fire_${category}`));
    if (fireRng() >= 0.22) return;

    const templates = EVENT_TEMPLATES[category];
    const tplRng = mulberry32(hashSeed(wrapped * 31 + catIdx, `evt_tpl_${category}`));
    const tpl = templates[Math.floor(tplRng() * templates.length)];

    events.push({
      id: `an-${wrapped}-${catIdx}`,
      tick: wrapped,
      timestamp,
      category,
      severity: tpl.severity,
      module: tpl.module,
      message: fillTemplate(tpl.msg, wrapped, catIdx, category),
    });
  });

  return events;
}

// ---------------------------------------------------------------------------
// Module snapshots + full tick
// ---------------------------------------------------------------------------

/** Build the per-module input snapshots for a wrapped tick. */
export function generateModuleSnapshots(tick: number): ModuleSnapshots {
  const wrapped = ((tick % ANALYTICS_CYCLE_TICKS) + ANALYTICS_CYCLE_TICKS) % ANALYTICS_CYCLE_TICKS;
  return {
    yield: buildYieldSnapshot(wrapped),
    apc: buildApcSnapshot(wrapped),
    reliability: buildReliabilitySnapshot(wrapped),
    optimization: buildOptimizationSnapshot(wrapped),
    replication: buildReplicationSnapshot(wrapped),
    vpp: buildVppSnapshot(wrapped),
  };
}

/**
 * Deterministically generate one analytics tick: the 6 per-module input
 * snapshots plus the multi-category event burst for that tick. Indexing is via
 * `tick % 180`, so the same wrapped tick always yields the same output and
 * `generateAnalyticsTick(180)` === `generateAnalyticsTick(0)` (seamless loop).
 */
export function generateAnalyticsTick(tick: number): AnalyticsTick {
  const wrapped = ((tick % ANALYTICS_CYCLE_TICKS) + ANALYTICS_CYCLE_TICKS) % ANALYTICS_CYCLE_TICKS;
  return {
    tick: wrapped,
    timestamp: tickToTimestamp(wrapped),
    modules: generateModuleSnapshots(wrapped),
    events: generateAnalyticsEvents(wrapped),
  };
}
