'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  Cell,
} from 'recharts';
import {
  computeLineYield, generateYieldWaterfall, generateYieldCurve,
} from '@/lib/analytics/yield-engine';
import { DEFAULT_D0, PROCESS_STEPS, STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import type { ProcessStepId } from '@/lib/analytics/types';
import { SYM } from '@/lib/analytics/symbols';
import { KpiBox } from '@/components/analytics/KpiBox';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import { useClientReady } from '@/hooks/use-client-ready';

// ---------------------------------------------------------------------------
// Palette — accent colors from DESIGN.md (cyan primary, then the accent ring).
// ---------------------------------------------------------------------------

const STEP_COLORS = ['#F47920', '#22D3EE', '#8B5CF6', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#14B8A6'];

const ACCENT_CYAN = '#22D3EE';
const ACCENT_ORANGE = '#F47920';

/** Shared themed tooltip styling (surface #0f172a + cyan border) per DESIGN.md. */
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(34,211,238,0.45)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#F1F5F9',
} as const;
const TOOLTIP_LABEL_STYLE = { color: '#94A3B8' } as const;
const TOOLTIP_CURSOR = { fill: 'rgba(34,211,238,0.08)' } as const;
const TOOLTIP_LINE_CURSOR = { stroke: 'rgba(34,211,238,0.45)', strokeWidth: 1 } as const;

// ---------------------------------------------------------------------------
// Scenario presets (explore mode) — applying a preset is a slider takeover too.
// ---------------------------------------------------------------------------

const PRESETS = {
  Baseline: () => ({ ...DEFAULT_D0 }),
  '10% Improvement': () => {
    const d: Record<string, number> = {};
    for (const k of PROCESS_STEPS) d[k] = DEFAULT_D0[k] * 0.9;
    return d as Record<ProcessStepId, number>;
  },
  'New Tool': () => {
    const d = { ...DEFAULT_D0 };
    let worst: ProcessStepId = 'oxidation';
    for (const k of PROCESS_STEPS) if (DEFAULT_D0[k] > DEFAULT_D0[worst]) worst = k;
    d[worst] *= 0.6;
    return d;
  },
};

// ---------------------------------------------------------------------------
// Glass card shell — matches the home-dashboard signature treatment.
// ---------------------------------------------------------------------------

const GLASS_CARD =
  'rounded-3xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.35)]';

interface GlassChartProps {
  title: string;
  caption: string;
  testId: string;
  children: React.ReactNode;
}

/** A titled, captioned glass chart container with a fixed-height plot area. */
const GlassChart = memo(function GlassChart({ title, caption, testId, children }: GlassChartProps) {
  return (
    <div className={GLASS_CARD} data-testid={testId}>
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-accent-cyan)]">
        {title}
      </div>
      <div className="mb-3 text-sm leading-snug text-[var(--sf-text-secondary)]">{caption}</div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function YieldTab() {
  const ready = useClientReady();

  // Live snapshot for THIS module only — granular selector so unrelated module
  // ticks do not re-render the yield tab.
  const snapshot = useAnalyticsSimStore((s) => s.modules.yield);

  // Local exploration state (slider takeover). When `paused` is false the tab
  // tracks the live snapshot; when the user moves any control we freeze to the
  // snapshot we had and let them explore without the store ever being mutated.
  const [paused, setPaused] = useState(false);
  const [d0Values, setD0Values] = useState<Record<ProcessStepId, number>>({ ...DEFAULT_D0 });
  const [area, setArea] = useState<number>(snapshot.area);
  const [alpha, setAlpha] = useState<number>(snapshot.alpha);

  // While live, mirror the per-tick snapshot into local state so the KPIs and
  // charts move. Skipped entirely once the user takes over (paused).
  const liveD0Key = useMemo(
    () => snapshot.steps.map((s) => `${s.stepId}:${s.d0}`).join('|'),
    [snapshot.steps],
  );
  useEffect(() => {
    if (paused || !ready) return;
    const next = { ...DEFAULT_D0 };
    for (const s of snapshot.steps) next[s.stepId] = s.d0;
    setD0Values(next);
    setArea(snapshot.area);
    setAlpha(snapshot.alpha);
    // liveD0Key encodes the snapshot steps; area/alpha included explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveD0Key, snapshot.area, snapshot.alpha, paused, ready]);

  // Any explore interaction pauses live updates for THIS tab (Hero unaffected).
  function handleArea(value: number) {
    setPaused(true);
    setArea(value);
  }
  function handleAlpha(value: number) {
    setPaused(true);
    setAlpha(value);
  }
  function handleD0(id: ProcessStepId, value: number) {
    setPaused(true);
    setD0Values((prev) => ({ ...prev, [id]: value }));
  }
  function applyPreset(fn: () => Record<ProcessStepId, number>) {
    setPaused(true);
    setD0Values(fn());
  }
  function resumeLive() {
    setPaused(false);
  }

  // ---- Compute via the yield engine (the source of truth — never duplicated).
  const steps = PROCESS_STEPS.map((id) => ({ stepId: id, d0: d0Values[id] }));
  const result = computeLineYield(steps, area, alpha);
  const waterfall = generateYieldWaterfall(steps, area, alpha);
  const curve = generateYieldCurve(area, alpha, 0, 1, 100);

  const worstStep = result.worstStep;
  const worstYield = result.perStep.find((s) => s.stepId === worstStep);
  const d0Avg = steps.reduce((s, st) => s + st.d0, 0) / steps.length;

  // ---- recharts datasets -------------------------------------------------
  const lossData = result.perStep.map((s, i) => ({
    name: STEP_SHORT_NAMES[s.stepId],
    lossPct: s.yieldLoss * 100,
    color: STEP_COLORS[i % STEP_COLORS.length],
  }));

  const curveData = curve.map((pt) => ({ d0: pt.d0, yieldPct: pt.yield * 100 }));
  // Reference dot at the worst step's current D0 along the curve.
  const markerD0 = worstYield?.d0 ?? d0Values[worstStep];
  const markerPoint = curve.reduce((best, pt) =>
    Math.abs(pt.d0 - markerD0) < Math.abs(best.d0 - markerD0) ? pt : best,
  curve[0]);

  const waterfallData = waterfall.map((pt, i) => ({
    name: STEP_SHORT_NAMES[pt.stepId],
    cumulativePct: pt.cumulative * 100,
    color: STEP_COLORS[i % STEP_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      {/* Title + plain-language caption + live/paused state */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--sf-text-primary)]">Yield Forecast</h2>
          <p className="text-sm leading-snug text-[var(--sf-text-secondary)]">
            How many good dies survive every process step — and which step costs you the most.
          </p>
        </div>
        {paused ? (
          <div className="flex items-center gap-2">
            <span
              data-testid="yield-paused-badge"
              className="rounded-full border border-[var(--sf-accent-orange)] bg-[rgba(244,121,32,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--sf-accent-orange)]"
            >
              {`Paused ${SYM.dash} exploring`}
            </span>
            <button
              type="button"
              onClick={resumeLive}
              className="inline-flex min-h-[44px] items-center rounded-xl border border-[rgba(34,211,238,0.35)] bg-[rgba(2,6,23,0.6)] px-4 py-2 text-sm font-medium text-[var(--sf-accent-cyan)] transition-colors hover:bg-[rgba(34,211,238,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
            >
              Resume live
            </button>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#10B981]">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Live
          </span>
        )}
      </div>

      {/* KPI strip — values update every tick while live (per-tick aria off). */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-live="off">
        <KpiBox label="Line Yield" value={`${(result.lineYield * 100).toFixed(1)}%`} plain="Good dies per wafer" />
        <KpiBox
          label="Worst Step"
          value={`${STEP_SHORT_NAMES[worstStep]} ${((worstYield?.yield ?? 0) * 100).toFixed(1)}%`}
          accent={ACCENT_ORANGE}
          plain="Biggest yield drain"
        />
        <KpiBox label={`D${SYM.sub0} avg`} value={d0Avg.toFixed(3)} plain="Mean defect density" />
        <KpiBox label="Die Area" value={`${area} mm${SYM.sup2}`} />
        <KpiBox label={`${SYM.alpha} cluster`} value={alpha.toFixed(1)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Controls panel */}
        <div className={`space-y-3 ${GLASS_CARD}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-accent-cyan)]">
              Explore Defectivity
            </span>
            {paused && (
              <button
                type="button"
                onClick={resumeLive}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[rgba(34,211,238,0.35)] bg-[rgba(2,6,23,0.6)] px-3 py-1.5 text-xs font-medium text-[var(--sf-accent-cyan)] transition-colors hover:bg-[rgba(34,211,238,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
              >
                Resume live
              </button>
            )}
          </div>

          <div>
            <label htmlFor="die-area" className="text-sm text-[var(--sf-text-secondary)]">
              {`Die Area (mm${SYM.sup2})`}
            </label>
            <input
              id="die-area"
              aria-label="Die Area"
              type="range"
              min={50}
              max={300}
              value={area}
              onChange={(e) => handleArea(Number(e.target.value))}
              className="h-11 w-full accent-[var(--sf-accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)]"
            />
            <span className="font-mono text-sm tabular-nums text-[var(--sf-text-secondary)]">
              {`${area} mm${SYM.sup2}`}
            </span>
          </div>

          <div>
            <label htmlFor="alpha" className="text-sm text-[var(--sf-text-secondary)]">
              {`Cluster ${SYM.alpha}`}
            </label>
            <input
              id="alpha"
              aria-label={`Cluster ${SYM.alpha}`}
              type="range"
              min={0.5}
              max={10}
              step={0.1}
              value={alpha}
              onChange={(e) => handleAlpha(Number(e.target.value))}
              className="h-11 w-full accent-[var(--sf-accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)]"
            />
            <span className="font-mono text-sm tabular-nums text-[var(--sf-text-secondary)]">
              {alpha.toFixed(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {PROCESS_STEPS.map((id) => (
              <div key={id}>
                <label htmlFor={`d0-${id}`} className="text-sm text-[var(--sf-text-secondary)]">
                  {`${STEP_SHORT_NAMES[id]} D${SYM.sub0}`}
                </label>
                <input
                  id={`d0-${id}`}
                  aria-label={`${STEP_SHORT_NAMES[id]} defect density`}
                  type="range"
                  min={0.01}
                  max={2}
                  step={0.01}
                  value={d0Values[id]}
                  onChange={(e) => handleD0(id, Number(e.target.value))}
                  className="h-11 w-full accent-[var(--sf-accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)]"
                />
                <span className="font-mono text-sm tabular-nums text-[var(--sf-text-secondary)]">
                  {d0Values[id].toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([name, fn]) => (
              <button
                key={name}
                type="button"
                onClick={() => applyPreset(fn)}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.6)] px-4 py-2 text-sm font-medium text-[var(--sf-text-secondary)] transition-colors hover:border-[var(--sf-accent-cyan)] hover:text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f19]"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Charts column */}
        <div className="space-y-4">
          <GlassChart
            title="Yield Loss by Step"
            caption="How much yield each process step gives up. Taller is worse."
            testId="yield-chart-bar"
          >
            <BarChart data={lossData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                cursor={TOOLTIP_CURSOR}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                formatter={(value) => [`${Number(value ?? 0).toFixed(2)}%`, 'Yield loss']}
              />
              <Bar dataKey="lossPct" radius={[4, 4, 0, 0]}>
                {lossData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </GlassChart>

          <GlassChart
            title="Yield vs Defect Density"
            caption={`Negative-binomial yield model. The dot marks the worst step's current D${SYM.sub0}.`}
            testId="yield-chart-curve"
          >
            <LineChart data={curveData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" />
              <XAxis
                dataKey="d0"
                type="number"
                domain={[0, 1]}
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => Number(v).toFixed(1)}
              />
              <YAxis
                stroke="#64748B"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                cursor={TOOLTIP_LINE_CURSOR}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                labelFormatter={(v) => `D${SYM.sub0} ${Number(v).toFixed(2)}`}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, 'Step yield']}
              />
              <Line
                type="monotone"
                dataKey="yieldPct"
                stroke={ACCENT_CYAN}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <ReferenceDot
                x={markerPoint.d0}
                y={markerPoint.yield * 100}
                r={5}
                fill={ACCENT_ORANGE}
                stroke="#0b0f19"
                strokeWidth={1.5}
              />
            </LineChart>
          </GlassChart>

          <GlassChart
            title="Cumulative Yield Waterfall"
            caption="Running line yield after each step — watch it fall down the line."
            testId="yield-chart-waterfall"
          >
            <BarChart data={waterfallData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                cursor={TOOLTIP_CURSOR}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, 'Cumulative yield']}
              />
              <Bar dataKey="cumulativePct" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry) => (
                  <Cell key={entry.name} fill={`${entry.color}AA`} />
                ))}
              </Bar>
            </BarChart>
          </GlassChart>
        </div>
      </div>
    </div>
  );
}
