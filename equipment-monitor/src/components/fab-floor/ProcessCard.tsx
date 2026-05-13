'use client';

import Link from 'next/link';
import { AlertTriangle, Activity } from 'lucide-react';
import type { FabProcess } from '@/lib/fab-process-data';

interface ProcessCardProps {
  process: FabProcess;
  compact?: boolean;
}

export function ProcessCard({ process, compact = false }: ProcessCardProps) {
  const isBottleneck = process.id === 'implant' || process.queueDepth >= 32;
  return (
    <Link
      href={`/mes/fab-floor?process=${process.id}`}
      className="group relative min-h-[44px] overflow-hidden rounded-2xl border bg-[rgba(10,22,40,0.88)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(24,40,64,0.95)] focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0"
      style={{
        borderColor: process.color,
        boxShadow: isBottleneck ? `0 0 30px color-mix(in srgb, ${process.color} 42%, transparent), 0 18px 48px rgba(0,0,0,0.34)` : undefined,
      }}
      aria-label={`Open ${process.name} fab floor station, OEE ${process.nominalOee} percent`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background:repeating-linear-gradient(0deg,white_0_1px,transparent_1px_7px)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs font-bold" style={{ borderColor: process.color, color: process.color }}>
              {process.order}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-primary)]">{process.name}</h3>
              <p className="text-xs text-[var(--sf-text-secondary)]">{process.nameCN}</p>
            </div>
          </div>
        </div>
        {process.alarms.length > 0 ? <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--sf-status-amber)]" aria-hidden="true" /> : <Activity className="h-4 w-4 shrink-0" style={{ color: process.color }} aria-hidden="true" />}
      </div>

      <div className={compact ? 'relative mt-4 grid grid-cols-3 gap-2' : 'relative mt-5 grid grid-cols-3 gap-3'}>
        <Metric label="OEE" value={`${process.nominalOee.toFixed(1)}%`} color={process.color} />
        <Metric label="WPH" value={String(process.nominalWph)} color={process.color} />
        <Metric label="Alarms" value={String(process.alarms.length)} color={process.alarms.length ? 'var(--sf-status-amber)' : process.color} />
      </div>

      {!compact && (
        <div className="relative mt-4 flex items-center justify-between gap-3 text-[11px] text-[var(--sf-text-secondary)]">
          <span className="inline-flex items-center gap-1"><Activity className="h-3.5 w-3.5" aria-hidden="true" /> Queue {process.queueDepth} lots</span>
          <span className="font-mono" style={{ color: process.color }}>{isBottleneck ? 'BOTTLENECK' : 'NOMINAL'}</span>
        </div>
      )}
    </Link>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)]">{label}</div>
      <div className="mt-1 truncate font-mono text-sm font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}
