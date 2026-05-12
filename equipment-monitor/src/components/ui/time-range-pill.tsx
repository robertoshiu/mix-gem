'use client';

import { cn } from '@/lib/utils';

interface TimeRangePillProps {
  label: string;
  value: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export function TimeRangePill({
  label,
  value,
  isActive,
  onClick,
  className,
}: TimeRangePillProps) {
  // value is part of the public API for consumers; not rendered directly
  void value;
  return (
    <button
      onClick={onClick}
      className={cn(
        'min-h-[44px] min-w-[44px] px-4 rounded-full text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-500 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
        className
      )}
      aria-pressed={isActive}
      aria-label={label}
    >
      {label}
    </button>
  );
}
