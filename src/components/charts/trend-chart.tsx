"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendDataPoint } from "@/types/equipment";
import { cn } from "@/lib/utils";
import { useChartSync } from "./chart-sync-provider";
import { lttbDownsample } from "@/lib/chart-types";
import { ChartDataTable } from "./chart-data-table";

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  unit: string;
  lsl: number;
  usl: number;
  currentValue?: number;
  className?: string;
}

export function TrendChart({
  title,
  data,
  unit,
  lsl,
  usl,
  currentValue,
  className,
}: TrendChartProps) {
  const { activeIndex, setActiveIndex } = useChartSync();

  const displayData = useMemo(() => {
    // Use LTTB downsampling for datasets > 200 points
    if (data.length > 200) {
      return lttbDownsample(data, 200);
    }
    return data;
  }, [data]);

  // Calculate warning thresholds (80% of spec)
  const range = usl - lsl;
  const warningLow = lsl + range * 0.2;
  const warningHigh = usl - range * 0.2;

  // Format timestamp for X axis
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine current status
  const status = useMemo(() => {
    if (currentValue === undefined) return "normal";
    if (currentValue < lsl || currentValue > usl) return "alarm";
    if (currentValue < warningLow || currentValue > warningHigh) return "warning";
    return "normal";
  }, [currentValue, lsl, usl, warningLow, warningHigh]);

  const statusColors = {
    normal: "#10B981",
    warning: "#F59E0B",
    alarm: "#EF4444",
  };

  return (
    <Card className={cn("p-4 bg-slate-900 border-slate-700", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-50">{title}</h3>
        {currentValue !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current:</span>
            <span
              className="font-mono text-lg font-medium"
              style={{ color: statusColors[status] }}
            >
              {currentValue >= 0 ? "+" : ""}
              {currentValue.toFixed(1)} {unit}
            </span>
          </div>
        )}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={displayData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseMove={(state) => {
              if (state?.activeTooltipIndex !== undefined && typeof state.activeTooltipIndex === 'number') {
                setActiveIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {/* Warning zones */}
            <ReferenceArea
              y1={lsl}
              y2={warningLow}
              fill="#F59E0B"
              fillOpacity={0.1}
            />
            <ReferenceArea
              y1={warningHigh}
              y2={usl}
              fill="#F59E0B"
              fillOpacity={0.1}
            />

            {/* Spec limits */}
            <ReferenceLine
              y={usl}
              stroke="#EF4444"
              strokeDasharray="4 4"
              label={{ value: "USL", position: "right", fill: "#EF4444", fontSize: 10 }}
            />
            <ReferenceLine
              y={lsl}
              stroke="#EF4444"
              strokeDasharray="4 4"
              label={{ value: "LSL", position: "right", fill: "#EF4444", fontSize: 10 }}
            />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[lsl - range * 0.1, usl + range * 0.1]}
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(0)}
            />
            <Tooltip
              cursor={{ stroke: "#3b82f6", strokeWidth: 1 }}
              active={activeIndex !== null}
              contentStyle={{
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
              formatter={(value: number | undefined) => [
                value !== undefined ? `${value.toFixed(2)} ${unit}` : "No Data",
                title,
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={statusColors[status]}
              fill={statusColors[status]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-2 mt-2">
        {["1H", "4H", "24H"].map((range) => (
          <button
            key={range}
            className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-slate-50 hover:bg-slate-800 rounded transition-colors"
          >
            {range}
          </button>
        ))}
      </div>

      {/* Accessible data table */}
      <ChartDataTable data={data} title={title} unit={unit} />
    </Card>
  );
}
