'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  ScatterChart,
  Scatter,
  Line,
  ErrorBar,
  LineChart,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import {
  generateFabData,
  tostEquivalence,
  fitTransferFunction,
  computeCpk,
} from '@/lib/analytics/replication-engine';
import {
  FAB_CONFIGS, FAB_IDS, REPLICATION_PARAMS,
} from '@/lib/analytics/constants';
import type { FabId, ReplicationParam, TostResult, TransferFit } from '@/lib/analytics/types';
import type { ReplicationInputSnapshot } from '@/lib/analytics/analytics-sim';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import { useClientReady } from '@/hooks/use-client-ready';
import { KpiBox } from '@/components/analytics/KpiBox';
import { SYM } from '@/lib/analytics/symbols';

// ---------------------------------------------------------------------------
// Theming — accent palette + glass treatment per DESIGN.md
// ---------------------------------------------------------------------------

/** Per-fab accent colors, drawn from the DESIGN.md accent palette. */
const FAB_COLORS: Record<FabId, string> = {
  hq: '#22D3EE', // cyan (reference)
  satellite: '#8B5CF6', // violet
  'new-build': '#F59E0B', // orange
};

/** Themed recharts tooltip — surface #0f172a + cyan border (home dashboard). */
const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(34,211,238,0.45)',
  borderRadius: 12,
  color: '#f8fafc',
  fontSize: 12,
} as const;

const AXIS_STROKE = 'rgba(148,163,184,0.72)';
const GRID_STROKE = 'rgba(148,163,184,0.12)';

/** Glass panel shell matching the home dashboard sections. */
const GLASS_PANEL =
  'rounded-3xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl';

/** Inner card (fab tiles, chart wells). */
const GLASS_CARD =
  'rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.5)] backdrop-blur-md';

// ---------------------------------------------------------------------------
// Live → engine bridge (engine stays the source of truth; we only feed inputs)
// ---------------------------------------------------------------------------

interface FabComparison {
  fabData: Map<FabId, number[]>;
  tostResults: TostResult[];
  transferFits: TransferFit[];
}

/**
 * Run the existing replication-engine primitives against the live per-tick
 * snapshot. We do NOT re-implement any statistics here — we translate the
 * snapshot's per-fab `meanOffset`/`spread` into the bias/spreadFactor the engine
 * already consumes, and reseed with the tick so the distributions move with the
 * sim. When `snapshot` is null (paused / pre-hydration) we fall back to the
 * engineered `FAB_CONFIGS` defaults so the charts still render.
 */
