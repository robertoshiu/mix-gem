"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ProcessParameter } from "@/types/equipment";

interface GaugeCardProps {
  parameter: ProcessParameter;
  className?: string;
}

type GaugeStatus = "normal" | "warning" | "alarm";

const VIEWBOX_WIDTH = 240;
const VIEWBOX_HEIGHT = 154;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = 124;
const RADIUS = 86;
const ARC_LENGTH = Math.PI * RADIUS;

function polarToCartesian(angle: number, radius = RADIUS) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.cos(radians),
    y: CENTER_Y + radius * Math.sin(radians),
  };
}

function describeArc(startAngle: number, endAngle: number, radius = RADIUS) {
  const start = polarToCartesian(startAngle, radius);
  const end = polarToCartesian(endAngle, radius);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

function safeRange(lsl: number, usl: number) {
  return Math.max(Math.abs(usl - lsl), Number.EPSILON);
}

function getStatus(value: number, lsl: number, usl: number): GaugeStatus {
  const range = safeRange(lsl, usl);
  const warningThreshold = range * 0.2;

  if (value < lsl || value > usl) return "alarm";
  if (value < lsl + warningThreshold || value > usl - warningThreshold) return "warning";
  return "normal";
}

function formatValue(value: number) {
  const abs = Math.abs(value);
  if (abs >= 100) return value.toFixed(1);
  if (abs >= 10) return value.toFixed(2);
  return value.toFixed(3);
}

export function GaugeCard({ parameter, className }: GaugeCardProps) {
  const { name, value, unit, lsl, usl } = parameter;
  const status = getStatus(value, lsl, usl);
  const range = safeRange(lsl, usl);
  const pct = Math.max(0, Math.min(100, ((value - lsl) / range) * 100));
  const needleAngle = -180 + (pct / 100) * 180;
  const needleEnd = polarToCartesian(needleAngle, RADIUS - 16);
  const formatted = formatValue(value);

  const statusColorVar =
    status === "alarm"
      ? "var(--sf-status-red)"
      : status === "warning"
        ? "var(--sf-status-amber)"
        : "var(--sf-status-green)";

  const statusMessage =
    status === "alarm"
      ? `${name} alarm: ${formatted}${unit}`
      : status === "warning"
        ? `${name} warning: ${formatted}${unit}`
        : `${name}: ${formatted}${unit}`;

  return (
    <Card
      className={cn(
        "group min-w-0 overflow-hidden rounded-xl border p-3 shadow-[0_16px_40px_rgba(0,0,0,0.22)] transition-colors duration-200 sm:p-4",
        className,
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(24,40,64,0.94), rgba(10,22,40,0.96))",
        borderColor: "var(--sf-border-default)",
      }}
    >
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <span
          className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--sf-text-secondary)" }}
          title={name}
        >
          {name}
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            color: statusColorVar,
            backgroundColor: "rgba(255,255,255,0.06)",
            border: `1px solid ${statusColorVar}`,
          }}
        >
          {status}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="block h-auto w-full overflow-visible"
        role="meter"
        aria-label={statusMessage}
        aria-valuemin={lsl}
        aria-valuemax={usl}
        aria-valuenow={value}
      >
        <defs>
          <filter id={`gauge-glow-${name.replace(/\W+/g, "-")}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={describeArc(-180, 0)}
          fill="none"
          stroke="rgba(148, 163, 184, 0.18)"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d={describeArc(-180, 0)}
          fill="none"
          stroke={statusColorVar}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={ARC_LENGTH - (pct / 100) * ARC_LENGTH}
          className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />

        {[-180, -135, -90, -45, 0].map((angle) => {
          const outer = polarToCartesian(angle, RADIUS + 10);
          const inner = polarToCartesian(angle, RADIUS - 4);
          return (
            <line
              key={angle}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(148, 163, 184, 0.42)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}

        <line
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={statusColorVar}
          strokeWidth="4"
          strokeLinecap="round"
          filter={`url(#gauge-glow-${name.replace(/\W+/g, "-")})`}
          className="transition-all duration-500 motion-reduce:transition-none"
        />
        <circle cx={CENTER_X} cy={CENTER_Y} r="7" fill="var(--sf-bg-base)" stroke={statusColorVar} strokeWidth="3" />

        <text
          x={CENTER_X}
          y="66"
          textAnchor="middle"
          fontSize={formatted.length > 7 ? 24 : 29}
          fontFamily="var(--font-family-mono), 'Fira Code', monospace"
          fontWeight="700"
          fill="var(--gauge-value-color)"
        >
          {formatted}
        </text>
        <text
          x={CENTER_X}
          y="88"
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          letterSpacing="0.14em"
          fill="var(--sf-text-secondary)"
        >
          {unit || "RATIO"}
        </text>
        <text x="18" y="146" fontSize="11" fill="var(--sf-text-muted)">
          {lsl}
        </text>
        <text x={VIEWBOX_WIDTH - 18} y="146" textAnchor="end" fontSize="11" fill="var(--sf-text-muted)">
          {usl}
        </text>
      </svg>

      <div className="mt-2 flex items-center justify-between gap-2 text-[11px]" style={{ color: "var(--sf-text-muted)" }}>
        <span className="truncate">Spec window</span>
        <span className="font-mono tabular-nums">
          {lsl} - {usl} {unit}
        </span>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>
    </Card>
  );
}
