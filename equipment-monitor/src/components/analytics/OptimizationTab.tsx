'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  evaluateObjectives,
  generateParetoFrontier,
  computeSensitivity,
  checkConstraints,
} from '@/lib/analytics/optimization-engine';
import {
  DEFAULT_RECIPE_KNOBS,
  DEFAULT_CONSTRAINTS,
  STEP_SHORT_NAMES,
  OBJECTIVES,
} from '@/lib/analytics/constants';
import type { ObjectiveId } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import { SYM } from '@/lib/analytics/symbols';
import { KpiBox } from '@/components/analytics/KpiBox';

// ---------------------------------------------------------------------------
// Shared glass + chart styling (matches the home dashboard).
// ---------------------------------------------------------------------------

const GLASS_CARD =
  'rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl';

const CHART_TOOLTIP = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(34,211,238,0.45)',
  borderRadius: 12,
  color: '#f8fafc',
  fontSize: 12,
} as const;

const ACCENT_CYAN = '#22D3EE';
const ACCENT_ORANGE = '#F47920';
const ACCENT_VIOLET = '#8B5CF6';
const STATUS_GREEN = '#22C55E';
const STATUS_RED = '#EF4444';
const GRID_LINE = 'rgba(148,163,184,0.18)';
const AXIS_TICK = { fill: '#94A3B8', fontSize: 10 } as const;

/** Human-readable objective labels for axes/tooltips. */
const OBJ_LABELS: Record<ObjectiveId, string> = {
  yield: 'Yield (%)',
  throughput: 'Throughput (wph)',
  cost: 'Cost ($/wafer)',
  defectDensity: `Defect density (D${SYM.sub0})`,
};

