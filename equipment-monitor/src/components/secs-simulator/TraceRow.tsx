'use client';

import { useState } from 'react';
import { AnimatePresence, motion, type TargetAndTransition } from 'framer-motion';
import PayloadViewer from '@/components/secs-simulator/PayloadViewer';
import type { DemoSecsMessage } from '@/lib/secs-gem-demo-data';
import { payloadCollapse, payloadExpand, useReducedMotion } from '@/lib/secs-simulator-animation';
import { cn } from '@/lib/utils';

interface TraceRowProps {
  message: DemoSecsMessage;
  isLatest: boolean;
  index: number;
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function ExpandedPayloadRow({ message }: { message: DemoSecsMessage }) {
  return (
    <tr className="border-b border-[var(--sf-border-default)] bg-[rgba(15,23,42,0.24)] last:border-b-0">
      <td colSpan={7} className="px-4 pb-4 pt-1">
        <PayloadViewer payload={message.payload} defaultExpanded maxLines={500} />
      </td>
    </tr>
  );
}

export function TraceRow({ message, isLatest, index }: TraceRowProps) {
  const [expanded, setExpanded] = useState(false);
  const reducedMotion = useReducedMotion();
  const rowDelay = reducedMotion ? undefined : `${index * 20}ms`;

  const content = <ExpandedPayloadRow message={message} />;

  return (
    <>
      <tr
        className={cn(
          'border-b border-[var(--sf-border-default)] transition-colors duration-300 motion-reduce:transition-none',
          expanded ? 'border-b-0' : 'last:border-b-0',
          isLatest && 'bg-[rgba(34,211,238,0.08)] shadow-[inset_3px_0_0_var(--sf-accent-cyan)]'
        )}
        style={{ transitionDelay: rowDelay }}
      >
        <td className="px-4 py-3 font-mono text-xs">{formatTimestamp(message.timestamp)}</td>
        <td className="px-4 py-3">
          <span
            className={cn(
              'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-mono text-sm font-semibold',
              message.direction === 'H2E'
                ? 'bg-[rgba(59,130,246,0.16)] text-[var(--sf-accent-blue)]'
                : 'bg-[rgba(20,184,166,0.16)] text-[var(--sf-accent-teal)]'
            )}
            aria-label={message.direction}
            title={message.direction}
          >
            {message.direction === 'H2E' ? '→' : '←'}
          </span>
        </td>
        <td className="px-4 py-3 font-mono text-[var(--sf-text-primary)]">{message.sf}</td>
        <td className="px-4 py-3">{message.wbit ? 'Yes' : 'No'}</td>
        <td className="px-4 py-3 font-mono">{message.latencyMs} ms</td>
        <td className="px-4 py-3 font-mono">{message.systemBytes}</td>
        <td className="px-4 py-3 text-[var(--sf-text-secondary)]">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            className="min-h-9 w-full cursor-pointer rounded-md text-left transition-colors hover:text-[var(--sf-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sf-accent-cyan)] motion-reduce:transition-none"
          >
            {message.summary}
          </button>
        </td>
      </tr>

      {reducedMotion ? (
        expanded ? content : null
      ) : (
        <AnimatePresence initial={false} mode="wait">
          {expanded ? (
            <motion.tr
              key={`${message.id}-payload`}
              variants={payloadExpand}
              initial="initial"
              animate="animate"
              exit={payloadCollapse.animate as TargetAndTransition}
              className="border-b border-[var(--sf-border-default)] bg-[rgba(15,23,42,0.24)] last:border-b-0"
            >
              <td colSpan={7} className="overflow-hidden px-4 pb-4 pt-1">
                <PayloadViewer payload={message.payload} defaultExpanded maxLines={500} />
              </td>
            </motion.tr>
          ) : null}
        </AnimatePresence>
      )}
    </>
  );
}

export default TraceRow;
