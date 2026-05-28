'use client';

import { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import {
  createDefaultPipeline, runFederatedSim, computePipelineYield,
} from '@/lib/analytics/vpp-engine';
import { STEP_SHORT_NAMES } from '@/lib/analytics/constants';
import {
  DEFAULT_PROCESS_TEMPS, DEFAULT_PROCESS_TIMES, DEFAULT_THERMAL_BUDGET_CEILING,
} from '@/lib/analytics/vpp-constants';
import type { PipelineStep, ThermalBudgetStep, ProcessStepId } from '@/lib/analytics/types';
import type { VppInputSnapshot } from '@/lib/analytics/analytics-sim';
import { SYM } from '@/lib/analytics/symbols';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import { useClientReady } from '@/hooks/use-client-ready';
import { KpiBox } from './KpiBox';
import { AccordionPanel } from './vpp-panels/AccordionPanel';
import { FilmStackPanel } from './vpp-panels/FilmStackPanel';
import { ThermalBudgetPanel } from './vpp-panels/ThermalBudgetPanel';
import { StressPanel } from './vpp-panels/StressPanel';
import { DefectPanel } from './vpp-panels/DefectPanel';
import { DopantPanel } from './vpp-panels/DopantPanel';

// ---------------------------------------------------------------------------
// Theme — accent palette + glass treatment from DESIGN.md / home dashboard
// ---------------------------------------------------------------------------

/** Per-step accent palette drawn from the DESIGN.md accent set. */
const STEP_COLORS = ['#F47920', '#22D3EE', '#8B5CF6', '#3B82F6', '#F43F5E', '#F59E0B', '#10B981', '#E2E8F0'];

/** Themed recharts tooltip surface — #0f172a + cyan border (home dashboard style). */
const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(34,211,238,0.45)',
  borderRadius: 12,
  color: '#f8fafc',
  fontSize: 12,
} as const;

const AXIS_STROKE = 'rgba(148,163,184,0.72)';
const GRID_STROKE = 'rgba(148,163,184,0.12)';

/** Glass container className shared by the chart cards (DESIGN.md signature). */
const GLASS_CARD =
  'rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl';

// ---------------------------------------------------------------------------
// Live-data → engine input
// ---------------------------------------------------------------------------

/**
 * Map the per-tick live snapshot onto pipeline overrides, then let the existing
 * federated-sim engine (the source of truth for all VPP math) recompute. We do
 * NOT re-derive yield/thickness/stress here — we only nudge the inputs so the
 * engine's deterministic output keeps moving each tick.
 *
 * The snapshot's `cumulativeYield` and `netStress` drive a gentle, bounded
 * temperature scaling around each step's engineered process temperature.
 */
