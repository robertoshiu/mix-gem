'use client';

import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import type { FabProcess } from '@/lib/fab-process-data';
import { DIGITAL_TWIN_ROUTES } from '@/lib/digital-twin-routes';

interface ProcessHudPanelProps {
  process: FabProcess | null;
  open: boolean;
  onClose: () => void;
}

export function ProcessHudPanel({ process, open, onClose }: ProcessHudPanelProps) {
  if (!process) return null;

  return (
    <aside
      role="dialog"
      aria-label={`${process.name} station details`}
      className={`pointer-events-auto absolute right-3 top-3 z-30 w-[min(400px,calc(100vw-1.5rem))] rounded-3xl border bg-[rgba(2,6,23,0.78)] p-4 text-[var(--sf-text-primary)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-transform duration-300 motion-reduce:transition-none ${open ? 'translate-x-0' : 'translate-x-[115%]'}`}
      style={{ borderColor: process.color, boxShadow: `0 0 36px color-mix(in srgb, ${process.color} 24%, transparent), 0 24px 80px rgba(0,0,0,0.55)` }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: process.color, boxShadow: `0 0 14px ${process.color}` }} />
            <h2 className="text-base font-semibold uppercase tracking-[0.22em]">{process.name}</h2>
          </div>
          <p className="mt-1 text-xs text-[var(--sf-text-secondary)]">Process {process.order}: {process.nameCN}</p>
        </div>
        <button type="button" onClick={onClose} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--sf-text-secondary)] transition-colors hover:bg-white/10 hover:text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2" aria-label="Close process HUD">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <HudMetric label="OEE" value={`${process.nominalOee.toFixed(1)}%`} color={process.color} />
        <HudMetric label="WPH" value={String(process.nominalWph)} color={process.color} />
        <HudMetric label="Yield" value={`${process.nominalYield.toFixed(1)}%`} color={process.color} />
      </div>

      <section className="mt-4 border-t border-white/10 pt-4" aria-label="Equipment">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-secondary)]">Equipment ({process.equipment.length})</h3>
        <div className="mt-3 space-y-2">
          {process.equipment.map((equipment) => (
            <div key={equipment.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="truncate font-semibold text-[var(--sf-text-primary)]">{equipment.id}</div>
                <div className="truncate text-[var(--sf-text-secondary)]">{equipment.name}</div>
              </div>
              <span className="shrink-0 rounded-full px-2 py-0.5 font-mono uppercase" style={{ color: equipment.status === 'down' ? 'var(--sf-status-red)' : equipment.status === 'pm' ? 'var(--sf-status-amber)' : process.color, backgroundColor: 'rgba(255,255,255,0.06)' }}>{equipment.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 border-t border-white/10 pt-4" aria-label="Key metrics">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-secondary)]">Key Metrics</h3>
        <div className="mt-3 space-y-2">
          {process.kpis.slice(0, 4).map((kpi) => (
            <div key={kpi.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--sf-text-secondary)]">{kpi.label}</span>
              <span className="font-mono" style={{ color: kpi.status === 'alarm' ? 'var(--sf-status-red)' : kpi.status === 'warning' ? 'var(--sf-status-amber)' : process.color }}>{kpi.value} {kpi.unit}</span>
            </div>
          ))}
        </div>
      </section>

      <Link href={`/mes/fab-floor/${process.id}`} className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2" style={{ borderColor: process.color, color: process.color }}>
        View Details <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      {DIGITAL_TWIN_ROUTES[process.id] && (
        <Link href={DIGITAL_TWIN_ROUTES[process.id]!} className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2" style={{ borderColor: process.color, backgroundColor: `color-mix(in srgb, ${process.color} 12%, transparent)`, color: process.color }}>
          Digital Twin 數位孿生 <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </aside>
  );
}

function HudMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)]">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}
