"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { TrendChart, type TrendChartProps } from "./TrendChart";
import { TimeRangeSelector } from "./TimeRangeSelector";
import type { TimeRange } from "@/lib/chart-types";
import { Pause, Play, RefreshCw } from "lucide-react";

export interface TrendChartConfig extends Omit<TrendChartProps, "timeRange" | "onCrosshairMove" | "crosshairTimestamp"> {
  /** Unique key for the chart */
  id: string;
}

export interface TrendChartGridProps {
  /** Array of chart configurations */
  charts: TrendChartConfig[];
  /** Whether data is currently streaming */
  isStreaming?: boolean;
  /** Whether streaming is paused */
  isPaused?: boolean;
  /** Callback to toggle pause */
  onTogglePause?: () => void;
  /** Callback to refresh data */
  onRefresh?: () => void;
  /** Optional className */
  className?: string;
  /** Initial time range */
  initialTimeRange?: TimeRange;
  /** Callback when time range changes */
  onTimeRangeChange?: (range: TimeRange) => void;
}

/**
 * TrendChartGrid - Grid of synced trend charts with shared controls
 * 
 * Features:
 * - Shared time range selector
 * - Crosshair sync across charts
 * - Pause/resume controls
 * - Responsive 1-2 column layout
 */
export function TrendChartGrid({
  charts,
  isStreaming = false,
  isPaused = false,
  onTogglePause,
  onRefresh,
  className,
  initialTimeRange = "1H",
  onTimeRangeChange,
}: TrendChartGridProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [crosshairTimestamp, setCrosshairTimestamp] = useState<number | null>(null);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
  }, [onTimeRangeChange]);

  const handleCrosshairMove = useCallback((timestamp: number | null) => {
    setCrosshairTimestamp(timestamp);
  }, []);

  if (charts.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        No trend charts to display
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TimeRangeSelector
            value={timeRange}
            onChange={handleTimeRangeChange}
          />
          
          {/* Streaming status */}
          {isStreaming && !isPaused && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Streaming
            </span>
          )}
          {isPaused && (
            <span className="text-xs text-amber-400">
              Paused
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className={cn(
                "p-2 rounded-lg transition-colors cursor-pointer",
                "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              aria-label="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          {/* Pause/Play button */}
          {onTogglePause && (
            <button
              onClick={onTogglePause}
              className={cn(
                "p-2 rounded-lg transition-colors cursor-pointer",
                "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              aria-label={isPaused ? "Resume streaming" : "Pause streaming"}
            >
              {isPaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {charts.map((chart) => (
          <TrendChart
            key={chart.id}
            {...chart}
            timeRange={timeRange}
            isStreaming={isStreaming && !isPaused}
            onCrosshairMove={handleCrosshairMove}
            crosshairTimestamp={crosshairTimestamp}
          />
        ))}
      </div>
    </div>
  );
}
