import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import type { Subsystem } from '@/lib/fab-twin-data';
import { SUBSYSTEM_EQUIPMENT, SUBSYSTEM_META } from '@/lib/fab-twin-data';
import { HexGaugeChip } from './HexGaugeChip';

export function SubsystemDetailOverlay({ activeSubsystem, onClose, onFlyToAsset }: { activeSubsystem: Subsystem | null; onClose: () => void; onFlyToAsset: (assetId: string) => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const equipment = useMemo(() => SUBSYSTEM_EQUIPMENT.filter((item) => item.subsystem === activeSubsystem), [activeSubsystem]);
  const meta = activeSubsystem ? SUBSYSTEM_META[activeSubsystem] : null;

  useEffect(() => {
    if (activeSubsystem) closeRef.current?.focus();
  }, [activeSubsystem]);

  if (!activeSubsystem || !meta) return null;
  const gauges = equipment[0]?.gauges ?? [];

  return (
    <section role="dialog" aria-modal="false" aria-label={`${meta.label} subsystem details`} className="pointer-events-auto w-full max-w-[920px] rounded-3xl border bg-[rgba(2,6,23,0.82)] p-4 shadow-[0_0_44px_rgba(0,0,0,0.35)] backdrop-blur-xl" style={{ borderColor: meta.color }}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--sf-text-muted)]">Layer Isolation Active</p>
          <h2 className="mt-1 text-lg font-semibold tracking-[0.12em] text-[var(--sf-text-primary)]">{meta.label}</h2>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close panel" className="min-h-[44px] min-w-[44px] rounded-full text-[var(--sf-text-secondary)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]">
          <X className="mx-auto h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {gauges.map((gauge) => <HexGaugeChip key={gauge.label} gauge={gauge} />)}
      </div>
      <div className="mt-4 max-h-44 overflow-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[620px] text-left font-mono text-xs">
          <thead className="sticky top-0 bg-slate-950/95 text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)]">
            <tr><th className="px-3 py-2">Asset</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Metric</th><th className="px-3 py-2">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-[var(--sf-text-secondary)]">
            {equipment.map((item) => (
              <tr key={item.id} className="hover:bg-white/[0.04]">
                <td className="px-3 py-2 text-[var(--sf-text-primary)]">{item.id}</td>
                <td className="px-3 py-2">{item.type}</td>
                <td className="px-3 py-2 uppercase">{item.status}</td>
                <td className="px-3 py-2">{item.metric}: {item.value}</td>
                <td className="px-3 py-2"><button type="button" onClick={() => onFlyToAsset(item.id)} className="min-h-[44px] rounded-full border border-white/10 px-3 text-[var(--sf-accent-cyan)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]">Fly to</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
