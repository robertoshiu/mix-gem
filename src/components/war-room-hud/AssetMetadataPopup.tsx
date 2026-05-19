import { X } from 'lucide-react';
import type { WarRoomPickedAsset } from '@/components/babylon/WarRoomBabylonScene';

export function AssetMetadataPopup({ asset, screenPos, onClose }: { asset: WarRoomPickedAsset | null; screenPos: { x: number; y: number } | null; onClose: () => void }) {
  if (!asset || !screenPos) return null;

  return (
    <section
      aria-label="Picked asset metadata"
      className="pointer-events-auto fixed z-50 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-[rgba(34,211,238,0.48)] bg-[rgba(2,6,23,0.9)] p-4 shadow-[0_0_34px_rgba(34,211,238,0.18)] backdrop-blur-xl before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] before:bg-[length:100%_6px]"
      style={{ left: `clamp(16px, ${screenPos.x + 16}px, calc(100vw - 376px))`, top: `clamp(86px, ${screenPos.y + 16}px, calc(100vh - 420px))` }}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold text-[var(--sf-text-primary)]">{asset.id}</p>
          <p className="mt-1 truncate font-mono text-[10px] text-[var(--sf-text-secondary)]">{asset.path}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close metadata popup" className="min-h-[44px] min-w-[44px] rounded-full text-[var(--sf-text-secondary)] hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]">
          <X className="mx-auto h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <span className="mt-3 inline-flex rounded-full border border-[rgba(34,211,238,0.32)] bg-[rgba(34,211,238,0.1)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--sf-accent-cyan)]">{asset.type}</span>
      <details className="relative mt-3" open>
        <summary className="cursor-pointer font-mono text-[11px] text-[var(--sf-text-secondary)]">Full JSON</summary>
        <pre className="mt-2 max-h-52 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-[10px] leading-relaxed text-slate-200">{JSON.stringify(asset.metadata, null, 2)}</pre>
      </details>
    </section>
  );
}
