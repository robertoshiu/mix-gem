'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { SPC_PARAMETERS, SPC_PARAM_KEYS } from '@/lib/spc-parameters';
import type { SpcMeasurement, SpcParameter } from '@/lib/mes-types';
import { cn } from '@/lib/utils';
import { fadeInUp, staggerContainer, useReducedMotion } from '@/lib/animation';
import { CyberpunkGaugeCard } from '@/components/charts/cyberpunk-gauge-card';

interface KpiGaugeCardProps {
  latest: SpcMeasurement | null;
  history?: SpcMeasurement[];
  activeParam: SpcParameter;
  onParamSelect: (param: SpcParameter) => void;
  hasViolation: boolean;
  violatedParam?: SpcParameter;
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
          <CyberpunkGaugeCard
            title={config.label}
            value={value}
            unit={config.unit}
            lsl={config.lcl}
            usl={config.ucl}
            status={isOk ? 'normal' : 'alarm'}
            active={isActive}
            interactive
            testId={`kpi-gauge-${param}`}
            ariaLabel={`${config.label}, ${valueStr} ${config.unit}, ${isOk ? 'OK' : 'OOC'}, target ${config.target.toFixed(1)}, ${isActive ? 'selected' : ''}`}
            ariaDescribedBy={`gauge-detail-${param}`}
            onClick={() => onParamSelect(param)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onParamSelect(param); } }}
            valueFormatter={(nextValue) => nextValue.toFixed(1)}
            className={cn(
              'flex min-h-44 flex-col',
              isViolating
                ? 'border-[var(--smartfactory-status-red)]'
                : isActive
                ? 'border-[var(--smartfactory-border-active)]'
                : 'border-[var(--smartfactory-border-default)]'
            )}
            footer={(
              <>
                <span id={`gauge-detail-${param}`} className="sr-only">
                  {config.label}: {valueStr} {config.unit}, target {config.target.toFixed(1)}, LCL {config.lcl.toFixed(1)} UCL {config.ucl.toFixed(1)}, {isOk ? 'OK' : 'OOC'}
                </span>
                <div className="flex flex-col flex-1 min-w-0">
              <div className="h-[24px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 1, height: 24 }}>
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
              </>
            )}
          />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
