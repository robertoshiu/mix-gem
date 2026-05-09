import { cn } from '@/lib/utils';
import type { SubsystemGauge } from '@/lib/fab-twin-data';

const STATUS_COLOR: Record<SubsystemGauge['status'], string> = {
  nominal: 'var(--sf-status-green)',
  warning: 'var(--sf-status-amber)',
  alarm: 'var(--sf-status-red)',
};

export function HexGaugeChip({ gauge, className }: { gauge: SubsystemGauge; className?: string }) {
  const color = STATUS_COLOR[gauge.status];

  return (
    <div
      className={cn('relative min-h-[86px] border bg-[rgba(2,6,23,0.62)] px-4 py-3 font-mono shadow-[0_0_28px_rgba(0,0,0,0.22)]', className)}
      style={{
        borderColor: color,
        clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-muted)]">{gauge.label}</p>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-2xl font-semibold leading-none text-[var(--sf-text-primary)]">{gauge.value}</span>
        <span className="pb-0.5 text-[10px] text-[var(--sf-text-secondary)]">{gauge.unit}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(4, gauge.value))}%`, backgroundColor: color, boxShadow: `0 0 14px ${color}` }} />
      </div>
    </div>
  );
}
