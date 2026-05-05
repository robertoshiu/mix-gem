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

const GAUGE_WIDTH = 140;
const GAUGE_HEIGHT = 80;
const GAUGE_RADIUS = 56;
const GAUGE_CENTER_X = GAUGE_WIDTH / 2;
const GAUGE_CENTER_Y = GAUGE_HEIGHT - 4;

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
 * Angles: -180° (left) to 0° (top center).
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

/** Dynamic font size based on value string length */
function getValueFontSize(valueStr: string): string {
  if (valueStr.length <= 4) return 'text-xl';
  if (valueStr.length <= 6) return 'text-base';
  return 'text-sm';
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
      <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2" {...containerAnimProps}>
        {SPC_PARAM_KEYS.map((param) => (
          <motion.div key={param} {...itemAnimProps}>
            <div
              data-testid={`kpi-gauge-${param}`}
              className="h-40 bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)] animate-pulse"
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
    <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2" {...containerAnimProps}>
      {SPC_PARAM_KEYS.map((param) => {
        const config = SPC_PARAMETERS[param];
        const value = latest[param as keyof SpcMeasurement] as number;
        const isOk = value >= config.lcl && value <= config.ucl;

        const pct = calculateZonePercentage(value, config);
        // Needle angle: -180° (left/0%) → -90° (top/50%) → 0° (right/100%)
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

        return (
          <motion.div key={param} {...itemAnimProps}>
          <div
            data-testid={`kpi-gauge-${param}`}
            role="button"
            tabIndex={0}
            aria-label={`Select ${config.label} parameter`}
            onClick={() => onParamSelect(param)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onParamSelect(param); } }}
            className={cn(
              'flex flex-col bg-[var(--smartfactory-surface-card)] rounded border p-3 cursor-pointer transition-all duration-200',
              isActive
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

            {/* Semicircular Speedometer Gauge */}
            <div className="relative flex items-center justify-center w-[140px] h-[80px] mx-auto my-1">
              <svg viewBox={`0 0 ${GAUGE_WIDTH} ${GAUGE_HEIGHT}`} className="w-full h-full">
                {/* Green zone: 0-60% → angles -180° to -108° */}
                <path
                  d={describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_RADIUS, -180, -108)}
                  fill="none"
                  stroke="var(--smartfactory-status-green)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="opacity-80"
                />
                {/* Yellow zone: 60-80% → angles -108° to -72° */}
                <path
                  d={describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_RADIUS, -108, -72)}
                  fill="none"
                  stroke="var(--smartfactory-status-amber)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="opacity-80"
                />
                {/* Red zone: 80-100% → angles -72° to 0° */}
                <path
                  d={describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_RADIUS, -72, 0)}
                  fill="none"
                  stroke="var(--smartfactory-status-red)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="opacity-80"
                />

                {/* Tick marks at zone boundaries */}
                <line
                  x1={GAUGE_CENTER_X + (GAUGE_RADIUS - 8) * Math.cos((-180 * Math.PI) / 180)}
                  y1={GAUGE_CENTER_Y + (GAUGE_RADIUS - 8) * Math.sin((-180 * Math.PI) / 180)}
                  x2={GAUGE_CENTER_X + (GAUGE_RADIUS + 2) * Math.cos((-180 * Math.PI) / 180)}
                  y2={GAUGE_CENTER_Y + (GAUGE_RADIUS + 2) * Math.sin((-180 * Math.PI) / 180)}
                  stroke="var(--smartfactory-text-muted)"
                  strokeWidth="1"
                />
                <line
                  x1={GAUGE_CENTER_X + (GAUGE_RADIUS - 8) * Math.cos((-90 * Math.PI) / 180)}
                  y1={GAUGE_CENTER_Y + (GAUGE_RADIUS - 8) * Math.sin((-90 * Math.PI) / 180)}
                  x2={GAUGE_CENTER_X + (GAUGE_RADIUS + 2) * Math.cos((-90 * Math.PI) / 180)}
                  y2={GAUGE_CENTER_Y + (GAUGE_RADIUS + 2) * Math.sin((-90 * Math.PI) / 180)}
                  stroke="var(--smartfactory-text-muted)"
                  strokeWidth="1"
                />
                <line
                  x1={GAUGE_CENTER_X + (GAUGE_RADIUS - 8) * Math.cos((0 * Math.PI) / 180)}
                  y1={GAUGE_CENTER_Y + (GAUGE_RADIUS - 8) * Math.sin((0 * Math.PI) / 180)}
                  x2={GAUGE_CENTER_X + (GAUGE_RADIUS + 2) * Math.cos((0 * Math.PI) / 180)}
                  y2={GAUGE_CENTER_Y + (GAUGE_RADIUS + 2) * Math.sin((0 * Math.PI) / 180)}
                  stroke="var(--smartfactory-text-muted)"
                  strokeWidth="1"
                />

                {/* Needle */}
                <g transform={`rotate(${needleAngle}, ${GAUGE_CENTER_X}, ${GAUGE_CENTER_Y})`}>
                  <line
                    x1={GAUGE_CENTER_X}
                    y1={GAUGE_CENTER_Y}
                    x2={GAUGE_CENTER_X}
                    y2={GAUGE_CENTER_Y - GAUGE_RADIUS + 4}
                    stroke={isOk ? 'var(--smartfactory-status-green)' : 'var(--smartfactory-status-red)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="transition-transform duration-500 ease-in-out"
                  />
                  {/* Needle pivot circle */}
                  <circle
                    cx={GAUGE_CENTER_X}
                    cy={GAUGE_CENTER_Y}
                    r="3"
                    fill={isOk ? 'var(--smartfactory-status-green)' : 'var(--smartfactory-status-red)'}
                  />
                </g>
              </svg>
            </div>

            {/* Value Display */}
            <div className="flex flex-col items-center justify-center -mt-2 mb-2">
              <span className={cn(
                'font-["Fira_Code",monospace] font-semibold text-[var(--smartfactory-text-primary)] leading-none',
                getValueFontSize(valueStr)
              )}>
                {valueStr}
              </span>
              <span className="text-[10px] text-[var(--smartfactory-text-secondary)] leading-none mt-0.5">
                {config.unit}
              </span>
            </div>

            {/* Sparkline and Trend */}
            <div className="flex flex-col flex-1 min-w-0">
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
