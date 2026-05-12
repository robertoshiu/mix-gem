'use client';

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EDA_STAGE_DEFINITIONS } from '@/lib/eda-mock-data';
import type { StageState } from '@/lib/eda-types';

export function EdaMetricsChart({ stage }: { stage: StageState }) {
  const definition = EDA_STAGE_DEFINITIONS[stage.stage];
  const hasSamples = stage.samples.length > 0;
  const limit = definition.criticalLimit ?? definition.warningLimit;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-[rgba(8,18,31,0.76)] p-4">
        <h3 className="text-sm font-semibold text-[var(--sf-text-primary)]">{definition.primaryMetricLabel} trend</h3>
        <div className="mt-3 h-56">
          {hasSamples ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stage.samples} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="tick" tick={{ fill: 'var(--sf-text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--sf-text-muted)', fontSize: 10 }} width={42} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.28)', fontSize: 12 }} />
                {limit !== undefined && <ReferenceLine y={limit} stroke="var(--sf-status-red)" strokeDasharray="5 5" strokeOpacity={0.7} />}
                <Line type="monotone" dataKey="primary" stroke={definition.color} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="flex h-full items-center justify-center text-sm text-[var(--sf-text-muted)]">Run the simulator to collect metrics.</div>}
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-[rgba(8,18,31,0.76)] p-4">
        <h3 className="text-sm font-semibold text-[var(--sf-text-primary)]">Compute resource load</h3>
        <div className="mt-3 h-56">
          {hasSamples ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stage.samples} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="tick" tick={{ fill: 'var(--sf-text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--sf-text-muted)', fontSize: 10 }} width={42} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.28)', fontSize: 12 }} />
                <ReferenceLine y={90} stroke="var(--sf-status-amber)" strokeDasharray="4 4" strokeOpacity={0.65} />
                <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="memory" name="Memory GB" stroke="#a78bfa" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="diskIo" name="Disk I/O" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="flex h-full items-center justify-center text-sm text-[var(--sf-text-muted)]">No resource samples yet.</div>}
        </div>
      </section>
    </div>
  );
}
