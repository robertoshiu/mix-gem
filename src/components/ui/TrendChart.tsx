"use client";

import { useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import { cn, calculateStatus, type EquipmentStatus } from "@/lib/utils";
import {
  type TrendDataPoint,
  type SpecLimits,
  type TimeRange,
  formatTimestamp,
  formatTooltipTimestamp,
  CHART_COLORS,
  getStatusHexColor,
} from "@/lib/chart-types";

export interface TrendChartProps {
  /** Chart title/label */
  label: string;
  /** Equipment ID for display */
  equipmentId?: string;
  /** Data points to display */
  data: TrendDataPoint[];
  /** Unit of measurement */
  unit: string;
  /** Specification limits */
  spec: SpecLimits;
  /** Current time range for axis formatting */
  timeRange: TimeRange;
  /** Height of the chart (default: 200) */
  height?: number;
  /** Whether chart is currently streaming */
  isStreaming?: boolean;
  /** Current value to highlight */
  currentValue?: number | null;
  /** Optional className */
  className?: string;
  /** Callback for crosshair sync (receives timestamp) */
  onCrosshairMove?: (timestamp: number | null) => void;
  /** External crosshair position (for sync) */
  crosshairTimestamp?: number | null;
}

/**
 * Custom tooltip component props
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: number;
  unit: string;
  spec: SpecLimits;
}

/**
 * Custom tooltip component
 */
function CustomTooltip({
  active,
  payload,
  label,
  unit,
  spec,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || label === undefined) {
    return null;
  }

  const dataPoint = payload[0];
  const value = dataPoint.value ?? 0;
  const timestamp = label;
  const status = calculateStatus(value, `±${spec.usl}`);

  return (
    <div
      className="px-3 py-2 rounded-lg shadow-lg border"
      style={{
        backgroundColor: CHART_COLORS.tooltip.background,
        borderColor: CHART_COLORS.tooltip.border,
      }}
    >
      <div className="text-xs text-slate-400 mb-1">
        {formatTooltipTimestamp(timestamp)}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: getStatusHexColor(status) }}
        />
        <span
          className="font-mono text-lg font-medium"
          style={{ color: getStatusHexColor(status) }}
        >
          {value >= 0 ? "+" : ""}
          {value.toFixed(2)}
        </span>
        <span className="text-sm text-slate-400">{unit}</span>
      </div>
      <div className="text-xs text-slate-500 mt-1">
        Status: {status}
      </div>
    </div>
  );
}

/**
 * TrendChart - Streaming area chart with spec limit bands
 * 
 * Features:
 * - Recharts AreaChart with smooth gradients
 * - USL/LSL reference lines
 * - Warning zone shading (80% of spec)
 * - Custom tooltip with timestamp and status
 * - Crosshair sync support
 * - Responsive container
 */
