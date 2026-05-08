'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Activity, Layers } from 'lucide-react';

const FactoryCanvas = dynamic(
  () => import('@/components/three/FactoryCanvas').then((mod) => ({ default: mod.FactoryCanvas })),
  { ssr: false },
);

const LithoFactoryScene = dynamic(
  () => import('@/components/three/LithoFactoryScene').then((mod) => ({ default: mod.LithoFactoryScene })),
  { ssr: false },
);

const DASHBOARD_LINKS = [
  { href: '/mes/fab-floor/overlay', label: 'Overlay', value: '2.1 nm 3σ', icon: Activity, color: 'var(--sf-accent-cyan)' },
  { href: '/mes/fab-floor/cd', label: 'CD Uniformity', value: '2.4 nm CDU', icon: Layers, color: 'var(--sf-status-green)' },
  { href: '/mes/fab-floor/dose', label: 'Dose Control', value: '+0.3%', icon: Activity, color: 'var(--sf-gas-primary)' },
] as const;

export default function FabFloorPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--sf-bg-canvas)]">
      <header className="z-30 flex shrink-0 flex-col gap-3 border-b border-[rgba(34,211,238,0.2)] bg-[rgba(2,6,23,0.9)] px-4 py-3 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
            <h1 className="text-lg font-semibold tracking-[0.22em] text-[var(--sf-text-primary)]">LITHO FAB FLOOR</h1>
          </div>
          <p className="mt-1 text-xs text-[var(--sf-text-secondary)]">Scanner, track, AMHS, and metrology tools linked to lithography process dashboards</p>
        </div>

        <nav className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Lithography dashboards">
          {DASHBOARD_LINKS.map(({ href, label, value, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="min-h-[44px] rounded-full border bg-white/[0.035] px-3 py-2 text-left transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]"
              style={{ borderColor: color }}
            >
              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--sf-text-primary)]">
                <Icon className="h-3.5 w-3.5" style={{ color }} aria-hidden="true" />
                {label}
              </span>
              <span className="mt-0.5 block font-mono text-[11px] text-[var(--sf-text-secondary)]">{value}</span>
            </Link>
          ))}
        </nav>
      </header>

      <main className="relative flex min-h-[640px] flex-1 overflow-hidden md:min-h-[720px]">
        <FactoryCanvas className="h-full min-h-[640px] w-full md:min-h-[720px]">
          <LithoFactoryScene />
        </FactoryCanvas>

        <section aria-label="Fab floor status" className="pointer-events-none absolute inset-x-3 bottom-3 z-20 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {DASHBOARD_LINKS.map(({ href, label, value, color }) => (
            <Link key={href} href={href} className="pointer-events-auto rounded-2xl border bg-[rgba(17,29,46,0.78)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0" style={{ borderColor: color }}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold text-[var(--sf-text-primary)]">{label}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color }}>Live</span>
              </div>
              <p className="font-mono text-xs text-[var(--sf-text-secondary)]">{value}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