function buildLiveComparison(
  parameter: ReplicationParam,
  sampleSize: number,
  margin: number,
  confidence: number,
  snapshot: ReplicationInputSnapshot | null,
  seed: number,
): FabComparison {
  const paramDef = REPLICATION_PARAMS.find((p) => p.id === parameter)!;

  const fabData = new Map<FabId, number[]>();
  for (const fabId of FAB_IDS) {
    const live = snapshot?.fabs.find((f) => f.id === fabId);
    const cfg = FAB_CONFIGS[fabId];
    // meanOffset is an absolute target offset; the engine bias is multiplicative
    // (mean = target * (1 + bias)), so convert offset → fractional bias.
    const bias = live ? live.meanOffset / (paramDef.target || 1) : cfg.bias;
    const spreadFactor = live ? live.spread : cfg.spreadFactor;
    fabData.set(
      fabId,
      generateFabData(fabId, parameter, sampleSize, bias, spreadFactor, seed),
    );
  }

  const pairs: [FabId, FabId][] = [
    ['hq', 'satellite'],
    ['hq', 'new-build'],
    ['satellite', 'new-build'],
  ];
  const tostResults = pairs.map(([f1, f2]) => {
    const result = tostEquivalence(fabData.get(f1)!, fabData.get(f2)!, margin, confidence);
    return { ...result, fab1: f1, fab2: f2 };
  });

  const hqData = fabData.get('hq')!;
  const transferFits: TransferFit[] = (['satellite', 'new-build'] as FabId[]).map((toFab) => {
    const toData = fabData.get(toFab)!;
    const minLen = Math.min(hqData.length, toData.length);
    const fit = fitTransferFunction(hqData.slice(0, minLen), toData.slice(0, minLen), 1);
    return { ...fit, fromFab: 'hq' as FabId, toFab };
  });

  return { fabData, tostResults, transferFits };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReplicationTab() {
  const clientReady = useClientReady();

  const {
    replicationParam, setReplicationParam,
    replicationMargin, replicationSampleSize, replicationConfidence,
    setReplicationMargin, setReplicationSampleSize,
  } = useAnalyticsStore();

  // Live snapshot for THIS module (granular selectors so unrelated ticks of
  // other modules don't re-render this tab).
  const liveSnapshot = useAnalyticsSimStore((s) => s.modules.replication);
  const elapsedTicks = useAnalyticsSimStore((s) => s.elapsedTicks);

  // ── Slider takeover (LOCAL state only — never touches the shared sim store) ──
  // While "exploring", this tab freezes on the snapshot captured at pause time
  // so the user can read their slider experiment without the data jumping.
  const [explore, setExplore] = useState<{
    snapshot: ReplicationInputSnapshot | null;
    seed: number;
  } | null>(null);

  const pauseLive = () => {
    if (explore) return;
    setExplore({ snapshot: liveSnapshot, seed: elapsedTicks });
  };
  const resumeLive = () => setExplore(null);

  // Active inputs: frozen snapshot while exploring, otherwise the live tick.
  const activeSnapshot = explore ? explore.snapshot : liveSnapshot;
  // Use the elapsed tick as the engine seed so distributions move each tick;
  // when paused, hold the captured seed steady.
  const activeSeed = explore ? explore.seed : elapsedTicks;

  const comparison = useMemo(
    () => buildLiveComparison(
      replicationParam,
      replicationSampleSize,
      replicationMargin,
      replicationConfidence,
      activeSnapshot,
      activeSeed,
    ),
    [replicationParam, replicationSampleSize, replicationMargin, replicationConfidence, activeSnapshot, activeSeed],
  );

  const paramDef = REPLICATION_PARAMS.find((p) => p.id === replicationParam)!;
  const passCount = comparison.tostResults.filter((r) => r.pass).length;
  const maxBias = Math.max(...comparison.tostResults.map((r) => Math.abs(r.meanDiff)));
  const transferR2 = activeSnapshot
    ? activeSnapshot.transferRSquared
    : comparison.transferFits[0]?.rSquared ?? null;

  // ── Chart data ──────────────────────────────────────────────────────────
  // TOST: one row per fab pair; error bar = CI, value = mean diff.
  const tostData = useMemo(
    () => comparison.tostResults.map((r) => ({
      pair: `${r.fab1.toUpperCase()} ${SYM.leftright} ${r.fab2.toUpperCase()}`,
      meanDiff: Number(r.meanDiff.toFixed(3)),
      ciLow: Number((r.meanDiff - r.ciLower).toFixed(3)),
      ciHigh: Number((r.ciUpper - r.meanDiff).toFixed(3)),
      pass: r.pass,
    })),
    [comparison.tostResults],
  );

  // Distribution overlays: a shared x grid with one pdf column per fab.
  const distData = useMemo(() => {
    const stats = new Map<FabId, { mean: number; std: number }>();
    const allVals: number[] = [];
    for (const [fabId, data] of comparison.fabData) {
      const mean = data.reduce((s, v) => s + v, 0) / data.length;
      const std = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length) || 1e-6;
      stats.set(fabId, { mean, std });
      allVals.push(...data);
    }
    const xMin = Math.min(...allVals, paramDef.lsl);
    const xMax = Math.max(...allVals, paramDef.usl);
    const points = 60;
    const dx = (xMax - xMin) / Math.max(1, points - 1);
    return Array.from({ length: points }, (_, i) => {
      const x = xMin + i * dx;
      const row: Record<string, number> = { x: Number(x.toFixed(2)) };
      for (const [fabId, { mean, std }] of stats) {
        const z = (x - mean) / std;
        row[fabId] = Number(((1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z)).toFixed(5));
      }
      return row;
    });
  }, [comparison.fabData, paramDef.lsl, paramDef.usl]);

  // Transfer fit: HQ (x) vs satellite (y) scatter + fitted line endpoints.
  const transfer = useMemo(() => {
    const hq = comparison.fabData.get('hq') ?? [];
    const sat = comparison.fabData.get('satellite') ?? [];
    const minLen = Math.min(hq.length, sat.length);
    const scatter = Array.from({ length: minLen }, (_, i) => ({ x: Number(hq[i].toFixed(3)), y: Number(sat[i].toFixed(3)) }));
    const fit = comparison.transferFits[0];
    const xMin = hq.length ? Math.min(...hq) : 0;
    const xMax = hq.length ? Math.max(...hq) : 1;
    const line = fit
      ? [
          { x: Number(xMin.toFixed(3)), y: Number((fit.coefficients[0] + fit.coefficients[1] * xMin).toFixed(3)) },
          { x: Number(xMax.toFixed(3)), y: Number((fit.coefficients[0] + fit.coefficients[1] * xMax).toFixed(3)) },
        ]
      : [];
    return { scatter, line, xMin, xMax };
  }, [comparison.fabData, comparison.transferFits]);

  const chartFallback = (
    <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-[var(--sf-text-secondary)]">
      Initializing replication telemetry...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Title + plain-language caption (progressive disclosure) */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sf-accent-cyan)]">
            Multi-Fab Replication
          </h2>
          <p className="mt-1 text-sm text-[var(--sf-text-secondary)]">
            Checks that three fabs make the same chip the same way &mdash; statistically equivalent, not just &ldquo;close enough&rdquo;.
          </p>
        </div>
        {explore ? (
          <div className="flex items-center gap-3">
            <span
              role="status"
              className="rounded-full border border-[rgba(245,158,11,0.5)] bg-[rgba(245,158,11,0.12)] px-3 py-1 font-mono text-xs uppercase tracking-[0.16em] text-[var(--sf-accent-orange)]"
            >
              Paused {SYM.dash} exploring
            </span>
            <button
              type="button"
              onClick={resumeLive}
              className="min-h-[44px] rounded-full border border-[rgba(34,211,238,0.45)] bg-[rgba(34,211,238,0.1)] px-4 py-2 text-sm font-semibold text-[var(--sf-accent-cyan)] transition-colors hover:bg-[rgba(34,211,238,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]"
            >
              Resume live
            </button>
          </div>
        ) : (
          <span
            role="status"
            className="rounded-full border border-[rgba(34,211,238,0.35)] px-3 py-1 font-mono text-xs uppercase tracking-[0.16em] text-[var(--sf-accent-cyan)]"
          >
            Live
          </span>
        )}
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiBox label="Fab Count" value="3" plain="Sites compared" />
        <KpiBox label="Params Matched" value={`${passCount}/3`} plain="Pairs that match" />
        <KpiBox label="Pass Rate" value={`${((passCount / 3) * 100).toFixed(0)}%`} accent="#10B981" />
        <KpiBox label="Max Bias" value={maxBias.toFixed(2)} accent="#F59E0B" />
        <KpiBox
          label={`Transfer R${SYM.sup2}`}
          value={transferR2 != null ? transferR2.toFixed(3) : SYM.dash}
          accent="#8B5CF6"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Controls + fab roster */}
        <div className={`space-y-4 ${GLASS_PANEL}`}>
          <div className="grid grid-cols-3 gap-2">
            {FAB_IDS.map((id) => {
              const cfg = FAB_CONFIGS[id];
              const fabData = comparison.fabData.get(id);
              const cpk = fabData ? computeCpk(fabData, paramDef.usl, paramDef.lsl) : 0;
              return (
                <div key={id} className={`${GLASS_CARD} p-2 text-center`}>
                  <div className="text-xs font-semibold text-[var(--sf-text-primary)]">{cfg.name}</div>
                  <div className="text-[11px] text-[var(--sf-text-secondary)]">{cfg.location}</div>
                  <div
                    className={`mt-1 inline-block rounded px-1.5 text-[11px] ${
                      cfg.maturity === 'Mature'
                        ? 'bg-[rgba(16,185,129,0.16)] text-[#34D399]'
                        : cfg.maturity === 'Established'
                          ? 'bg-[rgba(59,130,246,0.16)] text-[#60A5FA]'
                          : 'bg-[rgba(245,158,11,0.16)] text-[#FBBF24]'
                    }`}
                  >
                    {cfg.maturity}
                  </div>
                  <div className="mt-1 font-mono text-xs tabular-nums text-[var(--sf-text-secondary)]">
                    Cpk {Number.isFinite(cpk) ? cpk.toFixed(2) : SYM.dash}
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <label htmlFor="repl-param" className="text-sm text-[var(--sf-text-secondary)]">Parameter</label>
            <select
              id="repl-param"
              aria-label="Parameter"
              value={replicationParam}
              onChange={(e) => setReplicationParam(e.target.value as ReplicationParam)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.5)] px-3 py-2 text-sm text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
            >
              {REPLICATION_PARAMS.map((p) => (
                <option key={p.id} value={p.id}>{p.label} ({p.unit})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="repl-margin" className="text-sm text-[var(--sf-text-secondary)]">
              Equivalence Margin ({SYM.plusminus})
            </label>
            <input
              id="repl-margin"
              aria-label="Equivalence Margin"
              type="range"
              min={0.5}
              max={5}
              step={0.1}
              value={replicationMargin}
              onChange={(e) => { pauseLive(); setReplicationMargin(Number(e.target.value)); }}
              className="mt-1 h-2 w-full cursor-pointer accent-[#22D3EE]"
            />
            <span className="font-mono text-sm tabular-nums text-[var(--sf-text-secondary)]">
              {SYM.plusminus}{replicationMargin}
            </span>
          </div>

          <div>
            <label htmlFor="repl-sample" className="text-sm text-[var(--sf-text-secondary)]">Sample Size</label>
            <input
              id="repl-sample"
              aria-label="Sample Size"
              type="range"
              min={30}
              max={100}
              step={10}
              value={replicationSampleSize}
              onChange={(e) => { pauseLive(); setReplicationSampleSize(Number(e.target.value)); }}
              className="mt-1 h-2 w-full cursor-pointer accent-[#22D3EE]"
            />
            <span className="font-mono text-sm tabular-nums text-[var(--sf-text-secondary)]">{replicationSampleSize}</span>
          </div>

          <div className="space-y-1">
            {comparison.tostResults.map((r) => (
              <div key={`${r.fab1}-${r.fab2}`} className="flex justify-between text-sm">
                <span className="text-[var(--sf-text-secondary)]">
                  {r.fab1.toUpperCase()} {SYM.leftright} {r.fab2.toUpperCase()}
                </span>
                <span className={r.pass ? 'font-semibold text-[#34D399]' : 'font-semibold text-[#F87171]'}>
                  {r.pass ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-4">
          <div className={`${GLASS_PANEL}`}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-secondary)]">
              TOST Equivalence (mean diff {SYM.plusminus} CI)
            </h3>
            <div className="h-[180px]" data-testid="replication-chart-tost">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart layout="vertical" data={tostData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                    <XAxis type="number" stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="pair" stroke={AXIS_STROKE} fontSize={11} width={120} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(34,211,238,0.08)' }} />
                    <ReferenceLine x={0} stroke="rgba(148,163,184,0.5)" />
                    <ReferenceLine x={replicationMargin} stroke="#EF4444" strokeDasharray="4 4" />
                    <ReferenceLine x={-replicationMargin} stroke="#EF4444" strokeDasharray="4 4" />
                    <Line dataKey="meanDiff" stroke="none" isAnimationActive={false} dot={{ r: 5, fill: '#22D3EE' }}>
                      <ErrorBar dataKey="ciLow" width={4} strokeWidth={2} stroke="#8B5CF6" direction="x" />
                      <ErrorBar dataKey="ciHigh" width={4} strokeWidth={2} stroke="#8B5CF6" direction="x" />
                    </Line>
                  </ComposedChart>
                </ResponsiveContainer>
              ) : chartFallback}
            </div>
          </div>

          <div className={`${GLASS_PANEL}`}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-secondary)]">
              Distribution Overlay vs Spec Limits
            </h3>
            <div className="h-[180px]" data-testid="replication-chart-dist">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={distData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <ReferenceLine x={paramDef.usl} stroke="#EF4444" strokeDasharray="4 4" />
                    <ReferenceLine x={paramDef.lsl} stroke="#EF4444" strokeDasharray="4 4" />
                    {FAB_IDS.map((id) => (
                      <Line key={id} type="monotone" dataKey={id} stroke={FAB_COLORS[id]} strokeWidth={2} dot={false} isAnimationActive={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : chartFallback}
            </div>
          </div>

          <div className={`${GLASS_PANEL}`}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-secondary)]">
              Transfer Fit {SYM.dash} HQ vs Satellite
            </h3>
            <div className="h-[180px]" data-testid="replication-chart-transfer">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} />
                    <XAxis type="number" dataKey="x" name="HQ" stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} />
                    <YAxis type="number" dataKey="y" name="Satellite" stroke={AXIS_STROKE} fontSize={11} tickLine={false} axisLine={false} domain={['dataMin', 'dataMax']} />
                    <ZAxis range={[24, 24]} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(34,211,238,0.4)' }} />
                    <Scatter name="Wafers" data={transfer.scatter} fill="rgba(139,92,246,0.45)" isAnimationActive={false} />
                    <Scatter name="Transfer fit" data={transfer.line} line={{ stroke: '#8B5CF6', strokeWidth: 2 }} fill="#8B5CF6" shape={() => <g />} isAnimationActive={false} />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : chartFallback}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
