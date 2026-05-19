'use client';

import Link from 'next/link';
import type { FabProcess, ProcessId } from '@/lib/fab-process-data';

interface ProcessPipelineBarProps {
  processes: FabProcess[];
  activeProcessId?: ProcessId | null;
  hrefMode?: 'floor' | 'dashboard';
  compact?: boolean;
}

export function ProcessPipelineBar({ processes, activeProcessId, hrefMode = 'floor', compact = false }: ProcessPipelineBarProps) {
  return (
    <nav className="w-full" aria-label="Eight process flow navigation">
      <ol className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {processes.map((process) => {
          const isActive = activeProcessId === process.id;
          const isBottleneck = process.id === 'implant' || process.queueDepth >= 32;
          const href = hrefMode === 'dashboard' ? `/mes/fab-floor/${process.id}` : `/mes/fab-floor?process=${process.id}`;
          return (
            <li key={process.id}>
              <Link
                href={href}
                className="group block min-h-[44px] rounded-2xl border bg-[rgba(2,6,23,0.62)] px-3 py-3 transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2"
                style={{ borderColor: isActive ? process.color : 'rgba(148,163,184,0.18)', boxShadow: isActive || isBottleneck ? `0 0 18px color-mix(in srgb, ${process.color} 40%, transparent)` : undefined }}
                title={`${process.name}: ${process.nominalWph} WPH, queue ${process.queueDepth}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${isBottleneck ? 'animate-pulse motion-reduce:animate-none' : ''}`}
                    style={{ backgroundColor: process.color, boxShadow: `0 0 14px ${process.color}` }}
                  />
                  <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sf-text-primary)]">{process.shortName}</span>
                </div>
                {!compact && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, process.nominalWph * 2)}%`, backgroundColor: process.color }} />
                  </div>
                )}
                {!compact && <div className="mt-1 font-mono text-[10px] text-[var(--sf-text-secondary)]">{process.nominalWph} WPH / Q{process.queueDepth}</div>}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
