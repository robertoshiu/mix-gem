"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { ProcessParameter } from "@/types/equipment";
import {
  GAUGE_VIEWBOX,
  GAUGE_ARC,
  GAUGE_TEXT,
  polarToCartesian,
  describeGaugeArc,
  safeRange,
  clampPercentage,
  computeGaugeValueFontSize,
  formatGaugeValue,
  sanitizeSvgId,
} from "@/lib/gauge-geometry";

interface GaugeCardProps {
  parameter: ProcessParameter;
  className?: string;
}

type GaugeStatus = "normal" | "warning" | "alarm";

function getStatus(value: number, lsl: number, usl: number): GaugeStatus {
  const range = safeRange(lsl, usl);
  const warningThreshold = range * 0.2;

  if (value < lsl || value > usl) return "alarm";
  if (value < lsl + warningThreshold || value > usl - warningThreshold) return "warning";
  return "normal";
}

export function GaugeCard({ parameter, className }: GaugeCardProps) {
  const { name, value, unit, lsl, usl } = parameter;
  const status = getStatus(value, lsl, usl);
  const range = safeRange(lsl, usl);
  const pct = clampPercentage(((value - lsl) / range) * 100);
  const ARC_LENGTH = Math.PI * GAUGE_ARC.radius;
  const needleAngle = -180 + (pct / 100) * 180;
  const needleEnd = polarToCartesian(needleAngle, GAUGE_ARC.radius - 16);
  const formatted = formatGaugeValue(value);
  const filterId = sanitizeSvgId(name);

  const statusColorVar =
    status === "alarm"
      ? "var(--sf-gauge-zone-red)"
      : status === "warning"
        ? "var(--sf-gauge-zone-amber)"
        : "var(--sf-gauge-zone-green)";

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
        background: "var(--sf-gauge-bg-gradient)",
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
        viewBox={`0 0 ${GAUGE_VIEWBOX.width} ${GAUGE_VIEWBOX.height}`}
        className="block h-auto w-full overflow-visible"
        role="meter"
        aria-label={statusMessage}
        aria-valuemin={lsl}
        aria-valuemax={usl}
        aria-valuenow={value}
        aria-valuetext={`${name}: ${formatted} ${unit || 'ratio'}, status ${status}, spec ${lsl} to ${usl}`}
      >
        <defs>
          <filter id={`gauge-glow-${filterId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={describeGaugeArc(-180, 0)}
          fill="none"
          stroke="var(--sf-gauge-arc-track)"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <path
          d={describeGaugeArc(-180, 0)}
          fill="none"
          stroke={statusColorVar}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={ARC_LENGTH - (pct / 100) * ARC_LENGTH}
          className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />

        {[-180, -135, -90, -45, 0].map((angle) => {
          const outer = polarToCartesian(angle, GAUGE_ARC.radius + 10);
          const inner = polarToCartesian(angle, GAUGE_ARC.radius - 4);
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
          x1={GAUGE_ARC.centerX}
          y1={GAUGE_ARC.centerY}
          x2={needleEnd.x}
          y2={needleEnd.y}
          stroke={statusColorVar}
          strokeWidth="4"
          strokeLinecap="round"
          filter={`url(#gauge-glow-${filterId})`}
          className="transition-all duration-500 motion-reduce:transition-none"
        />
        <circle cx={GAUGE_ARC.centerX} cy={GAUGE_ARC.centerY} r="7" fill="var(--sf-bg-base)" stroke={statusColorVar} strokeWidth="3" />

        <text
          x={GAUGE_ARC.centerX}
          y="66"
          textAnchor="middle"
          fontSize={computeGaugeValueFontSize(formatted)}
          fontFamily="var(--font-family-mono), 'Fira Code', monospace"
          fontWeight="700"
          fill="var(--sf-gauge-value-color)"
          textLength={GAUGE_TEXT.valueWidth}
          lengthAdjust="spacingAndGlyphs"
        >
          {formatted}
        </text>
        <text
          x={GAUGE_ARC.centerX}
          y="88"
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          letterSpacing="0.14em"
          fill="var(--sf-gauge-unit-color)"
          textLength={GAUGE_TEXT.unitWidth}
          lengthAdjust="spacingAndGlyphs"
        >
          {unit || "RATIO"}
        </text>
        <text x="18" y="146" fontSize="11" fill="var(--sf-gauge-label-color)" textLength={GAUGE_TEXT.labelWidth} lengthAdjust="spacingAndGlyphs">
          {lsl}
        </text>
        <text x={GAUGE_VIEWBOX.width - 18} y="146" textAnchor="end" fontSize="11" fill="var(--sf-gauge-label-color)" textLength={GAUGE_TEXT.labelWidth} lengthAdjust="spacingAndGlyphs">
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