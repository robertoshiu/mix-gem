import { cn } from "@/lib/utils";
import { EquipmentStatus } from "@/types/equipment";

const statusConfig: Record<EquipmentStatus, { color: string; label: string; text: string; pulse?: boolean }> = {
  process: { color: "bg-emerald-500", label: "Process", text: "text-emerald-700" },
  idle: { color: "bg-blue-400", label: "Idle", text: "text-blue-700" },
  warning: { color: "bg-amber-500", label: "Warning", text: "text-amber-700" },
  alarm: { color: "bg-red-500", label: "Alarm", text: "text-red-700", pulse: true },
  offline: { color: "bg-slate-500", label: "Offline", text: "text-slate-700" },
  pm: { color: "bg-purple-500", label: "PM", text: "text-purple-700" },
};

const sizeClasses = {
  sm: 'min-w-[44px] min-h-[44px] p-2 gap-1.5',
  md: 'min-w-[44px] min-h-[44px] p-2.5 gap-2',
  lg: 'min-w-[56px] min-h-[56px] p-3 gap-2.5',
};

const dotSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

interface StatusIndicatorProps {
  status: EquipmentStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  return (
    <div
      data-testid="status-indicator"
      className={cn(
        'inline-flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`Status: ${statusConfig[status].label}`}
    >
      <div 
        className={cn(
          'rounded-full', 
          dotSizes[size], 
          statusConfig[status].color,
          statusConfig[status].pulse && "animate-pulse"
        )} 
      />
      {showLabel && (
        <span className={cn('text-sm font-medium', statusConfig[status].text)}>
          {statusConfig[status].label}
        </span>
      )}
    </div>
  );
}
