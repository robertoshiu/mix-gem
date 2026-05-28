'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { simulateRuns, computeResidualStats } from '@/lib/analytics/apc-engine';
import type { DriftType, DriftConfig } from '@/lib/analytics/types';
import { useAnalyticsStore } from '@/stores/analytics-store';
import { useAnalyticsSimStore } from '@/stores/analytics-sim-store';
import { useClientReady } from '@/hooks/use-client-ready';
import { SYM } from '@/lib/analytics/symbols';
import { KpiBox } from '@/components/analytics/KpiBox';

const DRIFT_OPTIONS: { value: DriftType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'linear', label: 'Linear' },
  { value: 'sinusoidal', label: 'Sinusoidal' },
  { value: 'step-shift', label: 'Step-Shift' },
  { value: 'mixed', label: 'Mixed' },
];

/** Themed recharts tooltip — surface #0f172a + cyan border, matches the home dashboard. */
const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid var(--sf-accent-cyan)',
  borderRadius: 12,
  color: '#f8fafc',
  fontSize: 12,
} as const;

const AXIS_STROKE = 'rgba(148,163,184,0.72)';
const GRID_STROKE = 'rgba(148,163,184,0.12)';

/** Accent palette (DESIGN.md): cyan primary, blue controlled, red uncontrolled, slate target. */
const COLOR_CONTROLLED = 'var(--sf-accent-blue)';
const COLOR_UNCONTROLLED = 'var(--sf-status-red)';
const COLOR_EWMA = 'var(--sf-accent-cyan)';
const COLOR_TARGET = 'rgba(226,232,240,0.45)';

/** Glass container shell matching the home dashboard treatment. */
function GlassCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--sf-accent-cyan)]">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** The four live/explore inputs the apc-engine consumes. */
interface ApcInputs {
  lambda: number;
  lambdaSlope: number;
  noise: number;
  driftType: DriftType;
}

