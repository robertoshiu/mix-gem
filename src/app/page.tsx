"use client";

import { useState, useCallback } from "react";
import { GaugeGrid, TrendChartGrid, type GaugeCardProps, type TrendChartConfig } from "@/components/ui";
import { useStreamingData } from "@/hooks/useStreamingData";
import { parseSpec, type TimeRange } from "@/lib/chart-types";
import { Activity, Settings } from "lucide-react";

// Sample equipment gauge data showcasing all status types
const sampleGauges: GaugeCardProps[] = [
  {
    label: "Focus Offset",
    value: 2.3,
    unit: "nm",
    spec: "±10",
    status: "normal",
  },
  {
    label: "CDU",
    value: 4.2,
    unit: "nm",
    spec: "<5",
    status: "warning",
  },
  {
    label: "Overlay X",
    value: 1.8,
    unit: "nm",
    spec: "<3",
    status: "normal",
  },
  {
    label: "Overlay Y",
    value: 2.9,
    unit: "nm",
    spec: "<3",
    status: "warning",
  },
];

// Trend chart configurations matching the gauge parameters
const TREND_CONFIGS = [
  { id: "focus-offset", label: "Focus Offset", unit: "nm", spec: "±10" },
  { id: "cdu", label: "CDU", unit: "nm", spec: "<5" },
  { id: "overlay-x", label: "Overlay X", unit: "nm", spec: "<3" },
  { id: "overlay-y", label: "Overlay Y", unit: "nm", spec: "<3" },
];

/**
 * Streaming Trend Charts Section
 * Uses hooks to manage streaming data with proper lifecycle
 */
function StreamingTrendSection() {
  const [timeRange, setTimeRange] = useState<TimeRange>("1H");

  // Create streaming data hooks for each parameter
  const focusData = useStreamingData({
    spec: parseSpec("±10"),
    timeRange,
    updateInterval: 3000,
  });

  const cduData = useStreamingData({
    spec: parseSpec("<5"),
    timeRange,
    updateInterval: 3000,
  });

  const overlayXData = useStreamingData({
    spec: parseSpec("<3"),
    timeRange,
    updateInterval: 3000,
  });

  const overlayYData = useStreamingData({
    spec: parseSpec("<3"),
    timeRange,
    updateInterval: 3000,
  });

  // Combine all data streams
  const streamingHooks = [focusData, cduData, overlayXData, overlayYData];
  const isAnyStreaming = streamingHooks.some(h => !h.isPaused);
  const isAnyPaused = streamingHooks.some(h => h.isPaused);

  // Build chart configs with live data
  const charts: TrendChartConfig[] = TREND_CONFIGS.map((config, index) => ({
    id: config.id,
    label: config.label,
    unit: config.unit,
    spec: parseSpec(config.spec),
    data: streamingHooks[index].data,
    currentValue: streamingHooks[index].currentValue,
    equipmentId: "LITHO01",
  }));

  // Pause/resume all charts
  const handleTogglePause = useCallback(() => {
    streamingHooks.forEach(hook => hook.togglePause());
  }, [streamingHooks]);

  // Refresh all charts
  const handleRefresh = useCallback(() => {
    streamingHooks.forEach(hook => hook.refresh());
  }, [streamingHooks]);

  return (
    <TrendChartGrid
      charts={charts}
      isStreaming={isAnyStreaming}
      isPaused={isAnyPaused}
      onTogglePause={handleTogglePause}
      onRefresh={handleRefresh}
      initialTimeRange={timeRange}
      onTimeRangeChange={setTimeRange}
    />
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-500" />
          <h1 className="text-lg font-semibold text-slate-50">
            Equipment Monitor
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Alert badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-400">1 Alarm</span>
          </div>
          
          <button 
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Gauge Cards Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-50 mb-2">
              LITHO01 - Current Values
            </h2>
            <p className="text-sm text-slate-400">
              Real-time parameter monitoring with status indicators
            </p>
          </div>
          <GaugeGrid gauges={sampleGauges} />
        </section>

        {/* Trend Charts Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-50 mb-2">
              LITHO01 - Trend Analysis
            </h2>
            <p className="text-sm text-slate-400">
              Streaming time-series data with spec limit bands
            </p>
          </div>
          <StreamingTrendSection />
        </section>

        {/* Legend */}
        <section className="p-4 bg-slate-900 rounded-lg border border-slate-700">
          <h3 className="text-sm font-medium text-slate-300 mb-3">
            Status Legend
          </h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Normal - Operating within spec</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-400">Warning - Attention needed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-slate-400">Alarm - Immediate action required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-slate-400">Idle - Standby</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-slate-400">Offline - Disconnected</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
