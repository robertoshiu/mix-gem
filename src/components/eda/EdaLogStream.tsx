'use client';

import { useMemo, useState } from 'react';
import type { LogEntry, LogLevel } from '@/lib/eda-types';
import { cn } from '@/lib/utils';

const FILTERS: Array<'all' | 'warning' | 'error'> = ['all', 'warning', 'error'];

const levelClass: Record<LogLevel, string> = {
  info: 'text-slate-200',
  warning: 'text-[var(--sf-status-amber)]',
  error: 'text-[var(--sf-status-red)]',
  milestone: 'text-[var(--sf-accent-cyan)]',
};

function time(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-GB', { hour12: false });
}

export function EdaLogStream({ logs }: { logs: LogEntry[] }) {
  const [filter, setFilter] = useState<'all' | 'warning' | 'error'>('all');
  const visible = useMemo(() => logs.filter((log) => filter === 'all' || log.level === filter).slice(-500), [logs, filter]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-muted)]">Synopsys / Cadence log stream</p>
        <div className="flex rounded-xl border border-white/10 bg-white/[0.035] p-1">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                'min-h-9 rounded-lg px-3 font-mono text-xs capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]',
                filter === item ? 'bg-[rgba(34,211,238,0.16)] text-white' : 'text-[var(--sf-text-secondary)] hover:bg-white/[0.08]',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[520px] overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-3 font-mono text-xs leading-relaxed" role="log" aria-live="polite">
        {visible.length === 0 ? (
          <p className="text-[var(--sf-text-muted)]">No matching log entries yet.</p>
        ) : visible.map((log) => (
          <div key={log.id} className={levelClass[log.level]}>
            <span className="text-slate-500">[{time(log.timestamp)}] [{log.stage}] [{log.level.toUpperCase()}]</span> {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
