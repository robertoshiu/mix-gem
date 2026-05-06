'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { SPC_PARAMETERS, SPC_PARAM_KEYS, type SpcParamConfig } from '@/lib/spc-parameters';
import type { SpcMeasurement, SpcParameter } from '@/lib/mes-types';
import { cn } from '@/lib/utils';
import { fadeInUp, staggerContainer, useReducedMotion } from '@/lib/animation';

interface KpiGaugeCardProps {
  latest: SpcMeasurement | null;
  history?: SpcMeasurement[];
  activeParam: SpcParameter;
  onParamSelect: (param: SpcParameter) => void;
  hasViolation: boolean;
  violatedParam?: SpcParameter;
}

const GAUGE_WIDTH = 210;
const GAUGE_HEIGHT = 135;
const GAUGE_RADIUS = 80;
const GAUGE_CENTER_X = GAUGE_WIDTH / 2;
const GAUGE_CENTER_Y = GAUGE_HEIGHT - 30;

/** Available width in SVG coords for the centered value text */
const VALUE_TEXT_WIDTH = 160;
/** Available width in SVG coords for min/max label text */
const LABEL_TEXT_WIDTH = 72;

/**
 * Calculate the percentage position on the gauge (0% = at target, 100% = at/beyond limits).
 */
function calculateZonePercentage(value: number, config: SpcParamConfig): number {
  const deviation = Math.abs(value - config.target);
  const limitDistance = Math.max(config.ucl - config.target, config.target - config.lcl, 0.001);
  const pct = (deviation / limitDistance) * 100;
  return Math.max(0, Math.min(100, pct));
}

/**
 * Get the SVG arc path for a given angle range on a semicircle.
 * Angles: -180deg (left) to 0deg (top center).
 */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = {
    x: cx + r * Math.cos((startAngle * Math.PI) / 180),
    y: cy + r * Math.sin((startAngle * Math.PI) / 180),
  };
  const end = {
    x: cx + r * Math.cos((endAngle * Math.PI) / 180),
    y: cy + r * Math.sin((endAngle * Math.PI) / 180),
  };
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

/**
 * Continuous font-size scaling using CSS clamp() for overflow-proof display.
 * Formula: fontSize = clamp(0.75rem, availableWidth / (charCount * 0.6), 2.5rem)
 * Returns a CSS clamp() expression string usable in SVG fontSize attribute.
 */
function computeValueFontSize(charCount: number, availableWidth: number): number {
  const measured = availableWidth / Math.max(charCount * 0.58, 1);
  return Math.max(16, Math.min(32, measured));
}

