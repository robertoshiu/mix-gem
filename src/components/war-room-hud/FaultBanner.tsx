import { X } from 'lucide-react';
import type { FabTwinFaultId } from '@/lib/fab-twin-data';
import { getFaultScene } from '@/lib/fab-twin-data';

export function FaultBanner({ faultId, dismissed, onDismiss }: { faultId: FabTwinFaultId; dismissed: boolean; onDismiss: () => void }) {
  if (faultId === 'nominal' || dismissed) return null;
  const fault = getFaultScene(faultId);

  return (
    <section aria-label="Active fault response" className="pointer-events-auto mx-auto max-w-4xl rounded-2xl border border-[rgba(239,68,68,0.42)] bg-[rgba(17,24,39,0.82)] p-3 pl-5 font-mono text-xs text-[var(--sf-text-primary)] shadow-[0_0_34px_rgba(239,68,68,0.22)] backdrop-blur-xl">
      <div className="flex items-start gap-4 border-l-4 border-[var(--sf-status-red)] pl-4">
        <div className="grid flex-1 gap-3 md:grid-cols-3">
          <div><span className="block text-[9px] uppercase tracking-wider text-[var(--sf-text-muted)]">Trigger</span>{fault.triggerSource}</div>
          <div><span className="block text-[9px] uppercase tracking-wider text-[var(--sf-text-muted)]">Impact</span>{fault.impactZone}</div>
          <div><span className="block text-[9px] uppercase tracking-wider text-[var(--sf-text-muted)]">Action</span>{fault.recommendedAction}</div>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss fault banner" className="min-h-[44px] min-w-[44px] rounded-full text-[var(--sf-text-secondary)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]">
          <X className="mx-auto h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
