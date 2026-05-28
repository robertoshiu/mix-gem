'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  generateSystemRBD,
  generateLifeProjection,
  accelerationFactor,
} from '@/lib/analytics/reliability-engine';
import type { RbdTopology, Subsystem } from '@/lib/analytics/types';
import { DEFAULT_SUBSYSTEMS } from '@/lib/analytics/constants';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import type { ReliabilityInputSnapshot } from '@/lib/analytics/analytics-sim';
import { useClientReady } from '@/hooks/use-client-ready';
import { KpiBox } from './KpiBox';
import { SYM } from '@/lib/analytics/symbols';

// ---------------------------------------------------------------------------
// Reliability — RBD availability + accelerated-life projection (live).
//
// Live data flow (DESIGN.md D3 — single source of truth):
//   tick snapshot (analytics-sim) → reliability-engine math → this view.
// The snapshot only nudges the ENGINE INPUTS. To keep the existing engine the
// source of truth we map each subsystem's live availability back onto its
// repair rate (µ) while preserving the user's failure-rate (λ) slider:
//     A = µ / (λ + µ)  ⇒  µ = λ · A / (1 − A)
// so `generateSystemRBD` still does all the topology composition, and the live
// snapshot just animates the per-subsystem availability over the 3-min loop.
// ---------------------------------------------------------------------------

/** Home-dashboard glass + cyan tooltip theme, shared by both charts. */
const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid rgba(34,211,238,0.45)',
  borderRadius: 12,
  color: '#f8fafc',
} as const;

const AXIS_STROKE = 'rgba(148,163,184,0.72)';
const GRID_STROKE = 'rgba(148,163,184,0.12)';

/** Availability → status color (matches the legacy RBD block coloring). */
function availColor(availability: number): string {
  if (availability > 0.99) return '#22C55E';
  if (availability > 0.95) return '#F59E0B';
  return '#EF4444';
}

/**
 * Recover the live repair rate µ from a target availability while keeping the
 * user's λ. Guards the asymptote at A→1 so µ stays finite.
 */
function liveMu(lambda: number, availability: number): number {
  const a = Math.min(Math.max(availability, 0.0001), 0.9995);
  return (lambda * a) / (1 - a);
}

