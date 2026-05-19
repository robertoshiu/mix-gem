'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronLeft } from 'lucide-react';
import { Area, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CyberpunkGaugeCard } from '@/components/charts/cyberpunk-gauge-card';
import { ProcessPipelineBar } from '@/components/fab-floor/ProcessPipelineBar';
import { useClientReady } from '@/hooks/use-client-ready';
import {
  createInitialProcesses,
  generateProcessTrend,
  generateSecsGemEvents,
  generateWaferSites,
  getAdjacentProcess,
  type FabProcess,
  type ProcessId,
} from '@/lib/fab-process-data';

interface ProcessDashboardProps {
  processId: ProcessId;
}

function processWaferTitle(process: FabProcess) {
  if (process.id === 'lithography') return 'Overlay Vector Map';
  if (process.id === 'metallization') return 'Via Resistance Map';
  if (process.id === 'cmp') return 'Removal Map';
  if (process.id === 'etching') return 'Etch Depth Map';
  if (process.id === 'implant') return 'Dose Map';
  if (process.id === 'diffusion') return 'Sheet Resistance Map';
  return 'Thickness Map';
}

function colorWithAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function WaferHeatMap({ process }: { process: FabProcess }) {
  const sites = generateWaferSites(process, 49);
  const metric = process.kpis[0];
  return (
    <section className="rounded-3xl border bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_0_28px_rgba(0,0,0,0.24)]" style={{ borderColor: colorWithAlpha(process.color, 0.36) }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-primary)]">{processWaferTitle(process)}</h2>
        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider" style={{ borderColor: process.color, color: process.color }}>{metric.unit}</span>
      </div>
      <svg viewBox="0 0 320 320" role="img" aria-label={`${process.name} wafer heatmap`} className="mx-auto aspect-square w-full max-w-[420px] overflow-visible">
        <defs>
          <filter id={`process-wafer-glow-${process.id}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id={`process-wafer-gradient-${process.id}`}>
            <stop offset="0%" stopColor={colorWithAlpha(process.color, 0.18)} />
            <stop offset="100%" stopColor="rgba(2,6,23,0.95)" />
          </radialGradient>
        </defs>
        <circle cx="160" cy="160" r="145" fill={`url(#process-wafer-gradient-${process.id})`} stroke={process.color} strokeWidth="2" filter={`url(#process-wafer-glow-${process.id})`} />
        <circle cx="160" cy="160" r="126" fill="none" stroke="rgba(148,163,184,0.25)" strokeDasharray="6 7" />
        <path d="M 145 301 Q 160 290 175 301" fill="none" stroke={process.color} strokeWidth="3" strokeLinecap="round" />
        {sites.map((site) => {
          const x = 160 + site.x * 126;
          const y = 160 + site.y * 126;
          const pct = Math.max(0.18, Math.min(1, (site.value - metric.lsl) / Math.max(0.01, metric.usl - metric.lsl)));
          const fill = colorWithAlpha(process.color, 0.32 + pct * 0.68);
          if (process.id === 'lithography' && site.dx !== undefined && site.dy !== undefined) {
            return (
              <g key={site.id}>
                <line x1={x} y1={y} x2={x + site.dx * 10} y2={y - site.dy * 10} stroke={process.color} strokeWidth="1.5" strokeLinecap="round" />
                <circle cx={x} cy={y} r="3.4" fill={fill}><title>{`${site.value} ${metric.unit}`}</title></circle>
              </g>
            );
          }
          return <circle key={site.id} cx={x} cy={y} r="6" fill={fill} filter={`url(#process-wafer-glow-${process.id})`}><title>{`${site.value} ${metric.unit}`}</title></circle>;
        })}
      </svg>
    </section>
  );
}

export function ProcessDashboard({ processId }: ProcessDashboardProps) {
  const clientReady = useClientReady();
  const processes = createInitialProcesses();
  const process = processes.find((candidate) => candidate.id === processId) ?? processes[0];
  const prev = getAdjacentProcess(process.id, -1);
  const next = getAdjacentProcess(process.id, 1);
  const trend = generateProcessTrend(process);
  const events = generateSecsGemEvents(process);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(168,85,247,0.12),transparent_32%),var(--sf-bg-canvas)] p-4 text-[var(--sf-text-primary)] md:p-6">
      <header className="mb-5 rounded-3xl border bg-[rgba(2,6,23,0.74)] p-4 backdrop-blur-xl" style={{ borderColor: colorWithAlpha(process.color, 0.38) }}>
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/mes/fab-floor" className="mb-2 inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold uppercase tracking-wider hover:text-[var(--sf-text-primary)]" style={{ color: process.color }}>
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to Fab Floor
            </Link>
            <h1 className="text-2xl font-semibold uppercase tracking-[0.22em]">{process.name}</h1>
            <p className="mt-1 max-w-4xl text-sm text-[var(--sf-text-secondary)]">{process.nameCN} · {process.narrative}</p>
          </div>
          <div className="rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-[0.18em]" style={{ borderColor: process.color, color: process.color }}>S6F11 LIVE PROCESS MODEL</div>
        </div>
        <ProcessPipelineBar processes={processes} activeProcessId={process.id} hrefMode="dashboard" compact />
      </header>

      <main className="grid grid-cols-1 gap-4 xl:grid-cols-[0.32fr_0.68fr]">
        <aside className="space-y-4">
          <section className="rounded-3xl border bg-[rgba(2,6,23,0.72)] p-4" style={{ borderColor: colorWithAlpha(process.color, 0.34) }}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Station Status</h2>
            <div className="mt-4 space-y-3">
              {process.equipment.map((equipment) => (
                <div key={equipment.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold" style={{ color: process.color }}>{equipment.id}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-[var(--sf-text-secondary)]">{equipment.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--sf-text-primary)]">{equipment.name}</p>
                  <p className="text-xs text-[var(--sf-text-secondary)]">{equipment.currentRecipe ?? 'No active recipe'} · {equipment.oee.toFixed(1)}% OEE</p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border bg-[rgba(2,6,23,0.72)] p-4" style={{ borderColor: process.alarms.length ? 'var(--sf-status-amber)' : colorWithAlpha(process.color, 0.34) }}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em]">Active Alarms</h2>
            <div className="mt-3 space-y-2 text-sm">
              {process.alarms.length === 0 ? <p className="text-[var(--sf-text-secondary)]">No active process alarms.</p> : process.alarms.map((alarm) => <p key={alarm.id} className="rounded-xl bg-white/[0.04] p-3 text-[var(--sf-status-amber)]">{alarm.since} · {alarm.message}</p>)}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {process.kpis.slice(0, 4).map((kpi) => (
              <CyberpunkGaugeCard key={kpi.id} title={kpi.label} value={kpi.value} unit={kpi.unit} lsl={kpi.lsl} usl={kpi.usl} zoneColor={process.color} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <WaferHeatMap process={process} />
            <section className="rounded-3xl border bg-[rgba(2,6,23,0.72)] p-4" style={{ borderColor: colorWithAlpha(process.color, 0.36) }}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em]">Process Trend</h2>
              <div className="h-[330px]">
                {clientReady ? <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis dataKey="time" stroke="rgba(148,163,184,0.72)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(148,163,184,0.72)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: `1px solid ${process.color}`, borderRadius: 12, color: '#f8fafc' }} />
                    <ReferenceLine y={process.kpis[0].usl} stroke="var(--sf-status-red)" strokeDasharray="4 4" />
                    <ReferenceLine y={process.kpis[0].lsl} stroke="var(--sf-status-red)" strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="value" stroke={process.color} fill={colorWithAlpha(process.color, 0.16)} strokeWidth={2} />
                    <Line type="monotone" dataKey="target" stroke="rgba(226,232,240,0.45)" dot={false} strokeDasharray="6 6" />
                  </LineChart>
                </ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-[var(--sf-text-secondary)]">Initializing process trend telemetry...</div>}
              </div>
            </section>
          </div>
          <section className="rounded-3xl border bg-[rgba(2,6,23,0.72)] p-4" style={{ borderColor: colorWithAlpha(process.color, 0.36) }}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em]">SECS/GEM Event Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="text-[var(--sf-text-muted)]"><tr><th className="py-2">Time</th><th>SF</th><th>CEID</th><th>Description</th><th>DV Payload</th></tr></thead>
                <tbody className="divide-y divide-white/10">
                  {events.map((event) => <tr key={event.id}><td className="py-2 font-mono">{event.timestamp}</td><td className="font-mono" style={{ color: process.color }}>{event.streamFunction}</td><td className="font-mono">{event.ceid}</td><td>{event.description}</td><td className="font-mono text-[var(--sf-text-secondary)]">{Object.entries(event.dv).map(([key, value]) => `${key}=${value}`).join(' | ')}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>

      <footer className="mt-5 flex items-center justify-between gap-3">
        <Link href={`/mes/fab-floor/${prev}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--sf-text-secondary)] hover:text-[var(--sf-text-primary)]"><ArrowLeft className="h-4 w-4" /> Prev process</Link>
        <Link href={`/mes/fab-floor/${next}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-[var(--sf-text-secondary)] hover:text-[var(--sf-text-primary)]">Next process <ArrowRight className="h-4 w-4" /></Link>
      </footer>
    </div>
  );
}
