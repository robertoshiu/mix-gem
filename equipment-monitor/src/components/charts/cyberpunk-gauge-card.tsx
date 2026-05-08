"use client";

import { cn } from "@/lib/utils";
import {
  GAUGE_ARC,
  GAUGE_VIEWBOX,
  clampPercentage,
  computeGaugeValueFontSize,
  describeGaugeArc,
  formatGaugeValue,
  polarToCartesian,
  safeRange,
  sanitizeSvgId,
} from "@/lib/gauge-geometry";

export type CyberpunkGaugeStatus = "normal" | "warning" | "alarm";

export interface CyberpunkGaugeCardProps {
  title: string;
  value: number;
  unit?: string;
  lsl: number;
  usl: number;
  status?: CyberpunkGaugeStatus;
  zoneColor?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  interactive?: boolean;
  active?: boolean;
  testId?: string;
  className?: string;
  onClick?: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  valueFormatter?: (value: number) => string;
}

const HEX_POINTS = "120,4 224,48 224,118 120,158 16,118 16,48";
const HEX_VERTEX_TICKS: Array<[number, number, number, number]> = [
  [120, 4, 120, 18],
  [224, 48, 210, 54],
  [224, 118, 210, 112],
  [120, 158, 120, 144],
  [16, 118, 30, 112],
  [16, 48, 30, 54],
];

function inferStatus(value: number, lsl: number, usl: number): CyberpunkGaugeStatus {
  const range = safeRange(lsl, usl);
  const warningThreshold = range * 0.2;

  if (value < lsl || value > usl) return "alarm";
  if (value < lsl + warningThreshold || value > usl - warningThreshold) return "warning";
  return "normal";
}

function statusColor(status: CyberpunkGaugeStatus) {
  if (status === "alarm") return "var(--sf-gauge-zone-red)";
  if (status === "warning") return "var(--sf-gauge-zone-amber)";
  return "var(--sf-gauge-zone-green)";
}

