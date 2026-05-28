'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import {
  ANALYTICS_CYCLE_TICKS,
  type AnalyticsEvent as SimAnalyticsEvent,
  type ModuleSnapshots,
} from '@/lib/analytics/analytics-sim';
import { computeLineYield } from '@/lib/analytics/yield-engine';
import {
  generateSystemRBD,
} from '@/lib/analytics/reliability-engine';
import { DEFAULT_SUBSYSTEMS, PROCESS_STEPS, STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import type { AnalyticsTab, ProcessStepId, Subsystem } from '@/lib/analytics/types';
import {
  AnalyticsEventFeed,
  type AnalyticsEvent as FeedEvent,
  type AnalyticsCategory,
} from '@/components/analytics/AnalyticsEventFeed';
import { useClientReady } from '@/hooks/use-client-ready';
import { prefersReducedMotion } from '@/lib/animation';

// ---------------------------------------------------------------------------
// Fab Health Hero — the single visual anchor of /mes/analytics.
//
// Design source of truth: DESIGN.md ("Hero visual anchor" / "Motion + a11y" /
// "Loop legibility") + the approved design doc. The Hero is composed (not a
// card mosaic): ONE large composite Fab Health Score is THE anchor; the four
// sub-metrics (Yield / OEE / Reliability / Multi-Fab) are smaller supporting
// gauges; below sits the live event stream + the 8-process health strip.
//
// KPIs are SINGLE-SOURCE (eng-review D3): the shared tick driver
// (analytics-sim-store) publishes the per-module input snapshots, and the Hero
// runs the SAME engines the tabs use (yield-engine, reliability-engine) over
// those inputs — no duplicate math. The composite is a weighted blend of the
// four sub-scores.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-metric model + composite weighting
// ---------------------------------------------------------------------------

interface SubMetric {
  /** Stable key. */
  key: 'yield' | 'oee' | 'reliability' | 'multifab';
  /** Short display label. */
  label: string;
  /** Plain-language one-liner (progressive disclosure). */
  plain: string;
  /** Score in [0, 100]. */
  score: number;
  /** Accent color from the DESIGN.md palette. */
  color: string;
  /** Weight contribution to the composite (sums to 1 across all four). */
  weight: number;
  /** Tab this sub-metric drills into when clicked. */
  tab: AnalyticsTab;
}

const SUB_METRIC_META: Record<
  SubMetric['key'],
  { label: string; plain: string; color: string; weight: number; tab: AnalyticsTab }
> = {
  yield: {
    label: 'Yield',
    plain: 'Good dies per wafer across all steps',
    color: '#22D3EE',
    weight: 0.3,
    tab: 'yield',
  },
  oee: {
    label: 'OEE',
    plain: 'How hard the fab works vs its ceiling',
    color: '#8B5CF6',
    weight: 0.3,
    tab: 'optimization',
  },
  reliability: {
    label: 'Reliability',
    plain: 'Equipment uptime, all subsystems',
    color: '#F59E0B',
    weight: 0.25,
    tab: 'reliability',
  },
  multifab: {
    label: 'Multi-Fab',
    plain: 'How tightly satellites track HQ',
    color: '#3B82F6',
    weight: 0.15,
    tab: 'replication',
  },
};

/** Clamp a number into [lo, hi]. */
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Recover a live repair rate µ from a target availability while keeping the
 * baseline failure rate λ (mirrors ReliabilityTab's `liveMu`): A = µ/(λ+µ).
 */
function liveMu(lambda: number, availability: number): number {
  const a = clamp(availability, 0.0001, 0.9995);
  return (lambda * a) / (1 - a);
}

/**
 * Aggregate the four sub-scores from the live module snapshots, reusing the
 * SAME engines the tabs use (single source of truth — no duplicate math).
 */
function computeSubMetrics(modules: ModuleSnapshots): SubMetric[] {
  // Yield — line yield through the negative-binomial model (yield-engine).
  const yieldResult = computeLineYield(
    modules.yield.steps,
    modules.yield.area,
    modules.yield.alpha,
  );
  const yieldScore = clamp(yieldResult.lineYield * 100, 0, 100);

  // Reliability — system availability via the RBD engine, fed by snapshot
  // availabilities mapped back onto µ (keeping the baseline λ).
  const availById = new Map(
    modules.reliability.availabilities.map((a) => [a.id, a.availability]),
  );
  const effectiveSubsystems: Subsystem[] = DEFAULT_SUBSYSTEMS.map((s) => {
    const liveAvail = availById.get(s.id);
    return liveAvail == null ? s : { ...s, mu: liveMu(s.lambda, liveAvail) };
  });
  const rbd = generateSystemRBD(effectiveSubsystems, 'series');
  const reliabilityScore = clamp(rbd.systemAvail * 100, 0, 100);

  // OEE — availability x performance x quality, grounded in live signals:
  //   availability = RBD system availability,
  //   performance  = throughput normalized to its 80 wph engineered ceiling,
  //   quality      = optimization yield (already a percentage).
  const availability = rbd.systemAvail;
  const performance = clamp(modules.optimization.objectives.throughput / 80, 0, 1);
  const quality = clamp(modules.optimization.objectives.yield / 100, 0, 1);
  const oeeScore = clamp(availability * performance * quality * 100, 0, 100);

  // Multi-Fab consistency — the snapshot's published transfer-fit R² (the same
  // value the Multi-Fab tab surfaces), expressed as a 0-100 consistency score.
  const multifabScore = clamp(modules.replication.transferRSquared * 100, 0, 100);

  return (
    [
      { key: 'yield' as const, score: yieldScore },
      { key: 'oee' as const, score: oeeScore },
      { key: 'reliability' as const, score: reliabilityScore },
      { key: 'multifab' as const, score: multifabScore },
    ]
  ).map(({ key, score }) => ({
    key,
    score,
    ...SUB_METRIC_META[key],
  }));
}

/** Weighted composite Fab Health Score in [0, 100]. */
function computeCompositeScore(metrics: SubMetric[]): number {
  const total = metrics.reduce((s, m) => s + m.weight, 0) || 1;
  const weighted = metrics.reduce((s, m) => s + m.score * m.weight, 0);
  return clamp(weighted / total, 0, 100);
}

/** Score → semantic status (never color-alone; paired with a label). */
function scoreStatus(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'HEALTHY', color: '#10B981' };
  if (score >= 75) return { label: 'WATCH', color: '#F59E0B' };
  return { label: 'AT RISK', color: '#EF4444' };
}

// ---------------------------------------------------------------------------
// Store-event → feed-event mapping
//
// The shared sim store emits events keyed by their drill-down MODULE
// ('yield' | 'apc' | 'reliability' | 'optimization' | 'replication' | 'vpp').
// The decoupled AnalyticsEventFeed expects its own category vocabulary
// ('multifab' instead of 'replication'). Translate here so the shipping feed
// component stays untouched (DESIGN.md D2).
// ---------------------------------------------------------------------------

const MODULE_TO_FEED_CATEGORY: Record<SimAnalyticsEvent['module'], AnalyticsCategory> = {
  yield: 'yield',
  apc: 'apc',
  reliability: 'reliability',
  optimization: 'optimization',
  replication: 'multifab',
  vpp: 'vpp',
};

function toFeedEvent(event: SimAnalyticsEvent): FeedEvent {
  return {
    id: event.id,
    tick: event.tick,
    timestamp: event.timestamp,
    category: MODULE_TO_FEED_CATEGORY[event.module],
    severity: event.severity,
    message: event.message,
  };
}

// ---------------------------------------------------------------------------
// Process health strip — 8 clickable pills, each drilling into a tab
// ---------------------------------------------------------------------------

/**
 * Map each of the 8 process steps onto the analytics tab that owns its deepest
 * analysis. Lithography/CMP are dimensional-replication driven; implant/diffusion
 * are dopant/VPP; oxidation/deposition/metallization are film-stack (VPP); etch
 * is APC-controlled. Yield is the cross-cutting fallback.
 */
const STEP_TO_TAB: Record<ProcessStepId, AnalyticsTab> = {
  oxidation: 'vpp',
  lithography: 'replication',
  etching: 'apc',
  deposition: 'vpp',
  implant: 'reliability',
  diffusion: 'vpp',
  cmp: 'replication',
  metallization: 'optimization',
};

interface ProcessHealth {
  stepId: ProcessStepId;
  label: string;
  /** Per-step yield in [0, 1] from the live yield snapshot. */
  yield: number;
  /** Per-step availability in [0, 1] from the live reliability snapshot. */
  availability: number;
}

/** Per-step health, derived from the same yield + reliability snapshots. */
function computeProcessHealth(modules: ModuleSnapshots): ProcessHealth[] {
  const yieldResult = computeLineYield(
    modules.yield.steps,
    modules.yield.area,
    modules.yield.alpha,
  );
  const yieldById = new Map(yieldResult.perStep.map((s) => [s.stepId, s.yield]));
  const availById = new Map(
    modules.reliability.availabilities.map((a) => [a.id, a.availability]),
  );
  return PROCESS_STEPS.map((stepId) => ({
    stepId,
    label: STEP_SHORT_NAMES[stepId],
    yield: yieldById.get(stepId) ?? 1,
    availability: availById.get(stepId) ?? 1,
  }));
}

/** A step's combined status from yield + availability (never color-alone). */
function processStatus(health: ProcessHealth): { label: string; color: string } {
  // Weighted: yield dominates but a low-availability step still flags.
  const combined = health.yield * 0.6 + health.availability * 0.4;
  if (combined >= 0.97) return { label: 'OK', color: '#10B981' };
  if (combined >= 0.92) return { label: 'WATCH', color: '#F59E0B' };
  return { label: 'RISK', color: '#EF4444' };
}

// ---------------------------------------------------------------------------
// Composite gauge — large radial anchor (recharts RadialBarChart)
// ---------------------------------------------------------------------------

interface CompositeGaugeProps {
  score: number;
  status: { label: string; color: string };
  /** False until the first client tick (skeleton + cold-start "—"). */
  ready: boolean;
}

const CompositeGauge = memo(function CompositeGauge({ score, status, ready }: CompositeGaugeProps) {
  const data = [{ name: 'health', value: ready ? score : 0, fill: status.color }];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="74%"
          outerRadius="100%"
          startAngle={225}
          endAngle={-45}
          barSize={18}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            background={{ fill: 'rgba(148,163,184,0.12)' }}
            cornerRadius={9}
            isAnimationActive={!prefersReducedMotion()}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Center readout — overlaid on the radial track. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold tabular-nums leading-none"
          style={{
            color: ready ? status.color : 'var(--sf-text-muted)',
            fontFamily: "var(--font-family-data), 'Fira Code', monospace",
          }}
          data-testid="fab-health-score"
        >
          {ready ? score.toFixed(0) : '—'}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--sf-text-secondary)]">
          Fab Health
        </span>
        {ready && (
          <span
            className="mt-2 rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: status.color, borderColor: status.color }}
            data-testid="fab-health-status"
          >
            {status.label}
          </span>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Sub-gauge — small supporting radial indicator
// ---------------------------------------------------------------------------

interface SubGaugeProps {
  metric: SubMetric;
  ready: boolean;
  onClick: () => void;
}

const SubGauge = memo(function SubGauge({ metric, ready, onClick }: SubGaugeProps) {
  const data = [{ name: metric.key, value: ready ? metric.score : 0, fill: metric.color }];
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`fab-subgauge-${metric.key}`}
      className="group flex min-h-[44px] flex-col items-center gap-1 rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.6)] p-3 text-center backdrop-blur-md transition-colors hover:border-[var(--sf-accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
      aria-label={`${metric.label}: ${ready ? metric.score.toFixed(0) : 'pending'} out of 100. ${metric.plain}. Open ${metric.label} tab.`}
    >
      <div className="relative h-16 w-16">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="68%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barSize={6}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              background={{ fill: 'rgba(148,163,184,0.12)' }}
              cornerRadius={3}
              isAnimationActive={!prefersReducedMotion()}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-sm font-bold tabular-nums"
          style={{ color: ready ? metric.color : 'var(--sf-text-muted)' }}
        >
          {ready ? metric.score.toFixed(0) : '—'}
        </span>
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--sf-text-primary)]">
        {metric.label}
      </span>
      <span className="text-sm leading-snug text-[var(--sf-text-secondary)]">
        {metric.plain}
      </span>
    </button>
  );
});