export function OptimizationTab() {
  const { optimizationObjectives, setOptimizationObjectives } = useAnalyticsStore();

  // ── Live optimization snapshot from the shared sim store ──────────────────
  // Granular selectors so this tab only re-renders on its own slice + the tick.
  const liveObjectives = useAnalyticsSimStore((s) => s.modules.optimization.objectives);
  const liveRSquared = useAnalyticsSimStore((s) => s.modules.optimization.rSquared);
  const elapsedTicks = useAnalyticsSimStore((s) => s.elapsedTicks);

  // ── Slider takeover (LOCAL state — never touches the shared store) ────────
  // Moving any slider pauses THIS tab's live updates; "Resume live" clears it.
  const [recipe, setRecipe] = useState(DEFAULT_RECIPE_KNOBS.map((k) => k.value));
  const [exploring, setExploring] = useState(false);
  const [constraints] = useState(DEFAULT_CONSTRAINTS);

  const onSlide = (i: number, next: number) => {
    // Grabbing a slider takes THIS tab off live updates: the operating point,
    // KPIs and the R² trend stop chasing the tick until "Resume live".
    if (!exploring) setExploring(true);
    setRecipe((prev) => {
      const copy = [...prev];
      copy[i] = next;
      return copy;
    });
  };

  const resumeLive = () => setExploring(false);

  // While exploring, the operating point is the user's what-if recipe; while
  // live, it is the fab's current telemetry (D3: feed the engine the snapshot,
  // do not re-derive the objective math here).
  const exploreObjectives = useMemo(() => evaluateObjectives(recipe), [recipe]);
  const operatingPoint = useMemo(
    () =>
      exploring
        ? exploreObjectives
        : {
            yield: liveObjectives.yield,
            throughput: liveObjectives.throughput,
            cost: liveObjectives.cost,
            defectDensity: liveObjectives.defectDensity,
          },
    [exploring, exploreObjectives, liveObjectives],
  );

  const [obj1, obj2] = optimizationObjectives;
  const frontier = useMemo(
    () => generateParetoFrontier([obj1, obj2], constraints, 100),
    [obj1, obj2, constraints],
  );
  const sensitivity = useMemo(
    () => computeSensitivity(recipe, obj1, 0.1),
    [recipe, obj1],
  );
  const { feasible, violations } = checkConstraints(operatingPoint, constraints);
  const nonDom = frontier.filter((p) => !p.dominated);

  // ── Chart data ────────────────────────────────────────────────────────────
  const dominatedData = useMemo(
    () =>
      frontier
        .filter((p) => p.dominated)
        .map((p) => ({ x: p.objectives[obj1], y: p.objectives[obj2] })),
    [frontier, obj1, obj2],
  );
  const frontierData = useMemo(
    () =>
      frontier
        .filter((p) => !p.dominated)
        .map((p) => ({ x: p.objectives[obj1], y: p.objectives[obj2] }))
        .sort((a, b) => a.x - b.x),
    [frontier, obj1, obj2],
  );
  const currentData = useMemo(
    () => [{ x: operatingPoint[obj1], y: operatingPoint[obj2] }],
    [operatingPoint, obj1, obj2],
  );

  const tornadoData = useMemo(
    () => sensitivity.map((b) => ({ label: b.label, impact: b.impact })),
    [sensitivity],
  );

  // Live R² history for the response-surface fit quality panel. We accumulate
  // during render (React's sanctioned "adjust state when an input changes"
  // pattern — the same family KpiBox uses) rather than in an effect, so the
  // React Compiler does not flag a cascading setState-in-effect. A guard tick
  // ensures each live tick is appended exactly once and pauses while exploring.
  const [rSquaredHistory, setRSquaredHistory] = useState<{ tick: number; r2: number }[]>([]);
  const [lastRecordedTick, setLastRecordedTick] = useState(-1);

  if (!exploring && elapsedTicks !== lastRecordedTick) {
    setLastRecordedTick(elapsedTicks);
    setRSquaredHistory((prev) => {
      const point = { tick: elapsedTicks, r2: Number((liveRSquared * 100).toFixed(2)) };
      const next = [...prev, point];
      return next.length > 40 ? next.slice(next.length - 40) : next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Title + plain-language caption (progressive disclosure for non-experts) */}
      <header className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sf-accent-cyan)]">
            Cross-Process Optimization
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-snug text-[var(--sf-text-secondary)]">
            Trade off yield, throughput, cost and defects across every process step at
            once &mdash; the cyan curve is the best you can do, the orange dot is where
            the fab is running now.
          </p>
        </div>

        {/* Live / paused status badge + resume control */}
        {exploring ? (
          <div className="flex items-center gap-2">
            <span
              data-testid="opt-explore-badge"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(244,121,32,0.5)] bg-[rgba(244,121,32,0.12)] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--sf-accent-orange)]"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--sf-accent-orange)]" aria-hidden="true" />
              Paused {SYM.dash} exploring
            </span>
            <button
              type="button"
              onClick={resumeLive}
              className="min-h-[44px] rounded-xl border border-[rgba(34,211,238,0.45)] bg-[rgba(34,211,238,0.1)] px-4 py-2 text-sm font-semibold text-[var(--sf-accent-cyan)] transition-colors hover:bg-[rgba(34,211,238,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]"
            >
              Resume live
            </button>
          </div>
        ) : (
          <span
            data-testid="opt-live-badge"
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(34,211,238,0.35)] px-3 py-1.5 font-mono text-xs uppercase tracking-[0.16em] text-[var(--sf-accent-cyan)]"
            aria-live="off"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--sf-accent-cyan)]" aria-hidden="true" />
            Live {SYM.dash} fab telemetry
          </span>
        )}
      </header>

      {/* KPI strip — live operating point fed from the snapshot */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiBox
          label="Pareto Solutions"
          value={`${nonDom.length}`}
          plain="Recipes that can't be beaten on both goals"
        />
        <KpiBox
          label="Current Yield"
          value={`${operatingPoint.yield.toFixed(1)}%`}
          accent={ACCENT_CYAN}
        />
        <KpiBox
          label="Throughput"
          value={`${operatingPoint.throughput.toFixed(0)} wph`}
          accent={ACCENT_VIOLET}
        />
        <KpiBox
          label="Violations"
          value={violations.length > 0 ? violations.join(', ') : 'None'}
          accent={violations.length > 0 ? STATUS_RED : STATUS_GREEN}
        />
        <KpiBox
          label="Feasible"
          value={feasible ? 'Yes' : 'No'}
          accent={feasible ? STATUS_GREEN : STATUS_RED}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Controls panel */}
        <div className={`${GLASS_CARD} space-y-3`}>
          <div className="text-sm font-medium text-[var(--sf-text-secondary)]">
            Objectives (select 2)
          </div>
          <div className="flex flex-wrap gap-2">
            {OBJECTIVES.map((o) => {
              const active = optimizationObjectives.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    const current = [...optimizationObjectives];
                    if (current.includes(o.id)) {
                      if (current.length > 1) {
                        setOptimizationObjectives(current.filter((x) => x !== o.id));
                      }
                    } else {
                      setOptimizationObjectives([...current.slice(-1), o.id]);
                    }
                  }}
                  className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] ${
                    active
                      ? 'border border-[rgba(34,211,238,0.5)] bg-[rgba(34,211,238,0.18)] text-[var(--sf-accent-cyan)]'
                      : 'border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.5)] text-[var(--sf-text-secondary)] hover:border-[rgba(34,211,238,0.4)]'
                  }`}
                >
                  {o.id} ({o.direction === 'maximize' ? SYM.arrowUp : SYM.arrowDown})
                </button>
              );
            })}
          </div>

          <div className="text-sm text-[var(--sf-text-secondary)]">
            Min Yield {SYM.gte} {constraints.minYield}%
          </div>

          {DEFAULT_RECIPE_KNOBS.map((knob, i) => (
            <div key={knob.stepId}>
              <label
                htmlFor={`knob-${knob.stepId}`}
                className="text-sm text-[var(--sf-text-secondary)]"
              >
                {STEP_SHORT_NAMES[knob.stepId]} {knob.label}
              </label>
              <input
                id={`knob-${knob.stepId}`}
                aria-label={`${STEP_SHORT_NAMES[knob.stepId]} ${knob.label}`}
                type="range"
                min={knob.min}
                max={knob.max}
                step={(knob.max - knob.min) / 100}
                value={recipe[i]}
                onChange={(e) => onSlide(i, Number(e.target.value))}
                className="h-11 w-full cursor-pointer accent-[var(--sf-accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]"
              />
            </div>
          ))}
        </div>

        {/* Charts column */}
        <div className="space-y-4">
          {/* Pareto frontier scatter */}
          <div className={GLASS_CARD}>
            <div className="mb-2 text-sm font-medium text-[var(--sf-text-secondary)]">
              Pareto Frontier {SYM.dash} {OBJ_LABELS[obj1]} {SYM.leftright} {OBJ_LABELS[obj2]}
            </div>
            <div className="h-[200px]" data-testid="opt-chart-pareto">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke={GRID_LINE} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={OBJ_LABELS[obj1]}
                    tick={AXIS_TICK}
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={OBJ_LABELS[obj2]}
                    tick={AXIS_TICK}
                    width={42}
                    domain={['dataMin', 'dataMax']}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ stroke: ACCENT_CYAN, strokeOpacity: 0.3 }} />
                  <Scatter
                    name="Dominated"
                    data={dominatedData}
                    fill="#64748B"
                    fillOpacity={0.4}
                    isAnimationActive={false}
                  />
                  <Scatter
                    name="Pareto front"
                    data={frontierData}
                    fill={ACCENT_CYAN}
                    line={{ stroke: ACCENT_CYAN, strokeWidth: 1.5 }}
                    isAnimationActive={false}
                  />
                  <Scatter
                    name="Operating point"
                    data={currentData}
                    fill={ACCENT_ORANGE}
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response-surface fit quality (live R²) */}
          <div className={GLASS_CARD}>
            <div className="mb-2 flex items-center justify-between text-sm font-medium text-[var(--sf-text-secondary)]">
              <span>Response Surface fit {SYM.dash} live R{SYM.sup2}</span>
              <span className="font-mono text-[var(--sf-accent-cyan)]">
                {(liveRSquared * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-[160px]" data-testid="opt-chart-rsm">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  data={rSquaredHistory}
                  margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
                >
                  <CartesianGrid stroke={GRID_LINE} />
                  <XAxis
                    type="number"
                    dataKey="tick"
                    name="Tick"
                    tick={AXIS_TICK}
                    domain={['dataMin', 'dataMax']}
                  />
                  <YAxis
                    type="number"
                    dataKey="r2"
                    name={`R${SYM.sup2} (%)`}
                    tick={AXIS_TICK}
                    width={42}
                    domain={[70, 100]}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ stroke: ACCENT_CYAN, strokeOpacity: 0.3 }} />
                  <Scatter
                    name={`R${SYM.sup2}`}
                    data={rSquaredHistory}
                    fill={ACCENT_VIOLET}
                    line={{ stroke: ACCENT_VIOLET, strokeWidth: 1.5 }}
                    isAnimationActive={false}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tornado sensitivity */}
          <div className={GLASS_CARD}>
            <div className="mb-2 text-sm font-medium text-[var(--sf-text-secondary)]">
              Sensitivity {SYM.dash} impact on {obj1}
            </div>
            <div className="h-[200px]" data-testid="opt-chart-tornado">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={tornadoData}
                  margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                >
                  <CartesianGrid stroke={GRID_LINE} horizontal={false} />
                  <XAxis type="number" tick={AXIS_TICK} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={AXIS_TICK}
                    width={88}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ fill: 'rgba(34,211,238,0.08)' }} />
                  <Bar dataKey="impact" isAnimationActive={false} radius={[0, 3, 3, 0]}>
                    {tornadoData.map((b) => (
                      <Cell
                        key={b.label}
                        fill={b.impact >= 0 ? STATUS_GREEN : STATUS_RED}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
