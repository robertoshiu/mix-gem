import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FabTwinView } from '@/lib/fab-twin-data';

const VIEWS: Array<{ id: FabTwinView; label: string; description: string }> = [
  { id: 'overview', label: 'overview', description: 'Bay/chase/subfab' },
  { id: 'operator', label: 'operator', description: 'Load ports' },
  { id: 'maintenance', label: 'maintenance', description: 'Service side' },
  { id: 'pipe-rack', label: 'pipe-rack', description: 'Utilities' },
  { id: 'control-room', label: 'ctrl-room', description: 'MCC wall' },
];

export function ViewpointSelector({ view, expanded, onViewChange, onExpandedChange }: { view: FabTwinView; expanded: boolean; onViewChange: (view: FabTwinView) => void; onExpandedChange: (expanded: boolean) => void }) {
  const active = VIEWS.find((item) => item.id === view) ?? VIEWS[0];

  return (
    <section aria-label="Viewpoint selector" className="pointer-events-auto w-48 rounded-2xl border border-[rgba(34,211,238,0.24)] bg-[rgba(8,18,31,0.76)] p-2 backdrop-blur-xl">
      <button type="button" onClick={() => onExpandedChange(!expanded)} className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 text-left font-mono text-xs uppercase tracking-wider text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]">
        {active.label}
        <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
      </button>
      {expanded && (
        <div className="mt-1 space-y-1">
          {VIEWS.map((item) => (
            <button key={item.id} type="button" onClick={() => onViewChange(item.id)} className={cn('min-h-[44px] w-full rounded-xl border-l-2 px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]', view === item.id ? 'border-l-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.12)]' : 'border-l-transparent hover:bg-white/[0.06]')}>
              <span className="block font-mono text-xs text-[var(--sf-text-primary)]">{item.label}</span>
              <span className="block text-[10px] text-[var(--sf-text-secondary)]">{item.description}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