export function TrendChart({
  label,
  equipmentId,
  data,
  unit,
  spec,
  timeRange,
  height = 200,
  isStreaming = false,
  currentValue,
  className,
  onCrosshairMove,
}: TrendChartProps) {
  // Calculate warning thresholds (80% of spec)
  const warningThreshold = 0.8;
  const upperWarning = spec.usl * warningThreshold;
  const lowerWarning = spec.lsl * warningThreshold;

  // Determine current status for styling
  const currentStatus: EquipmentStatus = useMemo(() => {
    if (currentValue === null || currentValue === undefined) return "offline";
    return calculateStatus(currentValue, `±${spec.usl}`);
  }, [currentValue, spec.usl]);

  // Format X axis ticks
  const formatXAxis = useCallback(
    (timestamp: number) => formatTimestamp(timestamp, timeRange),
    [timeRange]
  );

  // Calculate Y axis domain with padding
  const yDomain = useMemo(() => {
    const padding = (spec.usl - spec.lsl) * 0.2;
    return [spec.lsl - padding, spec.usl + padding];
  }, [spec]);

  // Handle mouse move for crosshair sync
  const handleMouseMove = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => {
      if (onCrosshairMove && state?.activeTooltipIndex != null && typeof state.activeTooltipIndex === 'number') {
        const point = data[state.activeTooltipIndex];
        if (point) {
          onCrosshairMove(point.timestamp);
        }
      }
    },
    [data, onCrosshairMove]
  );

  const handleMouseLeave = useCallback(() => {
    if (onCrosshairMove) {
      onCrosshairMove(null);
    }
  }, [onCrosshairMove]);

  return (
    <div
      className={cn(
        "p-4 rounded-lg bg-slate-900 border border-slate-700",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-slate-300">{label}</h3>
          <span className="text-xs text-slate-500">({unit})</span>
        </div>
        <div className="flex items-center gap-3">
          {equipmentId && (
            <span className="text-xs text-slate-500">{equipmentId}</span>
          )}
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
          {currentValue !== null && currentValue !== undefined && (
            <span
              className="font-mono text-lg font-medium"
              style={{ color: getStatusHexColor(currentStatus) }}
            >
              {currentValue >= 0 ? "+" : ""}
              {currentValue.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid styling handled by reference lines */}
          
          {/* Warning zone bands (80% of spec) */}
          <ReferenceArea
            y1={upperWarning}
            y2={spec.usl}
            fill={CHART_COLORS.warningBand}
            fillOpacity={CHART_COLORS.warningBandOpacity}
          />
          <ReferenceArea
            y1={spec.lsl}
            y2={lowerWarning}
            fill={CHART_COLORS.warningBand}
            fillOpacity={CHART_COLORS.warningBandOpacity}
          />

          {/* Spec limit reference lines */}
          <ReferenceLine
            y={spec.usl}
            stroke={CHART_COLORS.usl}
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: `USL (${spec.usl >= 0 ? "+" : ""}${spec.usl})`,
              position: "right",
              fill: CHART_COLORS.usl,
              fontSize: 10,
            }}
          />
          <ReferenceLine
            y={spec.lsl}
            stroke={CHART_COLORS.lsl}
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: `LSL (${spec.lsl >= 0 ? "+" : ""}${spec.lsl})`,
              position: "right",
              fill: CHART_COLORS.lsl,
              fontSize: 10,
            }}
          />
          
          {/* Target line (center) */}
          {spec.target !== undefined && (
            <ReferenceLine
              y={spec.target}
              stroke={CHART_COLORS.target}
              strokeDasharray="2 2"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          )}

          {/* X Axis (time) */}
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatXAxis}
            stroke={CHART_COLORS.axis}
            tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
            tickLine={{ stroke: CHART_COLORS.grid }}
            axisLine={{ stroke: CHART_COLORS.grid }}
            minTickGap={50}
          />

          {/* Y Axis (value) */}
          <YAxis
            domain={yDomain}
            stroke={CHART_COLORS.axis}
            tick={{ fill: CHART_COLORS.axis, fontSize: 10 }}
            tickLine={{ stroke: CHART_COLORS.grid }}
            axisLine={{ stroke: CHART_COLORS.grid }}
            tickFormatter={(v) => (v >= 0 ? `+${v}` : `${v}`)}
            width={45}
          />

          {/* Tooltip */}
          <Tooltip
            content={<CustomTooltip unit={unit} spec={spec} />}
            cursor={{
              stroke: CHART_COLORS.axis,
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          {/* Area fill with gradient */}
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.fill}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.fill}
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="value"
            stroke={CHART_COLORS.line}
            strokeWidth={2}
            fill={`url(#gradient-${label})`}
            isAnimationActive={false}
            dot={false}
            activeDot={{
              r: 4,
              fill: CHART_COLORS.line,
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Footer with spec info */}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>
          Spec: {spec.lsl >= 0 ? "+" : ""}{spec.lsl} to {spec.usl >= 0 ? "+" : ""}{spec.usl} {unit}
        </span>
        <span>
          Warning at ±{(spec.usl * warningThreshold).toFixed(1)} {unit}
        </span>
      </div>
    </div>
  );
}
