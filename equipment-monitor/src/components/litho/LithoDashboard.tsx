'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CyberpunkGaugeCard } from '@/components/charts/cyberpunk-gauge-card';
import { getLithoDashboardData, type LithoDashboardKind } from '@/lib/litho-mock-data';
import { LithoTrendChart } from './LithoTrendChart';
import { WaferMap } from './WaferMap';

interface LithoDashboardProps {
  kind: LithoDashboardKind;
}

export function LithoDashboard({ kind }: LithoDashboardProps) {
  const data = getLithoDashboardData(kind);

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.13),transparent_34%),var(--sf-bg-canvas)] p-4 text-[var(--sf-text-primary)] md:p-6">
      <header className="mb-5 flex flex-col gap-3 rounded-2xl border border-[rgba(34,211,238,0.24)] bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/mes/fab-floor" className="mb-2 inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sf-accent-cyan)] hover:text-[var(--sf-text-primary)]">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Fab Floor
          </Link>
          <h1 className="text-xl font-semibold uppercase tracking-[0.2em]">{data.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--sf-text-secondary)]">{data.subtitle}</p>
        </div>
        <div className="rounded-full border border-[rgba(34,211,238,0.35)] px-3 py-1 font-mono text-xs text-[var(--sf-accent-cyan)]">SYNTHETIC LITHO MODEL</div>
      </header>

      <main className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <WaferMap sites={data.sites} mode={data.waferMode} unit={data.unit} />
        <LithoTrendChart title={data.title} data={data.trend} unit={data.unit} />
        <section className="grid grid-cols-1 gap-3 xl:col-span-2 md:grid-cols-3" aria-label={`${data.title} key metrics`}>
          {data.metrics.map((metric) => (
            <CyberpunkGaugeCard key={metric.name} title={metric.name} value={metric.value} unit={metric.unit} lsl={metric.lsl} usl={metric.usl} zoneColor="var(--sf-accent-cyan)" />
          ))}
        </section>
      </main>
    </div>
  );
}