function pipelineFromSnapshot(
  base: PipelineStep[],
  snapshot: VppInputSnapshot | null,
): PipelineStep[] {
  if (!snapshot) return base;
  // cumulativeYield in [0.5, 0.98] → factor in ~[0.96, 1.04]; stress shifts it slightly.
  const yieldFactor = 0.96 + (snapshot.cumulativeYield - 0.5) * 0.16;
  const stressShift = snapshot.netStress / 6000; // ±~0.03 across the stress band
  return base.map((step, i) => {
    const baseTemp = DEFAULT_PROCESS_TEMPS[step.stepId] ?? 1000;
    const phase = 1 + Math.sin((i + 1) * 0.7) * stressShift;
    return {
      ...step,
      overrides: { ...step.overrides, temperature: baseTemp * yieldFactor * phase },
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VppTab() {
  const clientReady = useClientReady();
  const [pipeline] = useState<PipelineStep[]>(createDefaultPipeline);

  // Live snapshot for this module (granular selector → re-render only on VPP tick data).
  const liveSnapshot = useAnalyticsSimStore((s) => s.modules.vpp);
  const elapsedTicks = useAnalyticsSimStore((s) => s.elapsedTicks);

  // SLIDER TAKEOVER: local-only pause. When the user explores via a slider in a
  // child panel, this tab freezes to its last live snapshot and tick. Hero is
  // unaffected (we never touch the shared store). `null` while live → use the
  // live snapshot.
  const [frozenSnapshot, setFrozenSnapshot] = useState<{
    snapshot: VppInputSnapshot | null;
    tick: number;
  } | null>(null);
  const paused = frozenSnapshot !== null;

  const pauseLive = () => {
    if (frozenSnapshot === null) setFrozenSnapshot({ snapshot: liveSnapshot, tick: elapsedTicks });
  };
  const resumeLive = () => setFrozenSnapshot(null);

  // The snapshot this tab renders: frozen one while exploring, else the live one.
  const activeSnapshot = frozenSnapshot ? frozenSnapshot.snapshot : liveSnapshot;

  // Feed the live (or frozen) snapshot into the existing engine — source of truth.
  const result = useMemo(
    () => runFederatedSim(pipelineFromSnapshot(pipeline, activeSnapshot)),
    [pipeline, activeSnapshot],
  );
  const pipelineYield = useMemo(() => computePipelineYield(result.perStep), [result]);

  // Thermal budget computed from process temps/times (unchanged math).
  const thermalSteps: ThermalBudgetStep[] = useMemo(
    () =>
      result.perStep.reduce<ThermalBudgetStep[]>((acc, step) => {
        const temp = DEFAULT_PROCESS_TEMPS[step.stepId as ProcessStepId];
        const time = DEFAULT_PROCESS_TIMES[step.stepId as ProcessStepId];
        const dt = temp * time;
        const cumulativeDt = (acc.length > 0 ? acc[acc.length - 1].cumulativeDt : 0) + dt;
        acc.push({ stepId: step.stepId, temperature: temp, time, dt, cumulativeDt });
        return acc;
      }, []),
    [result],
  );

  // Cumulative-yield waterfall data (one bar per step, cumulative product).
  const waterfallData = useMemo(
    () =>
      pipelineYield.perStep.reduce<
        { step: string; cumulativePct: number; color: string }[]
      >((acc, step, i) => {
        const prev = acc.length > 0 ? acc[acc.length - 1].cumulativePct / 100 : 1;
        const cumulative = prev * step.yield;
        acc.push({
          step: STEP_SHORT_NAMES[step.stepId as ProcessStepId] ?? step.stepId,
          cumulativePct: cumulative * 100,
          color: STEP_COLORS[i % STEP_COLORS.length],
        });
        return acc;
      }, []),
    [pipelineYield],
  );

  // Per-step thickness trend.
  const trendData = useMemo(
    () =>
      result.perStep.map((step, i) => ({
        step: STEP_SHORT_NAMES[step.stepId as ProcessStepId] ?? step.stepId,
        thickness: Number(step.thickness.toFixed(1)),
        color: STEP_COLORS[i % STEP_COLORS.length],
      })),
    [result],
  );

  const totalThickness = result.filmStack.reduce((s, l) => s + l.thickness, 0);

  return (
    <div className="space-y-5">
      {/* Title + plain-language caption + live/paused control */}
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sf-accent-cyan)]">
            Virtual Process Pipeline
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-snug text-[var(--sf-text-secondary)]">
            Simulate the full 8-step wafer recipe end to end and watch how each step
            stacks film, adds stress, and chips away at final yield.
          </p>
        </div>
        {paused ? (
          <div className="flex shrink-0 items-center gap-3">
            <span
              data-testid="vpp-paused-badge"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(245,158,11,0.5)] bg-[rgba(245,158,11,0.12)] px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[#F59E0B]"
            >
              <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" />
              Paused {SYM.dash} tick {frozenSnapshot.tick}
            </span>
            <button
              type="button"
              onClick={resumeLive}
              className="inline-flex min-h-[44px] items-center rounded-full border border-[rgba(34,211,238,0.5)] bg-[rgba(34,211,238,0.1)] px-4 py-2 text-sm font-semibold text-[var(--sf-accent-cyan)] outline-none transition-colors hover:bg-[rgba(34,211,238,0.2)] focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]"
            >
              Resume live
            </button>
          </div>
        ) : (
          <span
            data-testid="vpp-live-badge"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[rgba(34,211,238,0.35)] px-3 py-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--sf-accent-cyan)]"
          >
            <span aria-hidden className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--sf-accent-cyan)] motion-reduce:animate-none" />
            Live
          </span>
        )}
      </header>

      {/* KPI strip — shared glass KpiBox, fed by the live (or frozen) engine output */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-live="off">
        <KpiBox label="Active Sims" value={`${pipeline.length}`} plain="Recipes running" />
        <KpiBox label="Pipeline Steps" value={`${pipeline.length}`} accent="var(--sf-accent-violet)" />
        <KpiBox
          label="Cumulative Yield"
          value={`${(result.cumulativeYield * 100).toFixed(1)}%`}
          plain="Good die after all steps"
        />
        <KpiBox
          label="Total Thickness"
          value={`${totalThickness.toFixed(0)} nm`}
          accent="var(--sf-accent-orange)"
        />
        <KpiBox label="Layers" value={`${result.filmStack.length}`} accent="var(--sf-accent-teal)" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pipeline steps list */}
        <div className={`${GLASS_CARD} space-y-3`}>
          <div className="text-sm font-semibold tracking-wide text-[var(--sf-text-primary)]">
            Pipeline Steps
          </div>
          <div className="space-y-2">
            {pipeline.map((step, i) => (
              <div key={step.stepId} className="flex items-center gap-3 text-sm">
                <span className="w-12 font-mono text-[var(--sf-text-secondary)]">
                  {STEP_SHORT_NAMES[step.stepId as ProcessStepId]}
                </span>
                <span className="flex-1 font-mono tabular-nums text-[var(--sf-text-secondary)]">
                  Y: {((result.perStep[i]?.yield ?? 0) * 100).toFixed(1)}% {SYM.dash}{' '}
                  T: {(result.perStep[i]?.thickness ?? 0).toFixed(0)} nm
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Charts (recharts) */}
        <div className="space-y-4">
          <div className={GLASS_CARD} data-testid="vpp-chart-waterfall">
            <div className="mb-3 text-sm font-semibold tracking-wide text-[var(--sf-text-primary)]">
              Cumulative Yield Waterfall
            </div>
            <div className="h-[200px]">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="step" stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke={AXIS_STROKE}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(34,211,238,0.08)' }}
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)}%`, 'Cumulative yield']}
                    />
                    <Bar dataKey="cumulativePct" radius={[4, 4, 0, 0]}>
                      <LabelList
                        dataKey="cumulativePct"
                        position="top"
                        fontSize={10}
                        fill="#94A3B8"
                        formatter={(v: React.ReactNode) => `${Number(v ?? 0).toFixed(0)}%`}
                      />
                      {waterfallData.map((d) => (
                        <Cell key={d.step} fill={d.color} fillOpacity={0.65} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartPlaceholder />
              )}
            </div>
          </div>

          <div className={GLASS_CARD} data-testid="vpp-chart-metric">
            <div className="mb-3 text-sm font-semibold tracking-wide text-[var(--sf-text-primary)]">
              Film Thickness Trend (nm)
            </div>
            <div className="h-[200px]">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 16, right: 12, left: -8, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="step" stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ stroke: 'rgba(34,211,238,0.45)', strokeWidth: 1 }}
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(1)} nm`, 'Thickness']}
                    />
                    <Line
                      type="monotone"
                      dataKey="thickness"
                      stroke="#22D3EE"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#22D3EE', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ChartPlaceholder />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <AccordionPanel
          title="Film Stack"
          summary={`${result.filmStack.length} layers, ${totalThickness.toFixed(0)} nm`}
          defaultOpen={true}
        >
          <FilmStackPanel filmStack={result.filmStack} />
        </AccordionPanel>

        <AccordionPanel
          title="Thermal Budget"
          summary={`${
            thermalSteps.length > 0
              ? thermalSteps[thermalSteps.length - 1].cumulativeDt.toExponential(2)
              : '0'
          } ${SYM.deg}C·s`}
          defaultOpen={false}
        >
          <ThermalBudgetPanel steps={thermalSteps} ceiling={DEFAULT_THERMAL_BUDGET_CEILING} />
        </AccordionPanel>

        <AccordionPanel title="Stress / Strain" summary="CTE + intrinsic stress analysis" defaultOpen={false}>
          <StressPanel perStep={result.perStep} onExplore={pauseLive} />
        </AccordionPanel>

        <AccordionPanel title="Defect Density" summary="Source breakdown + wafer map" defaultOpen={false}>
          <DefectPanel perStep={result.perStep} onExplore={pauseLive} />
        </AccordionPanel>

        <AccordionPanel title="Dopant Profile" summary="Implant + diffusion depth profiles" defaultOpen={false}>
          <DopantPanel onExplore={pauseLive} />
        </AccordionPanel>
      </div>
    </div>
  );
}

/** Hydration-gate placeholder matching the home dashboard's chart loading state. */
function ChartPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-[var(--sf-text-secondary)]">
      Initializing pipeline telemetry...
    </div>
  );
}
