'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from '@/lib/spc-parameters';
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

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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
        
        // Progress: how close value is to target in %
        let progress = 100 - Math.abs(((value - config.target) / (3 * config.sigma)) * 100);
        progress = Math.max(0, Math.min(100, progress));
        const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

        let deltaValue = 0;
        let prevValue: number | undefined;
        if (history.length > 1) {
          prevValue = history[history.length - 2][param as keyof SpcMeasurement] as number;
          deltaValue = value - prevValue;
        }

        const isActive = activeParam === param;
        
        // Is this the param causing the current violation?
        const isViolating = hasViolation && violatedParam === param;
        // The prompt says "Green line when OK, red when OOC"
        const chartColor = isOk ? 'var(--smartfactory-status-green)' : 'var(--smartfactory-status-red)';
        const progressColor = isOk ? 'var(--smartfactory-status-green)' : 'var(--smartfactory-status-red)';

        return (
          <motion.div key={param} {...itemAnimProps}>
          <div
            data-testid={`kpi-gauge-${param}`}
            onClick={() => onParamSelect(param)}
            className={cn(
              'flex flex-col bg-[var(--smartfactory-surface-card)] rounded border p-3 cursor-pointer transition-all duration-200',
              isActive
                ? 'border-l-2 border-l-[var(--smartfactory-border-active)] border-[var(--smartfactory-border-active)] shadow-md bg-[var(--smartfactory-surface-elevated)]'
                : 'border-[var(--smartfactory-border-default)] hover:bg-[var(--smartfactory-surface-elevated)] hover:shadow-sm'
            )}
          >
            {/* Top Row: Label and Status */}
            <div className="flex justify-between items-start mb-2">
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

            {/* Middle: Gauge + Trend */}
            <div className="flex items-center justify-between my-2">
              <div className="relative flex items-center justify-center w-[64px] h-[64px]">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Track */}
                  <circle
                    cx="32"
                    cy="32"
                    r={RADIUS}
                    fill="none"
                    stroke="var(--smartfactory-text-muted)"
                    strokeWidth="4"
                    className="opacity-20"
                  />
                  {/* Progress Arc */}
                  <circle
                    cx="32"
                    cy="32"
                    r={RADIUS}
                    fill="none"
                    stroke={progressColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 ease-in-out"
                  />
                </svg>
                {/* Center Value */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-['Fira_Code',monospace] font-semibold text-[1.25rem] text-[var(--smartfactory-text-primary)] leading-none">
                    {value.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-[var(--smartfactory-text-secondary)] leading-none mt-1">
                    {config.unit}
                  </span>
                </div>
              </div>

              {/* Sparkline and Trend */}
              <div className="flex flex-col flex-1 ml-3 min-w-0">
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
