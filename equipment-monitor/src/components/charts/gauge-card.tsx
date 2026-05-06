"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ProcessParameter } from "@/types/equipment";

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

  const range = usl - lsl;
  const pct = Math.max(0, Math.min(100, ((value - lsl) / range) * 100));

  const statusColorVar =
    status === "alarm"
      ? "var(--sf-status-red)"
      : status === "warning"
        ? "var(--sf-status-amber)"
        : "var(--sf-status-green)";

  const statusMessage =
    status === "alarm"
      ? `${name} alarm: ${value}${unit}`
      : status === "warning"
        ? `${name} warning: ${value}${unit}`
        : `${name}: ${value}${unit}`;

  // --- SVG layout constants (32px padding in viewBox, enlarged for 10-char values) ---
  const VW = 200;
  const VH = 124;
  const PAD = 32;
  const RADIUS = 75;
  const ARC_Y = VH - PAD;

  const arcPath = `M ${PAD} ${ARC_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${VW - PAD} ${ARC_Y}`;
  const circumference = Math.PI * RADIUS;
  const dashOffset = circumference - (pct / 100) * circumference;

  // --- Value formatting ---
  const formatted = `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
  const n = formatted.length;

  // Dynamic font sizing: ≤4=text-xl(20), 5-6=text-lg(18), 7-8=text-base(16), 9-10=text-sm(14), 11+=text-xs(12)
  const valueFontSize =
    n <= 4 ? 20 : n <= 6 ? 18 : n <= 8 ? 16 : n <= 10 ? 14 : 12;

  // textLength is the PRIMARY overflow guard — calculated from viewBox width minus padding
  const textLength = VW - 2 * PAD; // 136

  return (
    <Card
      className={cn("p-4 overflow-hidden", className)}
      style={{
        backgroundColor: "var(--sf-bg-base)",
        borderColor: "var(--sf-border-default)",
      }}
    >
      {/* Parameter name */}
      <div className="text-center mb-1">
        <span
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: "var(--sf-text-secondary)" }}
        >
          {name}
        </span>
      </div>

      {/* SVG Gauge */}
      <div className="flex justify-center my-1">
        <svg
          width="200"
          height="124"
          viewBox={`0 0 ${VW} ${VH}`}
          className="overflow-visible"
          role="img"
          aria-label={statusMessage}
        >
          {/* Background half-circle arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="var(--sf-border-default)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Colored value arc with dash animation */}
          <path
            d={arcPath}
            fill="none"
            stroke={statusColorVar}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500"
          />

          {/* Value text — textLength is the PRIMARY overflow protection mechanism */}
          <text
            x={VW / 2}
            y={64}
            textAnchor="middle"
            fontSize={valueFontSize}
            fontFamily="var(--font-family-mono), 'JetBrains Mono', monospace"
            fontWeight="500"
            fill="var(--gauge-value-color)"
            textLength={textLength}
            lengthAdjust="spacingAndGlyphs"
            overflow="hidden"
          >
            {formatted}
          </text>

          {/* Unit label */}
          <text
            x={VW / 2}
            y={89}
            textAnchor="middle"
            fontSize={12}
            fontFamily="var(--font-family-sans), Inter, sans-serif"
            fill="var(--sf-text-secondary)"
            overflow="hidden"
          >
            {unit}
          </text>
        </svg>
      </div>

      {/* Spec range footer */}
      <div className="text-center">
        <span className="text-xs" style={{ color: "var(--sf-text-muted)" }}>
          Spec: {lsl} to {usl} {unit}
        </span>
      </div>

      {/* Accessible live region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
    </Card>
  );
}
