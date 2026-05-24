'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Header } from '@/components/layout/header';
import { MesNavBar } from '@/components/mes/MesNavBar';
import { CyberpunkGaugeCard } from '@/components/charts/cyberpunk-gauge-card';
import { ProcessCard } from '@/components/fab-floor/ProcessCard';
import { ProcessPipelineBar } from '@/components/fab-floor/ProcessPipelineBar';
import { useClientReady } from '@/hooks/use-client-ready';
import { generateFabThroughputTrend, PROCESS_ORDER } from '@/lib/fab-process-data';
import { useProcessStore } from '@/stores/process-store';
import { DashboardTabs, type DashboardTabId } from '@/components/dashboard/DashboardTabs';
import { FacilityTab } from '@/components/dashboard/FacilityTab';

export default function DashboardPage() {
  const clientReady = useClientReady();
  const processes = useProcessStore((state) => state.processes);
  const fabKpis = useProcessStore((state) => state.fabKpis);
  const tick = useProcessStore((state) => state.tick);
  const trend = generateFabThroughputTrend(processes);
  const [activeTab, setActiveTab] = useState<DashboardTabId>('fab-flow');

  useEffect(() => {
    if (activeTab !== 'fab-flow') return;
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [tick, activeTab]);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.13),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(244,63,94,0.12),transparent_28%),var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      <Header />
      <MesNavBar />
      <main className="mx-auto w-full max-w-[1800px] space-y-6 p-4 md:p-6">
        <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 'fab-flow' ? (
            <>
              <header className="rounded-3xl border border-[rgba(34,211,238,0.24)] bg-[rgba(2,6,23,0.72)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--sf-accent-cyan)]">Fab KPI Command Center</p>
                    <h1 className="mt-2 text-3xl font-semibold uppercase tracking-[0.16em] md:text-4xl">8-Process Fab Flow</h1>
                    <p className="mt-2 max-w-4xl text-sm text-[var(--sf-text-secondary)]">Live synthetic overview across oxidation, lithography, etch, deposition, implant, diffusion, CMP, and metallization.</p>
                  </div>
                  <div className="rounded-full border border-[rgba(34,211,238,0.35)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--sf-accent-cyan)]">Client-side simulator · 2s tick</div>
                </div>
              </header>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Aggregate fab KPIs">
                <CyberpunkGaugeCard title="Fab OEE" value={fabKpis.oee} unit="%" lsl={85} usl={100} zoneColor="var(--sf-accent-cyan)" subtitle="Weighted process availability" valueFormatter={(value) => value.toFixed(1)} />
                <CyberpunkGaugeCard title="Total WPH" value={fabKpis.wph} unit="wph" lsl={240} usl={360} zoneColor="var(--sf-status-green)" subtitle="Across all stations" valueFormatter={(value) => value.toFixed(0)} />
                <CyberpunkGaugeCard title="Fab Yield" value={fabKpis.yield} unit="%" lsl={96} usl={100} zoneColor="var(--sf-accent-violet)" subtitle="Composite process yield" valueFormatter={(value) => value.toFixed(1)} />
                <CyberpunkGaugeCard title="Cycle Time" value={fabKpis.cycleTime} unit="days" lsl={3.2} usl={5.2} zoneColor="var(--sf-status-amber)" subtitle="Queue-adjusted cycle time" valueFormatter={(value) => value.toFixed(1)} />
              </section>

              <section className="rounded-3xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.66)] p-4 backdrop-blur-xl" aria-label="Process pipeline">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Process Pipeline</h2>
                  <span className="text-xs text-[var(--sf-text-secondary)]">Implant pulses as current bottleneck</span>
                </div>
                <ProcessPipelineBar processes={processes} />
              </section>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Process cards">
                {processes.map((process) => <ProcessCard key={process.id} process={process} />)}
              </section>

              <section className="rounded-3xl border border-[rgba(34,211,238,0.22)] bg-[rgba(2,6,23,0.72)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)]" aria-label="Fab WPH 24 hour trend">
                <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em]">Live Trend · Fab WPH Last 24h</h2>
                  <p className="text-xs text-[var(--sf-text-secondary)]">Stacked throughput contribution by process</p>
                </div>
                <div className="h-[360px]">
                  {clientReady ? <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                      <XAxis dataKey="time" stroke="rgba(148,163,184,0.72)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(148,163,184,0.72)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(34,211,238,0.45)', borderRadius: 12, color: '#f8fafc' }} />
                      {PROCESS_ORDER.map((id) => {
                        const process = processes.find((candidate) => candidate.id === id);
                        return process ? <Area key={id} type="monotone" dataKey={id} stackId="wph" stroke={process.color} fill={process.color} fillOpacity={0.34} /> : null;
                      })}
                    </AreaChart>
                  </ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-[var(--sf-text-secondary)]">Initializing fab trend telemetry...</div>}
                </div>
              </section>
            </>
          ) : (
            <FacilityTab />
          )}
        </DashboardTabs>
      </main>
    </div>
  );
}
