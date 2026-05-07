'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { SPC_PARAMETERS, SPC_PARAM_KEYS, type SpcParamConfig } from '@/lib/spc-parameters';
import type { SpcMeasurement, SpcParameter } from '@/lib/mes-types';
import { cn } from '@/lib/utils';
import { fadeInUp, staggerContainer, useReducedMotion } from '@/lib/animation';
import { GAUGE_VIEWBOX, GAUGE_ARC, GAUGE_TEXT, describeGaugeArc, computeGaugeValueFontSize } from '@/lib/gauge-geometry';

interface KpiGaugeCardProps {
  latest: SpcMeasurement | null;
  history?: SpcMeasurement[];
  activeParam: SpcParameter;
  onParamSelect: (param: SpcParameter) => void;
  hasViolation: boolean;
  violatedParam?: SpcParameter;
}

/**
 * Calculate the percentage position on the gauge (0% = at target, 100% = at/beyond limits).
 */
function calculateZonePercentage(value: number, config: SpcParamConfig): number {
  const deviation = Math.abs(value - config.target);
  const limitDistance = Math.max(config.ucl - config.target, config.target - config.lcl, 0.001);
  const pct = (deviation / limitDistance) * 100;
  return Math.max(0, Math.min(100, pct));
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
        const valueFontSize = computeGaugeValueFontSize(valueStr, GAUGE_TEXT.valueWidth);

        return (
          <motion.div key={param} {...itemAnimProps}>
          <div
            data-testid={`kpi-gauge-${param}`}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            aria-label={`${config.label}, ${valueStr} ${config.unit}, ${isOk ? 'OK' : 'OOC'}, target ${config.target.toFixed(1)}, ${isActive ? 'selected' : ''}`}
            aria-describedby={`gauge-detail-${param}`}
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
            {/* Screen-reader detail */}
            <span id={`gauge-detail-${param}`} className="sr-only">
              {config.label}: {valueStr} {config.unit}, target {config.target.toFixed(1)}, LCL {config.lcl.toFixed(1)} UCL {config.ucl.toFixed(1)}, {isOk ? 'OK' : 'OOC'}
            </span>

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
            <div className="relative mx-auto my-2 flex aspect-[240/160] w-full max-w-[240px] items-center justify-center px-1">
              <svg
                viewBox={`0 0 ${GAUGE_VIEWBOX.width} ${GAUGE_VIEWBOX.height}`}
                className="h-full w-full overflow-visible"
                overflow="visible"
              >
                {/* Green zone: 0-60% -> angles -180deg to -108deg */}
                <path
                  d={describeGaugeArc(-180, -108)}
                  fill="none"
                  stroke="var(--sf-gauge-zone-green)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="opacity-80"
                />
                {/* Yellow zone: 60-80% -> angles -108deg to -72deg */}
                <path
                  d={describeGaugeArc(-108, -72)}
                  fill="none"
                  stroke="var(--sf-gauge-zone-amber)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="opacity-80"
                />
                {/* Red zone: 80-100% -> angles -72deg to 0deg */}
                <path
                  d={describeGaugeArc(-72, 0)}
                  fill="none"
                  stroke="var(--sf-gauge-zone-red)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="opacity-80"
                />

                {/* Tick marks at zone boundaries */}
                <line
                  x1={GAUGE_ARC.centerX + (GAUGE_ARC.radius - 8) * Math.cos((-180 * Math.PI) / 180)}
                  y1={GAUGE_ARC.centerY + (GAUGE_ARC.radius - 8) * Math.sin((-180 * Math.PI) / 180)}
                  x2={GAUGE_ARC.centerX + (GAUGE_ARC.radius + 3) * Math.cos((-180 * Math.PI) / 180)}
                  y2={GAUGE_ARC.centerY + (GAUGE_ARC.radius + 3) * Math.sin((-180 * Math.PI) / 180)}
                  stroke="var(--sf-gauge-arc-track)"
                  strokeWidth="1.5"
                />
                <line
                  x1={GAUGE_ARC.centerX + (GAUGE_ARC.radius - 8) * Math.cos((-90 * Math.PI) / 180)}
                  y1={GAUGE_ARC.centerY + (GAUGE_ARC.radius - 8) * Math.sin((-90 * Math.PI) / 180)}
                  x2={GAUGE_ARC.centerX + (GAUGE_ARC.radius + 3) * Math.cos((-90 * Math.PI) / 180)}
                  y2={GAUGE_ARC.centerY + (GAUGE_ARC.radius + 3) * Math.sin((-90 * Math.PI) / 180)}
                  stroke="var(--sf-gauge-arc-track)"
                  strokeWidth="1.5"
                />
                <line
                  x1={GAUGE_ARC.centerX + (GAUGE_ARC.radius - 8) * Math.cos((0 * Math.PI) / 180)}
                  y1={GAUGE_ARC.centerY + (GAUGE_ARC.radius - 8) * Math.sin((0 * Math.PI) / 180)}
                  x2={GAUGE_ARC.centerX + (GAUGE_ARC.radius + 3) * Math.cos((0 * Math.PI) / 180)}
                  y2={GAUGE_ARC.centerY + (GAUGE_ARC.radius + 3) * Math.sin((0 * Math.PI) / 180)}
                  stroke="var(--sf-gauge-arc-track)"
                  strokeWidth="1.5"
                />

                {/* Needle */}
                <g transform={`rotate(${needleAngle}, ${GAUGE_ARC.centerX}, ${GAUGE_ARC.centerY})`}>
                  <line
                    x1={GAUGE_ARC.centerX}
                    y1={GAUGE_ARC.centerY}
                    x2={GAUGE_ARC.centerX}
                    y2={GAUGE_ARC.centerY - GAUGE_ARC.radius + 6}
                    stroke={isOk ? 'var(--sf-gauge-zone-green)' : 'var(--sf-gauge-zone-red)'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-transform duration-500 ease-in-out motion-reduce:transition-none"
                  />
                  {/* Needle pivot circle */}
                  <circle
                    cx={GAUGE_ARC.centerX}
                    cy={GAUGE_ARC.centerY}
                    r="4"
                    fill={isOk ? 'var(--sf-gauge-zone-green)' : 'var(--sf-gauge-zone-red)'}
                  />
                </g>

                {/* Value text — centered with bounded font sizing; avoid glyph scaling distortion. */}
                <text
                  x={GAUGE_ARC.centerX}
                  y={GAUGE_ARC.centerY - GAUGE_ARC.radius - 12}
                  textAnchor="middle"
                  fontSize={valueFontSize}
                  fontWeight="600"
                  fontFamily="'Fira Code', monospace"
                  fill="var(--sf-gauge-value-color)"
                >
                  {valueStr}
                </text>

                {/* Unit text */}
                <text
                  x={GAUGE_ARC.centerX}
                  y={GAUGE_ARC.centerY - GAUGE_ARC.radius + 2}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--sf-gauge-unit-color)"
                >
                  {config.unit}
                </text>

                {/* Min label (LCL) — left side */}
                <text
                  x={12}
                  y={GAUGE_ARC.centerY + GAUGE_ARC.radius - 50}
                  fontSize={9}
                  fill="var(--sf-gauge-label-color)"
                >
                  {config.lcl.toFixed(1)}
                </text>

                {/* Max label (UCL) — right side */}
                <text
                  x={GAUGE_VIEWBOX.width - 12}
                  y={GAUGE_ARC.centerY + GAUGE_ARC.radius - 50}
                  textAnchor="end"
                  fontSize={9}
                  fill="var(--sf-gauge-label-color)"
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
