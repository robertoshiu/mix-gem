"use client";

import { cn } from "@/lib/utils";

type TimeRange = "1H" | "4H" | "24H" | "7D";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const ranges: TimeRange[] = ["1H", "4H", "24H", "7D"];

export function TimeRangeSelector({
  value,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div
      className={cn("inline-flex rounded-md bg-slate-800 p-1", className)}
      role="radiogroup"
      aria-label="Time range"
    >
      {ranges.map((range) => (
        <button
          key={range}
          role="radio"
          aria-checked={value === range}
          onClick={() => onChange(range)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded transition-colors min-h-[44px]",
            value === range
              ? "bg-blue-500 text-white"
              : "text-slate-400 hover:text-slate-50 hover:bg-slate-700"
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}

export type { TimeRange };
