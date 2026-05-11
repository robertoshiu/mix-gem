'use client';

import { AnimatePresence, motion, type TargetAndTransition } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { payloadCollapse, payloadExpand, useReducedMotion } from '@/lib/secs-simulator-animation';
import { cn } from '@/lib/utils';

type PayloadViewerProps = {
  payload: Record<string, unknown>;
  defaultExpanded?: boolean;
  maxLines?: number;
};

const LINE_HEIGHT_PX = 20;

function formatValue(value: unknown): ReactNode {
  if (value === null) {
    return <span className="font-mono text-[var(--sf-text-muted)]">null</span>;
  }

  if (value === undefined) {
    return <span className="font-mono text-[var(--sf-text-muted)]">undefined</span>;
  }

  if (typeof value === 'string') {
    return <span className="font-mono text-[var(--sf-text-primary)]">{value}</span>;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return <span className="font-mono text-[var(--sf-text-primary)]">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="font-mono text-[var(--sf-text-muted)]">[]</span>;
    }

    return (
      <span className="flex flex-col gap-1">
        {value.map((item, index) => (
          <span key={`${index}`} className="font-mono text-[var(--sf-text-primary)]">
            {index + 1}. {formatValue(item)}
          </span>
        ))}
      </span>
    );
  }

  if (typeof value === 'function') {
    return <span className="font-bold font-mono text-[var(--sf-text-primary)]">[Function]</span>;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return <span className="font-mono text-[var(--sf-text-muted)]">{`{}`}</span>;
    }

    return (
      <span className="flex flex-col gap-1">
        {entries.map(([nestedKey, nestedValue]) => (
          <span key={nestedKey} className="flex flex-wrap gap-x-1">
            <span className="font-mono text-[var(--sf-text-secondary)]">{nestedKey}</span>
            <span className="font-mono text-[var(--sf-text-secondary)]">:</span>
            <span>{formatValue(nestedValue)}</span>
          </span>
        ))}
      </span>
    );
  }

  return <span className="font-mono text-[var(--sf-text-primary)]">{String(value)}</span>;
}

export function PayloadViewer({ payload, defaultExpanded = false, maxLines = 500 }: PayloadViewerProps) {
  const reducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showFull, setShowFull] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const maxHeightPx = maxLines * LINE_HEIGHT_PX;
  const shouldShowFullButton = isExpanded && !showFull && contentHeight > maxHeightPx;

  useEffect(() => {
    setShowFull(false);
  }, [payload]);

  useLayoutEffect(() => {
    if (!isExpanded) {
      setContentHeight(0);
      return;
    }

    const measuredHeight = contentRef.current?.scrollHeight ?? 0;
    setContentHeight(measuredHeight);
  }, [isExpanded, payload, showFull, maxHeightPx]);

  const contentStyle = showFull
    ? undefined
    : {
        maxHeight: `${maxHeightPx}px`,
        overflowY: 'auto' as const,
      };

  const entries = Object.entries(payload);

  const content = (
    <div className="mt-3 text-sm leading-5 text-[var(--sf-text-primary)]">
      <div ref={contentRef} className="space-y-1" style={contentStyle}>
        {entries.map(([key, value]) => {
        const isStreamOrFunction = key === 'stream' || key === 'function';

        return (
          <div key={key} className="flex flex-wrap gap-x-1 gap-y-0.5">
            <span
              className={cn(
                'font-mono',
                isStreamOrFunction ? 'font-bold text-[var(--sf-text-primary)]' : 'font-bold text-[var(--sf-text-secondary)]'
              )}
            >
              {key}
            </span>
            <span className={cn('font-mono', isStreamOrFunction && 'font-bold')}>:</span>
            <span className={cn('min-w-0 flex-1 break-words', isStreamOrFunction && 'font-bold font-mono')}>
              {formatValue(value)}
            </span>
          </div>
        );
        })}
      </div>

      {shouldShowFullButton ? (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowFull(true)}
            className={cn(
              'inline-flex min-h-[36px] items-center rounded-md px-3 py-2 text-xs font-medium transition-colors',
              'bg-[var(--sf-surface-elevated)] text-[var(--sf-accent-cyan)] hover:bg-[var(--sf-surface-hover)]'
            )}
          >
            Show Full Payload
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={cn(
        'rounded-xl border bg-[var(--sf-surface-panel)] text-[var(--sf-text-primary)]',
        'border-[var(--sf-border-default)]'
      )}
      style={{
        backgroundColor: 'var(--sf-surface-panel)',
        borderColor: 'var(--sf-border-default)',
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors',
          'hover:bg-[var(--sf-surface-hover)]'
        )}
      >
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--sf-text-primary)]">
          Payload
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {reducedMotion ? (
        isExpanded ? <div className="px-4 pb-4">{content}</div> : null
      ) : (
        <AnimatePresence initial={false} mode="wait">
          {isExpanded ? (
            <motion.div
              key="payload-viewer-content"
              variants={payloadExpand}
              initial="initial"
              animate="animate"
              exit={payloadCollapse.animate as TargetAndTransition}
              className="overflow-hidden px-4 pb-4"
            >
              {content}
            </motion.div>
          ) : null}
        </AnimatePresence>
      )}
    </div>
  );
}

export default PayloadViewer;
