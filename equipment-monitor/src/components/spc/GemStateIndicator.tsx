'use client';

import { useMesSpcStore } from '@/stores/mes-spc-store';
import { Play, Pause, XCircle, Activity } from 'lucide-react';
import type { GemState } from '@/lib/mes-types';

const STATE_STYLES: Record<GemState, { color: string; bg: string; icon: typeof Activity }> = {
  INIT: { color: 'var(--smartfactory-text-muted)', bg: 'rgba(107,114,128,0.15)', icon: Activity },
  IDLE: { color: 'var(--smartfactory-accent-blue)', bg: 'rgba(59,130,246,0.15)', icon: Activity },
  SETUP: { color: 'var(--smartfactory-accent-blue)', bg: 'rgba(59,130,246,0.15)', icon: Activity },
  READY: { color: 'var(--smartfactory-accent-blue)', bg: 'rgba(59,130,246,0.15)', icon: Activity },
  EXECUTING: { color: 'var(--smartfactory-status-green)', bg: 'rgba(34,197,94,0.15)', icon: Play },
  PAUSED: { color: 'var(--smartfactory-status-amber)', bg: 'rgba(245,158,11,0.15)', icon: Pause },
  COMPLETED: { color: 'var(--smartfactory-text-muted)', bg: 'rgba(107,114,128,0.1)', icon: Activity },
  ABORTED: { color: 'var(--smartfactory-status-red)', bg: 'rgba(239,68,68,0.15)', icon: XCircle },
};

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

export function GemStateIndicator() {
  const gemState = useMesSpcStore((s) => s.gemState);
  const stateHistory = useMesSpcStore((s) => s.stateHistory);
  const style = STATE_STYLES[gemState];
  const Icon = style.icon;

  return (
    <div data-testid="gem-state" className="flex items-center gap-4 rounded border p-2"
      style={{ borderColor: 'var(--smartfactory-border-default)', backgroundColor: 'var(--smartfactory-surface-card)' }}>
      <div data-testid="gem-state-badge" className="flex items-center gap-2 rounded px-3 py-1.5"
        style={{ backgroundColor: style.bg, border: `1px solid ${style.color}` }}>
        <Icon className="w-4 h-4" style={{ color: style.color }} />
        <span className="text-sm font-bold font-mono" style={{ color: style.color }}>{gemState}</span>
      </div>
      <div data-testid="gem-state-history" className="flex-1">
        {stateHistory.length === 0 ? (
          <span className="text-xs" style={{ color: 'var(--smartfactory-text-muted)' }}>No transitions yet</span>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {stateHistory.slice(-5).reverse().map((t, i) => (
              <span key={i} className="text-xs font-mono" style={{ color: 'var(--smartfactory-text-secondary)' }}>
                <span style={{ color: 'var(--smartfactory-text-muted)' }}>{formatTime(t.timestamp)}</span>
                {' '}{t.from}&rarr;{t.to}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
