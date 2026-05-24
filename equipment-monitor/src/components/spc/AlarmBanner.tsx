'use client';
import { useMesSpcStore } from '@/stores/mes-spc-store';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useState } from 'react';

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; icon: typeof AlertTriangle }> = {
  critical: { bg: 'rgba(239,68,68,0.15)', border: 'var(--smartfactory-status-red)', text: 'var(--smartfactory-status-red)', icon: AlertTriangle },
  warning: { bg: 'rgba(245,158,11,0.15)', border: 'var(--smartfactory-status-amber)', text: 'var(--smartfactory-status-amber)', icon: AlertCircle },
  info: { bg: 'rgba(59,130,246,0.15)', border: 'var(--smartfactory-accent-blue)', text: 'var(--smartfactory-accent-blue)', icon: Info },
};

export function AlarmBanner() {
  const activeAlarms = useMesSpcStore((s) => s.activeAlarms);
  const [dismissed, setDismissed] = useState(false);

  if (activeAlarms.length === 0 || dismissed) return null;

  const counts = { critical: 0, warning: 0, info: 0 };
  activeAlarms.forEach((a) => { if (a.severity in counts) counts[a.severity as keyof typeof counts]++; });

  const latest = activeAlarms.slice(0, 3);
  const topSeverity = activeAlarms[0]?.severity || 'info';
  const style = SEVERITY_STYLES[topSeverity];
  const Icon = style.icon;

  return (
    <div data-testid="alarm-banner" className="rounded-lg border p-3 flex items-start gap-3"
      style={{ backgroundColor: style.bg, borderColor: style.border }}>
      <Icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: style.text }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold" style={{ color: style.text }}>
          {activeAlarms.length} active alarm{activeAlarms.length !== 1 ? 's' : ''}
          <span className="ml-2 text-xs font-normal">
            {counts.critical > 0 && <span className="mr-2">{counts.critical} critical</span>}
            {counts.warning > 0 && <span className="mr-2">{counts.warning} warning</span>}
            {counts.info > 0 && <span>{counts.info} info</span>}
          </span>
        </div>
        <div className="mt-1 space-y-0.5">
          {latest.map((a) => {
            const s = SEVERITY_STYLES[a.severity];
            const SIcon = s.icon;
            return (
              <div key={a.id} className="text-xs flex items-center gap-1" style={{ color: 'var(--smartfactory-text-secondary)' }}>
                <SIcon className="w-3 h-3" style={{ color: s.text }} />
                <span>{a.parameter.toUpperCase()}: {a.message}</span>
              </div>
            );
          })}
        </div>
      </div>
      <button onClick={() => setDismissed(true)} className="shrink-0 cursor-pointer" aria-label="Dismiss banner">
        <X className="w-4 h-4" style={{ color: 'var(--smartfactory-text-muted)' }} />
      </button>
    </div>
  );
}
