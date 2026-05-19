import { cn } from '@/lib/utils';
import type { FabTwinMode } from '@/lib/fab-twin-data';

const MODES: Array<{ id: FabTwinMode; label: string }> = [
  { id: 'normal', label: 'Normal' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'lot-transfer', label: 'Lot Transfer' },
  { id: 'alarm', label: 'Alarm' },
];

export function ModeSelector({ mode, onModeChange }: { mode: FabTwinMode; onModeChange: (mode: FabTwinMode) => void }) {
  return (
    <section aria-label="Interaction mode selector" className="pointer-events-auto w-52 rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(8,18,31,0.76)] p-2 backdrop-blur-xl">
      <p className="px-3 pb-2 pt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-muted)]">Mode</p>
      <div className="space-y-1">
        {MODES.map((item) => (
          <button key={item.id} type="button" onClick={() => onModeChange(item.id)} className={cn('min-h-[44px] w-full rounded-xl border px-3 py-2 text-left font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]', mode === item.id ? 'animate-pulse border-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.12)] text-white motion-reduce:animate-none' : 'border-white/10 text-[var(--sf-text-secondary)] hover:bg-white/[0.06]')}>
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
