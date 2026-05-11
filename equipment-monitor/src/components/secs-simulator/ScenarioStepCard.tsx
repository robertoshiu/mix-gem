'use client';

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, CheckCircle, Circle } from 'lucide-react';
import type { DemoScenarioStep, DemoSecsMessage, DemoSnapshot } from '@/lib/secs-gem-demo-data';
import { glowPulse, stepCollapse, stepExpand, useReducedMotion } from '@/lib/secs-simulator-animation';
import { cn } from '@/lib/utils';

interface ScenarioStepCardProps {
  step: DemoScenarioStep;
  isActive: boolean;
  isComplete: boolean;
  message?: DemoSecsMessage;
  snapshot?: DemoSnapshot;
  onUserExpand?: () => void;
}

function formatValue(value: unknown): ReactNode {
  if (value === null) return 'null';
  if (value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => (
      <span key={index} className="block">
        {formatValue(item)}
      </span>
    ));
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([key, item]) => (
      <span key={key} className="block">
        <span className="text-[var(--sf-text-secondary)]">{key}:</span> {formatValue(item)}
      </span>
    ));
  }

  return String(value);
}

export function ScenarioStepCard({
  step,
  isActive,
  isComplete,
  message,
  snapshot,
  onUserExpand,
}: ScenarioStepCardProps) {
  const reducedMotion = useReducedMotion();
  const showActiveDetail = isActive;
  const status = isActive ? 'active' : isComplete ? 'complete' : 'pending';
  const DirectionIcon = status === 'active' ? Activity : status === 'complete' ? CheckCircle : Circle;
  const detailVariants = isActive ? stepExpand : stepCollapse;

  const containerClassName = cn(
    'relative overflow-hidden rounded-xl border bg-[var(--sf-surface-panel)] transition-colors',
    status === 'active'
      ? 'border-[var(--sf-accent-cyan)]'
      : status === 'complete'
      ? 'border-[var(--sf-border-default)]'
      : 'border-[var(--sf-border-default)] opacity-65'
  );

  const header = (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        status === 'active' && 'pb-2'
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full border shrink-0',
          status === 'active'
            ? 'border-[var(--sf-accent-cyan)] bg-[color-mix(in_srgb,var(--sf-accent-cyan)_18%,transparent)] text-[var(--sf-accent-cyan)]'
            : status === 'complete'
            ? 'border-[var(--sf-status-green)] bg-[color-mix(in_srgb,var(--sf-status-green)_14%,transparent)] text-[var(--sf-status-green)]'
            : 'border-[var(--sf-border-default)] bg-[var(--sf-surface-panel)] text-[var(--sf-text-muted)]'
        )}
      >
        <DirectionIcon className={cn('h-4 w-4', status === 'active' && !reducedMotion && 'animate-pulse')} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'truncate text-sm font-semibold',
              status === 'active'
                ? 'text-[var(--sf-text-primary)]'
                : status === 'complete'
                ? 'text-[var(--sf-text-primary)]'
                : 'text-[var(--sf-text-muted)]'
            )}
          >
            {step.label}
          </p>
          {status === 'complete' && (
            <span className="rounded-full border border-[var(--sf-status-green)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--sf-status-green)]">
              Complete
            </span>
          )}
        </div>
        {status !== 'pending' && (
          <p className="text-xs text-[var(--sf-text-secondary)]">
            {step.actor} · {step.primary} → {step.expected}
          </p>
        )}
      </div>

    </div>
  );

  const detailPanel = showActiveDetail ? (
    reducedMotion ? (
      <div className="px-4 pb-4 pt-1">
        <div className="rounded-lg border border-[var(--sf-border-default)] bg-[color-mix(in_srgb,var(--sf-surface-panel)_88%,black)] p-4">
          {message && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[var(--sf-text-secondary)]">
                <span
                  className={cn(
                    'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 font-semibold text-white',
                    message.direction === 'H2E'
                      ? 'bg-[var(--sf-accent-blue)]'
                      : 'bg-[var(--sf-accent-teal)]'
                  )}
                  aria-label={message.direction}
                  title={message.direction}
                >
                  {message.direction === 'H2E' ? '→' : '←'}
                </span>
                <span>{message.direction === 'H2E' ? 'Host to Equipment' : 'Equipment to Host'}</span>
                <span>·</span>
                <span>{message.sf}</span>
              </div>

              <dl className="grid gap-2 sm:grid-cols-2">
                {Object.entries(message.payload).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-[var(--sf-border-default)] p-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--sf-text-muted)]">{key}</dt>
                    <dd className="mt-1 text-sm text-[var(--sf-text-primary)]">{formatValue(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {snapshot && (
            <div className={cn('mt-4', message ? 'border-t border-[var(--sf-border-default)] pt-4' : '')}>
              <div className="flex items-center justify-between gap-3 text-xs text-[var(--sf-text-secondary)]">
                <span>Snapshot {snapshot.sequence}</span>
                <span>{snapshot.label}</span>
              </div>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {snapshot.stateVariables.map((entry) => (
                  <div key={entry.name} className="rounded-md border border-[var(--sf-border-default)] p-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--sf-text-muted)]">{entry.name}</dt>
                    <dd className="mt-1 text-sm text-[var(--sf-text-primary)]">{entry.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-sm text-[var(--sf-text-secondary)]">
                Expected: <span className="font-semibold text-[var(--sf-text-primary)]">{step.expected}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    ) : (
      <AnimatePresence mode="wait">
        <motion.div
          key="active-detail"
          className="px-4 pb-4 pt-1"
          variants={detailVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="rounded-lg border border-[var(--sf-border-default)] bg-[color-mix(in_srgb,var(--sf-surface-panel)_88%,black)] p-4">
            {message && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-[var(--sf-text-secondary)]">
                  <span
                    className={cn(
                      'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 font-semibold text-white',
                      message.direction === 'H2E'
                        ? 'bg-[var(--sf-accent-blue)]'
                        : 'bg-[var(--sf-accent-teal)]'
                    )}
                    aria-label={message.direction}
                    title={message.direction}
                  >
                    {message.direction === 'H2E' ? '→' : '←'}
                  </span>
                  <span>{message.direction === 'H2E' ? 'Host to Equipment' : 'Equipment to Host'}</span>
                  <span>·</span>
                  <span>{message.sf}</span>
                </div>

                <dl className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(message.payload).map(([key, value]) => (
                    <div key={key} className="rounded-md border border-[var(--sf-border-default)] p-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--sf-text-muted)]">{key}</dt>
                      <dd className="mt-1 text-sm text-[var(--sf-text-primary)]">{formatValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {snapshot && (
              <div className={cn('mt-4', message ? 'border-t border-[var(--sf-border-default)] pt-4' : '')}>
                <div className="flex items-center justify-between gap-3 text-xs text-[var(--sf-text-secondary)]">
                  <span>Snapshot {snapshot.sequence}</span>
                  <span>{snapshot.label}</span>
                </div>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {snapshot.stateVariables.map((entry) => (
                    <div key={entry.name} className="rounded-md border border-[var(--sf-border-default)] p-3">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--sf-text-muted)]">{entry.name}</dt>
                      <dd className="mt-1 text-sm text-[var(--sf-text-primary)]">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm text-[var(--sf-text-secondary)]">
                  Expected: <span className="font-semibold text-[var(--sf-text-primary)]">{step.expected}</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    )
  ) : null;

  const topGlow = isActive ? (
    reducedMotion ? (
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--sf-accent-cyan)]" />
    ) : (
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-[var(--sf-accent-cyan)]"
        variants={glowPulse}
        initial="initial"
        animate="animate"
      />
    )
  ) : null;

  return (
    <div
      className={containerClassName}
      style={
        status === 'active'
          ? { boxShadow: '0 0 0 1px var(--sf-accent-cyan), 0 0 24px color-mix(in srgb, var(--sf-accent-cyan) 25%, transparent)' }
          : undefined
      }
    >
      {topGlow}
      {status === 'complete' ? (
        <button
          type="button"
          onClick={onUserExpand}
          aria-expanded={showActiveDetail}
          className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent-cyan)]"
        >
          {header}
        </button>
      ) : (
        header
      )}
      {detailPanel}
    </div>
  );
}