export function ApcTab() {
  const clientReady = useClientReady();

  // Static config that is not part of the live simulation channel.
  const apcTarget = useAnalyticsStore((s) => s.apcTarget);
  const apcRunCount = useAnalyticsStore((s) => s.apcRunCount);
  const setApcRunCount = useAnalyticsStore((s) => s.setApcRunCount);

  // Live snapshot for THIS module only (granular selector → re-renders on tick).
  const liveSnapshot = useAnalyticsSimStore((s) => s.modules.apc);

  // Slider takeover: local-only pause state (we never mutate the shared store).
  // While `override` is non-null this tab is "exploring" — the engine reads the
  // frozen + user-edited inputs instead of the live tick snapshot. The Hero and
  // the shared driver keep running regardless.
  const [override, setOverride] = useState<ApcInputs | null>(null);
  const paused = override !== null;

  // Inputs actually fed to the (unchanged) computation engine.
  const inputs: ApcInputs = paused
    ? override
    : {
        lambda: liveSnapshot.lambda,
        lambdaSlope: liveSnapshot.lambdaSlope,
        noise: liveSnapshot.noise,
        driftType: liveSnapshot.driftType,
      };

  /** Enter explore mode (or update an existing override) with a patched input. */
  const takeOver = (patch: Partial<ApcInputs>) => {
    setOverride((prev) => ({
      lambda: liveSnapshot.lambda,
      lambdaSlope: liveSnapshot.lambdaSlope,
      noise: liveSnapshot.noise,
      driftType: liveSnapshot.driftType,
      ...prev,
      ...patch,
    }));
  };

  const resumeLive = () => setOverride(null);

  const driftConfig: DriftConfig = useMemo(() => {
    switch (inputs.driftType) {
      case 'linear':
        return { type: 'linear', slope: 0.5 };
      case 'sinusoidal':
        return { type: 'sinusoidal', amplitude: 5, period: 30 };
      case 'step-shift':
        return { type: 'step-shift', magnitude: 8, triggerRun: Math.floor(apcRunCount / 2) };
      case 'mixed':
        return { type: 'mixed', slope: 0.2, amplitude: 3, period: 30 };
      default:
        return { type: 'none' };
    }
  }, [inputs.driftType, apcRunCount]);

  // Source of truth: the existing apc-engine. We feed it the live (or explored)
  // inputs — we never duplicate its EWMA / residual math here.
  const runs = useMemo(
    () =>
      simulateRuns(
        { target: apcTarget, lambda: inputs.lambda, lambdaSlope: inputs.lambdaSlope, noise: inputs.noise },
        driftConfig,
        apcRunCount,
        42,
      ),
    [apcTarget, inputs.lambda, inputs.lambdaSlope, inputs.noise, driftConfig, apcRunCount],
  );

  const stats = useMemo(
    () => computeResidualStats(runs.map((r) => r.controlled), apcTarget),
    [runs, apcTarget],
  );

  // Chart-ready data series.
  const traceData = useMemo(
    () =>
      runs.map((r) => ({
        run: r.run,
        controlled: r.controlled,
        uncontrolled: r.uncontrolled,
        target: apcTarget,
      })),
    [runs, apcTarget],
  );

  const ewmaData = useMemo(
    () => runs.map((r) => ({ run: r.run, ewmaLevel: r.ewmaLevel, ewmaSlope: r.ewmaSlope })),
    [runs],
  );

  const histData = useMemo(
    () => stats.histogram.map((b) => ({ bin: Number(b.bin.toFixed(2)), count: b.count })),
    [stats],
  );

  const lastRun = runs[runs.length - 1];
  const currentOffset = lastRun ? (lastRun.controlled - apcTarget).toFixed(2) : SYM.dash;
  const usingDEwma = inputs.lambdaSlope > 0;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--sf-text-primary)]">APC Run-to-Run</h2>
          {paused ? (
            <span
              data-testid="apc-paused-badge"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sf-status-amber)] bg-[rgba(245,158,11,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--sf-status-amber)]"
            >
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--sf-status-amber)]" />
              Paused {SYM.dash} exploring
            </span>
          ) : (
            <span
              data-testid="apc-live-badge"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,211,238,0.4)] bg-[rgba(34,211,238,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--sf-accent-cyan)]"
            >
              <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-[var(--sf-accent-cyan)]" />
              Live
            </span>
          )}
          {paused && (
            <button
              type="button"
              onClick={resumeLive}
              className="inline-flex min-h-[44px] items-center rounded-full border border-[rgba(34,211,238,0.4)] bg-[rgba(34,211,238,0.1)] px-4 text-sm font-medium text-[var(--sf-accent-cyan)] transition-colors hover:bg-[rgba(34,211,238,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19]"
            >
              Resume live
            </button>
          )}
        </div>
        <p className="text-sm leading-snug text-[var(--sf-text-secondary)]">
          Run-to-run control nudges every wafer back to target {SYM.dash} watch the EWMA loop
          cancel out drift and tighten the spread.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiBox
          label="Current offset"
          value={currentOffset}
          plain="Last wafer vs target"
        />
        <KpiBox
          label={`EWMA ${SYM.lambda}`}
          value={inputs.lambda.toFixed(2)}
          plain="Correction smoothing"
        />
        <KpiBox
          label="Drift rate"
          value={driftConfig.type === 'linear' ? `${driftConfig.slope}/run` : driftConfig.type}
        />
        <KpiBox label="Runs" value={`${apcRunCount}`} />
        <KpiBox
          label="Cpk"
          value={stats.cpk === Infinity ? SYM.dash : stats.cpk.toFixed(2)}
          accent="var(--sf-status-green)"
          plain="Process capability"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard title="Controller">
          <div className="space-y-4">
            <div className="flex gap-2" role="group" aria-label="Controller mode">
              <button
                type="button"
                onClick={() => takeOver({ lambdaSlope: 0 })}
                aria-pressed={!usingDEwma}
                className={`min-h-[44px] rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] ${
                  !usingDEwma
                    ? 'bg-[var(--sf-accent-blue)] text-white'
                    : 'border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] text-[var(--sf-text-secondary)] hover:text-[var(--sf-text-primary)]'
                }`}
              >
                EWMA
              </button>
              <button
                type="button"
                onClick={() => takeOver({ lambdaSlope: 0.1 })}
                aria-pressed={usingDEwma}
                className={`min-h-[44px] rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] ${
                  usingDEwma
                    ? 'bg-[var(--sf-accent-blue)] text-white'
                    : 'border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] text-[var(--sf-text-secondary)] hover:text-[var(--sf-text-primary)]'
                }`}
              >
                d-EWMA
              </button>
            </div>

            <div>
              <label
                htmlFor="apc-lambda"
                className="text-sm text-[var(--sf-text-secondary)]"
              >
                EWMA {SYM.lambda} {SYM.dash} {inputs.lambda.toFixed(2)}
              </label>
              <input
                id="apc-lambda"
                type="range"
                min={0.01}
                max={1}
                step={0.01}
                value={inputs.lambda}
                onChange={(e) => takeOver({ lambda: Number(e.target.value) })}
                className="mt-1 w-full accent-[var(--sf-accent-cyan)]"
              />
            </div>

            {usingDEwma && (
              <div>
                <label
                  htmlFor="apc-slope"
                  className="text-sm text-[var(--sf-text-secondary)]"
                >
                  Slope {SYM.lambda} {SYM.dash} {inputs.lambdaSlope.toFixed(2)}
                </label>
                <input
                  id="apc-slope"
                  type="range"
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  value={inputs.lambdaSlope}
                  onChange={(e) => takeOver({ lambdaSlope: Number(e.target.value) })}
                  className="mt-1 w-full accent-[var(--sf-accent-cyan)]"
                />
              </div>
            )}

            <div>
              <label htmlFor="apc-drift" className="text-sm text-[var(--sf-text-secondary)]">
                Drift type
              </label>
              <select
                id="apc-drift"
                aria-label="Drift type"
                value={inputs.driftType}
                onChange={(e) => takeOver({ driftType: e.target.value as DriftType })}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-[rgba(34,211,238,0.22)] bg-[#0B0F19] px-3 text-sm text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)]"
              >
                {DRIFT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="apc-runs" className="text-sm text-[var(--sf-text-secondary)]">
                Run count {SYM.dash} {apcRunCount}
              </label>
              <input
                id="apc-runs"
                type="range"
                min={20}
                max={200}
                value={apcRunCount}
                onChange={(e) => {
                  setApcRunCount(Number(e.target.value));
                  takeOver({});
                }}
                className="mt-1 w-full accent-[var(--sf-accent-cyan)]"
              />
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard title="Process trace">
            <div className="h-48" data-testid="apc-chart-trace">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={traceData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="run" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} width={36} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'var(--sf-accent-cyan)', strokeWidth: 1 }} />
                    <ReferenceLine y={apcTarget} stroke={COLOR_TARGET} strokeDasharray="6 6" />
                    <Line type="monotone" dataKey="uncontrolled" name="Uncontrolled" stroke={COLOR_UNCONTROLLED} strokeWidth={1} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="controlled" name="Controlled" stroke={COLOR_CONTROLLED} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ChartPlaceholder />
              )}
            </div>
          </GlassCard>

          <GlassCard title="EWMA level">
            <div className="h-48" data-testid="apc-chart-ewma">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ewmaData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="run" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} width={36} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'var(--sf-accent-cyan)', strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="ewmaLevel" name="EWMA level" stroke={COLOR_EWMA} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ChartPlaceholder />
              )}
            </div>
          </GlassCard>

          <GlassCard title="Residual histogram">
            <div className="h-48" data-testid="apc-chart-hist">
              {clientReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="bin" stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={AXIS_STROKE} fontSize={10} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(34,211,238,0.08)' }} />
                    <Bar dataKey="count" name="Count" fill={COLOR_CONTROLLED} fillOpacity={0.65} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ChartPlaceholder />
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/** Hydration-gate placeholder shown until the client is ready (mirrors ProcessDashboard). */
function ChartPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-[var(--sf-text-secondary)]">
      Initializing telemetry...
    </div>
  );
}
