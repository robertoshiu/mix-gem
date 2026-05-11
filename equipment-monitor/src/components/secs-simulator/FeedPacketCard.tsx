'use client';

import { motion, type TargetAndTransition } from 'framer-motion';
import type { DemoSecsMessage } from '@/lib/secs-gem-demo-data';
import {
  TYPEWRITER_SPEED,
  STAGGER_DELAY,
  glowPulse,
  packetEnter,
  packetExit,
  useReducedMotion,
  useTypewriter,
} from '@/lib/secs-simulator-animation';
import { cn } from '@/lib/utils';

interface FeedPacketCardProps {
  message: DemoSecsMessage;
  isActive: boolean;
  index: number;
  enableTypewriter?: boolean;
}

function TypewriterSummary({ text }: { text: string }) {
  const typedText = useTypewriter(text, TYPEWRITER_SPEED);

  return <>{typedText}</>;
}

export function FeedPacketCard({ message, isActive, index, enableTypewriter = false }: FeedPacketCardProps) {
  const reducedMotion = useReducedMotion();
  const packetExitVariant = packetExit.exit as TargetAndTransition;
  const baseClassName = cn(
    'relative overflow-hidden rounded-xl border bg-[var(--sf-surface-panel)] px-3 py-2',
    reducedMotion
      ? isActive
        ? 'border-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.08)]'
        : 'border-[var(--sf-border-default)]'
      : isActive
      ? 'border-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.08)]'
      : 'border-[var(--sf-border-default)]'
  );

  const summaryText = enableTypewriter ? <TypewriterSummary text={message.summary} /> : message.summary;

  if (reducedMotion) {
    return (
      <div className={baseClassName}>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-[var(--sf-text-primary)]">{message.sf}</span>
          <span
            className={cn(
              'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold',
              message.direction === 'H2E'
                ? 'bg-[rgba(59,130,246,0.16)] text-[var(--sf-accent-blue)]'
                : 'bg-[rgba(20,184,166,0.16)] text-[var(--sf-accent-teal)]'
            )}
            aria-label={message.direction}
            title={message.direction}
          >
            {message.direction === 'H2E' ? '→' : '←'}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--sf-text-secondary)]">{message.summary}</p>
      </div>
    );
  }

  return (
    <motion.div
      className={baseClassName}
      variants={packetEnter}
      initial="initial"
      animate="animate"
      exit={packetExitVariant}
      style={{ transitionDelay: `${index * STAGGER_DELAY}ms` }}
    >
      {isActive && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl border border-[var(--sf-accent-cyan)]"
          variants={glowPulse}
          initial="initial"
          animate="animate"
        />
      )}

      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-[var(--sf-text-primary)]">{message.sf}</span>
        <span
          className={cn(
            'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-semibold',
            message.direction === 'H2E'
              ? 'bg-[rgba(59,130,246,0.16)] text-[var(--sf-accent-blue)]'
              : 'bg-[rgba(20,184,166,0.16)] text-[var(--sf-accent-teal)]'
          )}
          aria-label={message.direction}
          title={message.direction}
        >
          {message.direction === 'H2E' ? '→' : '←'}
        </span>
      </div>

      <p className="relative z-10 mt-1 text-xs leading-relaxed text-[var(--sf-text-secondary)]">{summaryText}</p>
    </motion.div>
  );
}
