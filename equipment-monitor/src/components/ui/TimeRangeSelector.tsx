"use client";

import { cn } from "@/lib/utils";
import type { TimeRange } from "@/lib/chart-types";

interface TimeRangeSelectorProps {
  /** Currently selected time range */
  value: TimeRange;
  /** Callback when range changes */
  onChange: (range: TimeRange) => void;
  /** Optional className */
  className?: string;
}

const TIME_RANGES: TimeRange[] = ["1H", "4H", "24H"];

/**
 * TimeRangeSelector - Pill-style time range selector
 * 
 * Following design spec:
 * - 44px minimum touch target height
 * - Accessible with keyboard navigation
 */
export function TimeRangeSelector({
  value,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-lg bg-slate-800",
        className
      )}
      role="radiogroup"
      aria-label="Time range selection"
    >
      {TIME_RANGES.map((range) => {
        const isSelected = range === value;
        return (
          <button
            key={range}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(range)}
            className={cn(
              "px-3 py-2 min-h-[44px] min-w-[48px]",
              "rounded-md text-sm font-medium",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900",
              "cursor-pointer",
              isSelected
                ? "bg-blue-500 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            )}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}