export function KpiGaugeCard({
  latest,
  history = [],
  activeParam,
  onParamSelect,
  hasViolation,
  violatedParam,
}: KpiGaugeCardProps) {
  const reduced = useReducedMotion();
  const containerAnimProps = reduced ? {} : { variants: staggerContainer, initial: 'initial' as const, animate: 'animate' as const };
  const itemAnimProps = reduced ? {} : { variants: fadeInUp };

  if (!latest) {
    return (
      <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5" {...containerAnimProps}>
        {SPC_PARAM_KEYS.map((param) => (
          <motion.div key={param} {...itemAnimProps}>
            <div
              data-testid={`kpi-gauge-${param}`}
              className="min-h-44 rounded-xl border border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-surface-card)] animate-pulse motion-reduce:animate-none"
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Use history if provided, otherwise create a fake history just with the latest
  const chartData = history.length > 0 ? history : [latest];
  // Recharts expects array of objects
  const last10 = chartData.slice(-10);

  return (
    <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5" {...containerAnimProps}>
      {SPC_PARAM_KEYS.map((param) => {
        const config = SPC_PARAMETERS[param];
        const value = latest[param as keyof SpcMeasurement] as number;
        const isOk = value >= config.lcl && value <= config.ucl;

        const pct = calculateZonePercentage(value, config);
        // Needle angle: -180deg (left/0%) -> -90deg (top/50%) -> 0deg (right/100%)
        const needleAngle = -180 + (pct / 100) * 180;

        let deltaValue = 0;
        let prevValue: number | undefined;
        if (history.length > 1) {
          prevValue = history[history.length - 2][param as keyof SpcMeasurement] as number;
          deltaValue = value - prevValue;
        }

        const isActive = activeParam === param;
        const isViolating = hasViolation && violatedParam === param;
        const chartColor = isOk ? 'var(--smartfactory-status-green)' : 'var(--smartfactory-status-red)';

        const valueStr = value.toFixed(1);
        const valueFontSize = computeValueFontSize(valueStr.length, VALUE_TEXT_WIDTH);

        return (
          <motion.div key={param} {...itemAnimProps}>
          <div
            data-testid={`kpi-gauge-${param}`}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            aria-label={`Select ${config.label} parameter`}
            onClick={() => onParamSelect(param)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onParamSelect(param); } }}
            className={cn(
              'flex min-w-0 flex-col rounded-xl border bg-[var(--smartfactory-surface-card)] p-3 cursor-pointer shadow-[0_14px_34px_rgba(0,0,0,0.22)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--smartfactory-border-active)] motion-reduce:transition-none',
              isViolating
                ? 'border-l-2 border-l-[var(--smartfactory-status-red)] border-[var(--smartfactory-status-red)] shadow-md bg-[var(--smartfactory-surface-elevated)]'
                : isActive
                ? 'border-l-2 border-l-[var(--smartfactory-border-active)] border-[var(--smartfactory-border-active)] shadow-md bg-[var(--smartfactory-surface-elevated)]'
                : 'border-[var(--smartfactory-border-default)] hover:bg-[var(--smartfactory-surface-elevated)] hover:shadow-sm'
            )}
          >
            {/* Top Row: Label and Status */}
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs text-[var(--smartfactory-text-secondary)] font-medium truncate">
                {config.label}
              </span>
              <span
                className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded-sm',
                  isOk
                    ? 'text-[var(--smartfactory-status-green)] bg-[var(--smartfactory-status-green)]/10'
                    : 'text-[var(--smartfactory-status-red)] bg-[var(--smartfactory-status-red)]/10'
                )}
              >
                {isOk ? 'OK' : 'OOC'}
              </span>
            </div>

            {/* Enlarged Semicircular Speedometer Gauge with integrated text */}
            <div className="relative mx-auto my-2 flex aspect-[210/135] w-full max-w-[240px] items-center justify-center px-1">
              <svg
                viewBox={`0 0 ${GAUGE_WIDTH} ${GAUGE_HEIGHT}`}
                className="h-full w-full overflow-visible"
                overflow="visible"
              >
                {/* Green zone: 0-60% -> angles -180deg to -108deg */}
                <path
                  d={describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_RADIUS, -180, -108)}
                  fill="none"
                  stroke="var(--smartfactory-status-green)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="opacity-80"
                />
                {/* Yellow zone: 60-80% -> angles -108deg to -72deg */}
                <path
                  d={describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_RADIUS, -108, -72)}
                  fill="none"
                  stroke="var(--smartfactory-status-amber)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="opacity-80"
                />
                {/* Red zone: 80-100% -> angles -72deg to 0deg */}
                <path
                  d={describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_RADIUS, -72, 0)}
                  fill="none"
                  stroke="var(--smartfactory-status-red)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="opacity-80"
                />

                {/* Tick marks at zone boundaries */}
                <line
                  x1={GAUGE_CENTER_X + (GAUGE_RADIUS - 8) * Math.cos((-180 * Math.PI) / 180)}
                  y1={GAUGE_CENTER_Y + (GAUGE_RADIUS - 8) * Math.sin((-180 * Math.PI) / 180)}
                  x2={GAUGE_CENTER_X + (GAUGE_RADIUS + 3) * Math.cos((-180 * Math.PI) / 180)}
                  y2={GAUGE_CENTER_Y + (GAUGE_RADIUS + 3) * Math.sin((-180 * Math.PI) / 180)}
                  stroke="var(--kpi-arc-color)"
                  strokeWidth="1.5"
                />
                <line
                  x1={GAUGE_CENTER_X + (GAUGE_RADIUS - 8) * Math.cos((-90 * Math.PI) / 180)}
                  y1={GAUGE_CENTER_Y + (GAUGE_RADIUS - 8) * Math.sin((-90 * Math.PI) / 180)}
                  x2={GAUGE_CENTER_X + (GAUGE_RADIUS + 3) * Math.cos((-90 * Math.PI) / 180)}
                  y2={GAUGE_CENTER_Y + (GAUGE_RADIUS + 3) * Math.sin((-90 * Math.PI) / 180)}
                  stroke="var(--kpi-arc-color)"
                  strokeWidth="1.5"
                />
                <line
                  x1={GAUGE_CENTER_X + (GAUGE_RADIUS - 8) * Math.cos((0 * Math.PI) / 180)}
                  y1={GAUGE_CENTER_Y + (GAUGE_RADIUS - 8) * Math.sin((0 * Math.PI) / 180)}
                  x2={GAUGE_CENTER_X + (GAUGE_RADIUS + 3) * Math.cos((0 * Math.PI) / 180)}
                  y2={GAUGE_CENTER_Y + (GAUGE_RADIUS + 3) * Math.sin((0 * Math.PI) / 180)}
                  stroke="var(--kpi-arc-color)"
                  strokeWidth="1.5"
                />

                {/* Needle */}
                <g transform={`rotate(${needleAngle}, ${GAUGE_CENTER_X}, ${GAUGE_CENTER_Y})`}>
                  <line
                    x1={GAUGE_CENTER_X}
                    y1={GAUGE_CENTER_Y}
                    x2={GAUGE_CENTER_X}
                    y2={GAUGE_CENTER_Y - GAUGE_RADIUS + 6}
                    stroke={isOk ? 'var(--smartfactory-status-green)' : 'var(--smartfactory-status-red)'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-transform duration-500 ease-in-out motion-reduce:transition-none"
                  />
                  {/* Needle pivot circle */}
                  <circle
                    cx={GAUGE_CENTER_X}
                    cy={GAUGE_CENTER_Y}
                    r="4"
                    fill={isOk ? 'var(--smartfactory-status-green)' : 'var(--smartfactory-status-red)'}
                  />
                </g>

                {/* Value text — centered, with textLength for overflow-proof display */}
                <text
                  x={GAUGE_CENTER_X}
                  y={GAUGE_CENTER_Y - GAUGE_RADIUS - 12}
                  textAnchor="middle"
                  textLength={VALUE_TEXT_WIDTH}
                  lengthAdjust="spacingAndGlyphs"
                  fontSize={valueFontSize}
                  fontWeight="600"
                  fontFamily="'Fira Code', monospace"
                  fill="var(--kpi-value-color)"
                >
                  {valueStr}
                </text>

                {/* Unit text */}
                <text
                  x={GAUGE_CENTER_X}
                  y={GAUGE_CENTER_Y - GAUGE_RADIUS + 2}
                  textAnchor="middle"
                  textLength={100}
                  lengthAdjust="spacingAndGlyphs"
                  fontSize={10}
                  fill="var(--smartfactory-text-secondary)"
                >
                  {config.unit}
                </text>

                {/* Min label (LCL) — left side */}
                <text
                  x={12}
                  y={GAUGE_CENTER_Y + GAUGE_RADIUS - 50}
                  textLength={LABEL_TEXT_WIDTH}
                  lengthAdjust="spacingAndGlyphs"
                  fontSize={9}
                  fill="var(--smartfactory-text-muted)"
                >
                  {config.lcl.toFixed(1)}
                </text>

                {/* Max label (UCL) — right side */}
                <text
                  x={GAUGE_WIDTH - 12}
                  y={GAUGE_CENTER_Y + GAUGE_RADIUS - 50}
                  textAnchor="end"
                  textLength={LABEL_TEXT_WIDTH}
                  lengthAdjust="spacingAndGlyphs"
                  fontSize={9}
                  fill="var(--smartfactory-text-muted)"
                >
                  {config.ucl.toFixed(1)}
                </text>
              </svg>
            </div>

            {/* Sparkline and Trend */}
            <div className="flex flex-col flex-1 min-w-0 -mt-2">
              <div className="h-[24px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={last10}>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Line
                      type="monotone"
                      dataKey={param}
                      stroke={chartColor}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {prevValue !== undefined && (
                <div
                  className={cn(
                    'flex items-center justify-end mt-1 text-[10px] font-medium',
                    deltaValue > 0
                      ? 'text-[var(--smartfactory-status-green)]'
                      : deltaValue < 0
                      ? 'text-[var(--smartfactory-status-red)]'
                      : 'text-[var(--smartfactory-text-secondary)]'
                  )}
                >
                  {deltaValue > 0 ? (
                    <ArrowUp className="w-3 h-3 mr-0.5" />
                  ) : deltaValue < 0 ? (
                    <ArrowDown className="w-3 h-3 mr-0.5" />
                  ) : null}
                  {deltaValue > 0 ? '+' : ''}{deltaValue.toFixed(2)}
                </div>
              )}
            </div>

            {/* Footer: Sub-metrics */}
            <div className="grid grid-cols-3 gap-1 mt-auto pt-2 border-t border-[var(--smartfactory-border-default)]">
              <div className="flex flex-col border-r border-[var(--smartfactory-border-default)]">
                <span className="text-[10px] text-[var(--smartfactory-text-secondary)]">Value</span>
                <span className="text-xs font-['Fira_Code',monospace] text-[var(--smartfactory-text-primary)]">
                  {value.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col border-r border-[var(--smartfactory-border-default)] pl-1">
                <span className="text-[10px] text-[var(--smartfactory-text-secondary)]">Target</span>
                <span className="text-xs font-['Fira_Code',monospace] text-[var(--smartfactory-text-primary)]">
                  {config.target.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col pl-1">
                <span className="text-[10px] text-[var(--smartfactory-text-secondary)]">Sigma</span>
                <span className="text-xs font-['Fira_Code',monospace] text-[var(--smartfactory-text-primary)]">
                  {config.sigma.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