function ReliabilityTabComponent() {
  const { rbdTopology, setRbdTopology, reliabilityEa, setReliabilityEa, reliabilityUseTemp } =
    useAnalyticsStore();

  // Base subsystem definitions (user-tunable λ / µ via sliders).
  const [subsystems, setSubsystems] = useState<Subsystem[]>(
    DEFAULT_SUBSYSTEMS.map((s) => ({ ...s })),
  );

  // SLIDER TAKEOVER — local-only. When the user grabs any control in this tab
  // we pause THIS tab's live updates (Hero keeps running) and surface a badge +
  // "Resume live" affordance. State is intentionally NOT in the shared store.
  const [paused, setPaused] = useState(false);

  // Live snapshot for this module from the shared tick driver. Granular
  // selector → only re-renders when the reliability slice changes.
  const liveSnapshot = useAnalyticsSimStore(
    (s) => s.modules.reliability,
  ) as ReliabilityInputSnapshot;
  const clientReady = useClientReady();

  // Whether live data is currently flowing into this tab.
  const live = clientReady && !paused;

  // Compose the effective subsystems fed to the engine. When live, each base
  // subsystem's µ is recomputed from the snapshot availability (keeping λ); when
  // paused/exploring, the user's raw λ/µ sliders drive the engine unchanged.
  const effectiveSubsystems = useMemo<Subsystem[]>(() => {
    if (!live) return subsystems;
    const bySnapshot = new Map(liveSnapshot.availabilities.map((a) => [a.id, a.availability]));
    return subsystems.map((s) => {
      const liveAvail = bySnapshot.get(s.id);
      if (liveAvail == null) return s;
      return { ...s, mu: liveMu(s.lambda, liveAvail) };
    });
  }, [live, subsystems, liveSnapshot]);

  // Live activation-energy / junction-temp readout when flowing; otherwise the
  // explored slider values. The engine math is reused for everything below.
  const ea = reliabilityEa;
  const refTempC = live ? liveSnapshot.junctionTempC : 125;

  const rbdResult = useMemo(
    () => generateSystemRBD(effectiveSubsystems, rbdTopology),
    [effectiveSubsystems, rbdTopology],
  );
  const lifeProjection = useMemo(
    () => generateLifeProjection(ea, 0, 0, reliabilityUseTemp, 50),
    [ea, reliabilityUseTemp],
  );
  const afRef = accelerationFactor(ea, reliabilityUseTemp + 273.15, refTempC + 273.15);

  // ---- Chart data -------------------------------------------------------
  const rbdData = useMemo(
    () =>
      rbdResult.subsystemAvails.map((s) => ({
        id: s.id.slice(0, 4).toUpperCase(),
        availabilityPct: Number((s.availability * 100).toFixed(3)),
        color: availColor(s.availability),
      })),
    [rbdResult],
  );

  const lifeData = useMemo(
    () =>
      lifeProjection.map((p) => ({
        tempC: Math.round(p.tempC),
        arrhenius: Number(Math.log10(Math.max(1, p.arrhenius)).toFixed(3)),
        eyring: Number(Math.log10(Math.max(1, p.eyring)).toFixed(3)),
      })),
    [lifeProjection],
  );

  // ---- Handlers ---------------------------------------------------------
  // Any slider interaction is a "takeover": pause live, keep the explored value.
  const takeover = useCallback(() => setPaused(true), []);
  const resumeLive = useCallback(() => setPaused(false), []);

  const onEaChange = useCallback(
    (value: number) => {
      takeover();
      setReliabilityEa(value);
    },
    [takeover, setReliabilityEa],
  );

  const onSubsystemChange = useCallback(
    (index: number, field: 'lambda' | 'mu', value: number) => {
      takeover();
      setSubsystems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [takeover],
  );

  const topologies: RbdTopology[] = ['series', 'parallel', 'series-parallel'];
  const topologyLabel = (t: RbdTopology) =>
    t === 'series-parallel' ? 'Series-Parallel' : t.charAt(0).toUpperCase() + t.slice(1);

  return (
    <div className="space-y-4">
      {/* Title + plain-language caption (progressive disclosure / a11y) */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-primary)]">
            Reliability {SYM.dash} RBD &amp; Accelerated Life
          </h2>
          <p className="mt-1 text-sm text-[var(--sf-text-secondary)]">
            How likely the whole tool stays up, and how temperature stress shortens its life.
          </p>
        </div>

        {/* Live / paused status + resume control */}
        <div className="flex items-center gap-2">
          {paused ? (
            <>
              <span
                data-testid="reliability-paused-badge"
                className="rounded-full border border-[rgba(245,158,11,0.5)] bg-[rgba(245,158,11,0.12)] px-3 py-1 font-mono text-xs font-semibold tracking-wide text-[#FBBF24]"
              >
                PAUSED {SYM.dash} exploring
              </span>
              <button
                type="button"
                onClick={resumeLive}
                className="inline-flex min-h-[44px] items-center rounded-xl border border-[rgba(34,211,238,0.45)] bg-[rgba(34,211,238,0.10)] px-4 text-sm font-semibold text-[var(--sf-accent-cyan)] transition-colors hover:bg-[rgba(34,211,238,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]"
              >
                Resume live
              </button>
            </>
          ) : (
            <span
              data-testid="reliability-live-badge"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.10)] px-3 py-1 font-mono text-xs font-semibold tracking-wide text-[#34D399]"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34D399] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10B981]" />
              </span>
              LIVE
            </span>
          )}
        </div>
      </header>

      {/* KPI strip — fed by the engine, animated by the live snapshot */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiBox
          label="System Availability"
          value={`${(rbdResult.systemAvail * 100).toFixed(2)}%`}
          plain="Chance the full tool is running."
        />
        <KpiBox label="System MTBF" value={`${rbdResult.systemMtbf.toFixed(0)}h`} accent="var(--sf-accent-blue)" />
        <KpiBox label="Worst Subsystem" value={rbdResult.bottleneck} accent="#F59E0B" />
        <KpiBox label="Activation Energy" value={`${ea.toFixed(2)} eV`} accent="var(--sf-accent-violet)" />
        <KpiBox
          label={`AF @${refTempC.toFixed(0)}${SYM.deg}C`}
          value={`${afRef.toFixed(1)}${SYM.times}`}
          accent="#EF4444"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-4 rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          {/* Topology selector */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="RBD topology">
            {topologies.map((t) => {
              const active = rbdTopology === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRbdTopology(t)}
                  className={`inline-flex min-h-[44px] items-center rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] ${
                    active
                      ? 'border-[rgba(34,211,238,0.6)] bg-[rgba(34,211,238,0.16)] text-[var(--sf-accent-cyan)]'
                      : 'border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.5)] text-[var(--sf-text-secondary)] hover:text-[var(--sf-text-primary)]'
                  }`}
                >
                  {topologyLabel(t)}
                </button>
              );
            })}
          </div>

          {/* Activation energy */}
          <div>
            <label
              htmlFor="reliability-ea"
              className="flex items-center justify-between text-sm text-[var(--sf-text-secondary)]"
            >
              <span>Activation Energy (eV)</span>
              <span className="font-mono tabular-nums text-[var(--sf-text-primary)]">
                {ea.toFixed(2)} eV
              </span>
            </label>
            <input
              id="reliability-ea"
              type="range"
              min={0.3}
              max={1.2}
              step={0.01}
              value={ea}
              onChange={(e) => onEaChange(Number(e.target.value))}
              className="mt-2 h-2 w-full cursor-pointer accent-[var(--sf-accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)]"
            />
          </div>

          {/* Per-subsystem λ / µ sliders */}
          <div className="space-y-3">
            {subsystems.map((s, i) => (
              <div key={s.id} className="grid grid-cols-3 items-center gap-2 text-sm">
                <span className="text-[var(--sf-text-secondary)]">{s.name}</span>
                <div>
                  <label
                    htmlFor={`rel-lambda-${s.id}`}
                    className="block font-mono text-xs text-[var(--sf-text-secondary)]"
                  >
                    {SYM.lambda} {s.lambda.toFixed(1)}
                  </label>
                  <input
                    id={`rel-lambda-${s.id}`}
                    type="range"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={s.lambda}
                    onChange={(e) => onSubsystemChange(i, 'lambda', Number(e.target.value))}
                    aria-label={`${s.name} failure rate ${SYM.lambda}`}
                    className="h-2 w-full cursor-pointer accent-[var(--sf-accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`rel-mu-${s.id}`}
                    className="block font-mono text-xs text-[var(--sf-text-secondary)]"
                  >
                    {SYM.mu} {s.mu.toFixed(0)}
                  </label>
                  <input
                    id={`rel-mu-${s.id}`}
                    type="range"
                    min={1}
                    max={50}
                    step={1}
                    value={s.mu}
                    onChange={(e) => onSubsystemChange(i, 'mu', Number(e.target.value))}
                    aria-label={`${s.name} repair rate ${SYM.mu}`}
                    className="h-2 w-full cursor-pointer accent-[var(--sf-accent-cyan)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)]"
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-[var(--sf-text-secondary)]">
              {SYM.lambda} = failure rate, {SYM.mu} = repair rate. Availability A ={' '}
              {SYM.mu}/({SYM.lambda}+{SYM.mu}).
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-4">
          {/* RBD per-subsystem availability */}
          <div className="rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-secondary)]">
                Subsystem Availability {SYM.dash} {topologyLabel(rbdTopology)}
              </h3>
            </div>
            <div className="h-[230px]" data-testid="reliability-chart-rbd">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rbdData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis
                      dataKey="id"
                      stroke={AXIS_STROKE}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[80, 100]}
                      stroke={AXIS_STROKE}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: 'rgba(34,211,238,0.08)' }}
                      formatter={(value) => [`${value}%`, 'Availability']}
                    />
                    <Bar dataKey="availabilityPct" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {rbdData.map((d) => (
                        <Cell key={d.id} fill={d.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-[var(--sf-text-secondary)]">
                  Initializing RBD telemetry...
                </div>
              )}
            </div>
          </div>

          {/* Accelerated-life projection (log10 hours vs temperature) */}
          <div className="rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-secondary)]">
                Accelerated Life {SYM.dash} log{SYM.sub0} hours
              </h3>
              <span className="font-mono text-xs text-[var(--sf-text-secondary)]">
                use {reliabilityUseTemp}
                {SYM.deg}C
              </span>
            </div>
            <div className="h-[230px]" data-testid="reliability-chart-life">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={lifeData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rel-arrhenius" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis
                      dataKey="tempC"
                      stroke={AXIS_STROKE}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      unit={SYM.deg}
                    />
                    <YAxis
                      stroke={AXIS_STROKE}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ stroke: 'rgba(34,211,238,0.3)' }}
                      labelFormatter={(label) => `${label}${SYM.deg}C`}
                    />
                    <Area
                      type="monotone"
                      dataKey="arrhenius"
                      name="Arrhenius"
                      stroke="#3B82F6"
                      fill="url(#rel-arrhenius)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="eyring"
                      name="Eyring"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <ReferenceLine
                      x={reliabilityUseTemp}
                      stroke="#EF4444"
                      strokeDasharray="4 4"
                      label={{
                        value: `${reliabilityUseTemp}${SYM.deg}C`,
                        position: 'insideTopRight',
                        fill: '#EF4444',
                        fontSize: 10,
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-[var(--sf-text-secondary)]">
                  Initializing life-projection telemetry...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Memoized so the shared 1 Hz tick only re-renders this tab when its slice moves. */
export const ReliabilityTab = memo(ReliabilityTabComponent);

export default ReliabilityTab;
