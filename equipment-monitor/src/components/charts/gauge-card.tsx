"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ProcessParameter } from "@/types/equipment";

interface GaugeCardProps {
  parameter: ProcessParameter;
  className?: string;
}

function getStatus(value: number, lsl: number, usl: number) {
  const range = usl - lsl;
  const warningThreshold = range * 0.2; // 20% from limits

  if (value < lsl || value > usl) return "alarm";
  if (value < lsl + warningThreshold || value > usl - warningThreshold) return "warning";
  return "normal";
}

export function GaugeCard({ parameter, className }: GaugeCardProps) {
  const { name, value, unit, lsl, usl } = parameter;
  const status = getStatus(value, lsl, usl);

  // Calculate percentage for gauge arc
  const range = usl - lsl;
  const percentage = Math.max(0, Math.min(100, ((value - lsl) / range) * 100));

  const statusColors = {
    normal: { stroke: "#10B981", text: "text-emerald-500" },
    warning: { stroke: "#F59E0B", text: "text-amber-500" },
    alarm: { stroke: "#EF4444", text: "text-red-500" },
  };

  const { stroke, text } = statusColors[status];

  // SVG arc calculation
  const radius = 40;
  const circumference = Math.PI * radius; // Half circle
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card className={cn("p-4 bg-slate-900 border-slate-700", className)}>
      <div className="text-center">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {name}
        </span>
      </div>

      <div className="relative flex justify-center my-2">
        <svg
          width="100"
          height="60"
          viewBox="0 0 100 60"
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#334155"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
          <span className={cn("text-2xl font-mono font-medium", text)}>
            {value >= 0 ? "+" : ""}{value.toFixed(1)}
          </span>
          <span className="text-sm text-slate-400 ml-1">{unit}</span>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        Spec: {lsl} to {usl} {unit}
      </div>
    </Card>
  );
}