export function CyberpunkGaugeCard({
  title,
  value,
  unit,
  lsl,
  usl,
  status = inferStatus(value, lsl, usl),
  zoneColor = "var(--sf-accent-cyan)",
  subtitle = "Spec window",
  footer,
  interactive = false,
  active = false,
  testId,
  className,
  onClick,
  onKeyDown,
  ariaLabel,
  ariaDescribedBy,
  valueFormatter = formatGaugeValue,
}: CyberpunkGaugeCardProps) {
  const range = safeRange(lsl, usl);
  const pct = clampPercentage(((value - lsl) / range) * 100);
  const arcLength = Math.PI * GAUGE_ARC.radius;
  const needleAngle = -180 + (pct / 100) * 180;
  const needleEnd = polarToCartesian(needleAngle, GAUGE_ARC.radius - 18);
  const formatted = valueFormatter(value);
  const filterId = sanitizeSvgId(`${title}-${unit ?? "unit"}`);
  const alertColor = statusColor(status);
  const borderColor = status === "normal" ? zoneColor : alertColor;
  const statusLabel = status === "alarm" ? "OOC" : status === "warning" ? "WARN" : "OK";
  const accessibleText = `${title}: ${formatted} ${unit || "ratio"}, status ${statusLabel}, spec ${lsl} to ${usl}`;

  return (
    <div
      data-testid={testId}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? active : undefined}
      aria-label={ariaLabel ?? (interactive ? accessibleText : undefined)}
      aria-describedby={ariaDescribedBy}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-2xl border p-3 shadow-[0_18px_48px_rgba(0,0,0,0.32)] transition-all duration-200 motion-reduce:transition-none sm:p-4",
        interactive && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]",
        active ? "bg-[rgba(24,40,64,0.98)]" : "bg-[rgba(10,22,40,0.94)] hover:bg-[rgba(24,40,64,0.92)]",
        status === "alarm" && "animate-pulse motion-reduce:animate-none",
        className,
      )}
      style={{
        borderColor,
        background:
          "linear-gradient(180deg, rgba(24,40,64,0.96), rgba(5,10,24,0.98)), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 6px)",
        boxShadow: `0 0 0 1px color-mix(in srgb, ${borderColor} 34%, transparent), 0 0 24px color-mix(in srgb, ${borderColor} 34%, transparent), 0 18px 48px rgba(0,0,0,0.34)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[var(--sf-scanline-opacity,0.04)] [background:repeating-linear-gradient(0deg,transparent_0_3px,white_3px_4px)]" />
      <div className="relative mb-2 flex min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.2em] text-[var(--sf-text-secondary)]" title={title}>
          {title}
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            color: alertColor,
            backgroundColor: "rgba(255,255,255,0.06)",
            border: `1px solid ${alertColor}`,
            boxShadow: status === "normal" ? "none" : `0 0 12px ${alertColor}`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${GAUGE_VIEWBOX.width} ${GAUGE_VIEWBOX.height}`}
        className="relative block h-auto w-full overflow-visible"
        role="meter"
        aria-label={accessibleText}
        aria-valuemin={lsl}
        aria-valuemax={usl}
        aria-valuenow={value}
        aria-valuetext={accessibleText}
      >
        <defs>
          <filter id={`cyber-gauge-glow-${filterId}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id={`cyber-scan-${filterId}`} width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 0 0 H 6" stroke="rgba(255,255,255,0.16)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <polygon points={HEX_POINTS} fill="rgba(3,7,18,0.26)" stroke={borderColor} strokeWidth="1.5" filter={`url(#cyber-gauge-glow-${filterId})`} />
        <polygon points={HEX_POINTS} fill={`url(#cyber-scan-${filterId})`} opacity="0.28" />
        {HEX_VERTEX_TICKS.map(([x1, y1, x2, y2]) => (
          <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={borderColor} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
        ))}

        <path d={describeGaugeArc(-180, 0)} fill="none" stroke="var(--sf-gauge-arc-track)" strokeWidth="12" strokeLinecap="round" />
        <path d={describeGaugeArc(-180, 0)} fill="none" stroke={alertColor} strokeWidth="14" strokeLinecap="round" opacity="0.22" filter={`url(#cyber-gauge-glow-${filterId})`} />
        <path
          d={describeGaugeArc(-180, 0)}
          fill="none"
          stroke={alertColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength - (pct / 100) * arcLength}
          className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />

        {[-180, -135, -90, -45, 0].map((angle) => {
          const outer = polarToCartesian(angle, GAUGE_ARC.radius + 10);
          const inner = polarToCartesian(angle, GAUGE_ARC.radius - 6);
          return <line key={angle} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(226,232,240,0.48)" strokeWidth="1.5" strokeLinecap="round" />;
        })}

        <line x1={GAUGE_ARC.centerX} y1={GAUGE_ARC.centerY} x2={needleEnd.x} y2={needleEnd.y} stroke={alertColor} strokeWidth="4" strokeLinecap="round" filter={`url(#cyber-gauge-glow-${filterId})`} className="transition-all duration-500 motion-reduce:transition-none" />
        <circle cx={GAUGE_ARC.centerX} cy={GAUGE_ARC.centerY} r="7" fill="var(--sf-bg-base)" stroke={alertColor} strokeWidth="3" />

        <text x={GAUGE_ARC.centerX} y="65" textAnchor="middle" fontSize={computeGaugeValueFontSize(formatted)} fontFamily="var(--font-family-data), 'Fira Code', monospace" fontWeight="700" fill="var(--sf-gauge-value-color)">
          {formatted}
        </text>
        <text x={GAUGE_ARC.centerX} y="87" textAnchor="middle" fontSize="12" fontWeight="600" letterSpacing="0.14em" fill="var(--sf-gauge-unit-color)">
          {unit || "RATIO"}
        </text>
        <text x="24" y="145" fontSize="10" fill="var(--sf-gauge-label-color)">
          LCL {lsl}
        </text>
        <text x={GAUGE_VIEWBOX.width - 24} y="145" textAnchor="end" fontSize="10" fill="var(--sf-gauge-label-color)">
          UCL {usl}
        </text>
      </svg>

      <div className="relative mt-2 flex items-center justify-between gap-2 text-[11px] text-[var(--sf-text-muted)]">
        <span className="truncate">{subtitle}</span>
        <span className="font-mono tabular-nums">
          {lsl} - {usl} {unit}
        </span>
      </div>
      {footer && <div className="relative mt-3">{footer}</div>}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {status === "alarm" ? `${title} alarm: ${formatted}${unit ?? ""}` : status === "warning" ? `${title} warning: ${formatted}${unit ?? ""}` : `${title}: ${formatted}${unit ?? ""}`}
      </div>
    </div>
  );
}
