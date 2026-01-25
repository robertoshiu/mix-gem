import { cn } from "@/lib/utils";
import { EquipmentStatus } from "@/types/equipment";

const statusConfig: Record<EquipmentStatus, { color: string; label: string; pulse?: boolean }> = {
  process: { color: "bg-emerald-500", label: "Process" },
  idle: { color: "bg-blue-400", label: "Idle" },
  warning: { color: "bg-amber-500", label: "Warning" },
  alarm: { color: "bg-red-500", label: "Alarm", pulse: true },
  offline: { color: "bg-slate-500", label: "Offline" },
  pm: { color: "bg-purple-500", label: "PM" },
};

interface StatusIndicatorProps {
  status: EquipmentStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  size = "md",
  showLabel = false,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        role="status"
        aria-label={config.label}
        className={cn(
          "rounded-full",
          sizeClasses[size],
          config.color,
          config.pulse && "animate-pulse"
        )}
      />
      {showLabel && (
        <span className="text-sm text-slate-400">{config.label}</span>
      )}
    </div>
  );
}