// ---------------------------------------------------------------------------
// Loop pill — "SHIFT mm:ss LOOP" counter + thin progress bar (tick / 180)
// ---------------------------------------------------------------------------

function formatShiftClock(elapsedTicks: number): string {
  const wrapped = ((elapsedTicks % ANALYTICS_CYCLE_TICKS) + ANALYTICS_CYCLE_TICKS) % ANALYTICS_CYCLE_TICKS;
  const m = Math.floor(wrapped / 60);
  const s = wrapped % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(m)}:${pad(s)}`;
}

// ---------------------------------------------------------------------------
// Main Hero
// ---------------------------------------------------------------------------

export function FabHealthHero() {
  const ready = useClientReady();
  const setTab = useAnalyticsStore((s) => s.setTab);

  // Granular selectors over the single shared tick driver.
  const modules = useAnalyticsSimStore((s) => s.modules);
  const tick = useAnalyticsSimStore((s) => s.tick);
  const elapsedTicks = useAnalyticsSimStore((s) => s.elapsedTicks);
  const eventList = useAnalyticsSimStore((s) => s.eventList);
  const playing = useAnalyticsSimStore((s) => s.playing);
  const start = useAnalyticsSimStore((s) => s.start);
  const stop = useAnalyticsSimStore((s) => s.stop);
  const setPrefersReducedMotion = useAnalyticsSimStore((s) => s.setPrefersReducedMotion);

  // Honor prefers-reduced-motion: the store freezes the driver to the latest
  // snapshot while the flag is set (see analytics-sim-store).
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      setReduced(mql.matches);
      setPrefersReducedMotion(mql.matches);
    };
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [setPrefersReducedMotion]);

  // Aggregate sub-scores + composite from the live snapshots via the existing
  // engines. Memoized on the snapshot reference (new each tick).
  const subMetrics = useMemo(() => computeSubMetrics(modules), [modules]);
  const composite = useMemo(() => computeCompositeScore(subMetrics), [subMetrics]);
  const status = scoreStatus(composite);
  const processHealth = useMemo(() => computeProcessHealth(modules), [modules]);

  // Translate store events → the feed's category vocabulary.
  const feedEvents = useMemo(
    () => eventList.map(toFeedEvent).reverse(), // oldest-first for the feed's renderer
    [eventList],
  );

  const loopClock = formatShiftClock(elapsedTicks);
  const loopProgress = (tick / ANALYTICS_CYCLE_TICKS) * 100;

  function togglePlay() {
    if (playing) stop();
    else start();
  }

  return (
    <section
      data-testid="fab-health-hero"
      aria-label="Fab health overview"
      className="rounded-3xl border border-[rgba(34,211,238,0.24)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-6"
    >
      {/* Banner — title + plain caption + loop pill + play/pause */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--sf-accent-cyan)]">
            Fab Health Command Center
          </p>
          <h1 className="mt-2 text-3xl font-semibold uppercase tracking-[0.16em] md:text-4xl">
            Whole-Fab Overview
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--sf-text-secondary)]">
            One score for whether the fab is healthy right now — blended from yield, equipment
            effectiveness, reliability, and how tightly the fabs track each other.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Loop legibility — SHIFT mm:ss LOOP pill + thin progress bar. */}
          <div
            className="flex flex-col gap-1.5"
            data-testid="fab-loop-pill"
            aria-label={`Shift loop position ${loopClock} of 03:00`}
          >
            <span className="rounded-full border border-[rgba(34,211,238,0.35)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--sf-accent-cyan)]">
              {`SHIFT ${loopClock} LOOP`}
            </span>
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-[rgba(148,163,184,0.15)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={ANALYTICS_CYCLE_TICKS}
              aria-valuenow={tick}
            >
              <div
                className="h-full rounded-full bg-[var(--sf-accent-cyan)] transition-[width] duration-700 ease-linear motion-reduce:transition-none"
                style={{ width: `${loopProgress}%` }}
              />
            </div>
          </div>

          {/* Play/pause — WCAG 2.2.2 control for auto-updating content. */}
          <button
            type="button"
            onClick={togglePlay}
            data-testid="fab-play-pause"
            aria-pressed={playing}
            aria-label={playing ? 'Pause live simulation' : 'Play live simulation'}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-[rgba(34,211,238,0.35)] bg-[rgba(2,6,23,0.6)] px-4 py-2 text-sm font-medium text-[var(--sf-accent-cyan)] transition-colors hover:bg-[rgba(34,211,238,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
          >
            <span aria-hidden="true">{playing ? '⏸' : '▶'}</span>
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      </header>

      {reduced && (
        <p className="mt-3 text-xs text-[var(--sf-text-secondary)]" role="note">
          Reduced motion is on — telemetry is frozen to the latest snapshot.
        </p>
      )}

      {/* Anchor row: composite score (left) + 4 sub-gauges (right) */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-center">
        {/* THE anchor — one large composite gauge. */}
        <div className="rounded-3xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.5)] p-4 backdrop-blur-md">
          <CompositeGauge score={composite} status={status} ready={ready} />
          {/* Per-tick value: aria-live OFF (the feed owns the polite region). */}
          <div className="sr-only" aria-live="off" data-testid="fab-health-score-live">
            {ready ? `Fab health score ${composite.toFixed(0)}, ${status.label}` : 'Initializing'}
          </div>
        </div>

        {/* Four supporting sub-gauges (2x2 on mobile, 4-up from sm). */}
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          aria-label="Supporting fab metrics"
          aria-live="off"
        >
          {subMetrics.map((metric) => (
            <SubGauge
              key={metric.key}
              metric={metric}
              ready={ready}
              onClick={() => setTab(metric.tab)}
            />
          ))}
        </div>
      </div>

      {/* Process health strip — 8 clickable pills, horizontal-scroll on mobile. */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sf-accent-cyan)]">
            Process Health
          </h2>
          <span className="text-xs text-[var(--sf-text-secondary)]">
            Click a step to drill into its analysis
          </span>
        </div>
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="group"
          aria-label="Process health by step"
        >
          {processHealth.map((step) => {
            const st = processStatus(step);
            return (
              <button
                key={step.stepId}
                type="button"
                onClick={() => setTab(STEP_TO_TAB[step.stepId])}
                data-testid={`process-pill-${step.stepId}`}
                aria-label={`${step.label} process — status ${ready ? st.label : 'pending'}, yield ${(step.yield * 100).toFixed(1)} percent. Open analysis.`}
                className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-full border bg-[rgba(2,6,23,0.6)] px-4 py-2 text-sm font-medium text-[var(--sf-text-primary)] backdrop-blur-md transition-colors hover:bg-[rgba(34,211,238,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
                style={{ borderColor: ready ? st.color : 'rgba(34,211,238,0.22)' }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: ready ? st.color : 'var(--sf-text-muted)' }}
                  aria-hidden="true"
                />
                <span className="font-mono uppercase tracking-wide">{step.label}</span>
                <span
                  className="font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: ready ? st.color : 'var(--sf-text-muted)' }}
                >
                  {ready ? st.label : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live event stream — fed by the shared store, newest-first inside. */}
      <div className="mt-5">
        <AnalyticsEventFeed events={feedEvents} currentTick={tick} />
      </div>
    </section>
  );
}

export default FabHealthHero;
