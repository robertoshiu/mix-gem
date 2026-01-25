"use client";

import { cn } from "@/lib/utils";
import { GaugeCard, type GaugeCardProps } from "./GaugeCard";

export interface GaugeGridProps {
  /** Array of gauge configurations */
  gauges: GaugeCardProps[];
  /** Optional className for the grid container */
  className?: string;
}

/**
 * GaugeGrid - Responsive grid layout for multiple GaugeCards
 * 
 * Adaptive layout following the design spec:
 * - XL (1440px+): 4-column grid
 * - LG (1024px): 3-column grid  
 * - MD (768px): 2-column grid
 * - SM (375px): Single column
 */
export function GaugeGrid({ gauges, className }: GaugeGridProps) {
  if (gauges.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        No gauges to display
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        // Responsive columns per design spec
        "grid-cols-1",           // SM: single column
        "sm:grid-cols-2",        // MD: 2 columns
        "lg:grid-cols-3",        // LG: 3 columns
        "xl:grid-cols-4",        // XL: 4 columns
        className
      )}
    >
      {gauges.map((gauge, index) => (
        <GaugeCard
          key={`${gauge.label}-${index}`}
          {...gauge}
        />
      ))}
    </div>
  );
}

// Re-export GaugeCard types for convenience
export type { GaugeCardProps };
