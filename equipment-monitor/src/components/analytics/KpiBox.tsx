'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/animation';

export interface KpiBoxProps {
  /** Metric name shown as the caption (uses --sf-text-secondary, >=14px). */
  label: string;
  /** The primary metric value, rendered in the mono/data face. */
  value: string;
  /**
   * Optional plain-language one-liner (progressive disclosure for non-experts).
   * Rendered under the value when present.
   */
  plain?: string;
  /**
   * Optional accent color (any CSS color / var()). Tints the value and the
   * live-delta flash. Defaults to the cyan telemetry accent.
   */
  accent?: string;
}

/** How long the live-delta highlight stays lit, in ms. */
const FLASH_DURATION_MS = 600;

/**
 * Shared analytics KPI box matching the home dashboard glass treatment.
 *
 * - Glassmorphism: rounded-2xl, frosted surface, cyan glass border, soft glow.
 * - Caption uses --sf-text-secondary (#94A3B8 ~7:1) at >=14px per DESIGN.md.
 * - "Live-delta flash": when `value` changes between renders the value briefly
 *   highlights (border/glow/text pulse) so viewers register the data is alive.
 *   Honors prefers-reduced-motion (no flash, no transition).
 */
function KpiBoxComponent({ label, value, plain, accent }: KpiBoxProps) {
  const accentColor = accent ?? 'var(--sf-accent-cyan)';

  // Two counters drive the highlight without ever calling setState inside an
  // effect body (avoids cascading-render lint + React's anti-pattern):
  //   - `flashCounter` bumps synchronously during render when `value` changes
  //     (React's "adjust state on prop change" pattern).
  //   - `clearedCounter` is advanced by the timeout *callback* (a callback, the
  //     sanctioned place to setState from an effect).
  // The flash is lit whenever a bump is still un-cleared.
  const [prevValue, setPrevValue] = useState<string>(value);
  const [flashCounter, setFlashCounter] = useState(0);
  const [clearedCounter, setClearedCounter] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    // Respect reduced-motion: update the value silently, no flash bump.
    if (!prefersReducedMotion()) {
      setFlashCounter((n) => n + 1);
    }
  }

  const flashing = flashCounter > clearedCounter;

  // Schedule the auto-clear; the setState happens in the timeout callback.
  useEffect(() => {
    if (!flashing) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => setClearedCounter(flashCounter),
      FLASH_DURATION_MS,
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [flashing, flashCounter]);

  return (
    <div
      data-testid="kpi-box"
      data-flashing={flashing ? 'true' : 'false'}
      className="rounded-2xl border bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-xl transition-[border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none"
      style={{
        borderColor: flashing ? accentColor : 'rgba(34,211,238,0.22)',
        boxShadow: flashing
          ? `0 24px 80px rgba(0,0,0,0.35), 0 0 16px ${accentColor}`
          : '0 24px 80px rgba(0,0,0,0.35)',
      }}
    >
      <div className="text-sm font-medium tracking-wide text-[var(--sf-text-secondary)]">
        {label}
      </div>
      <div
        className="mt-1 font-mono text-2xl font-bold tabular-nums transition-colors duration-300 ease-out motion-reduce:transition-none"
        style={{ color: flashing ? accentColor : 'var(--sf-text-primary)' }}
      >
        {value}
      </div>
      {plain && (
        <div className="mt-1 text-sm leading-snug text-[var(--sf-text-secondary)]">
          {plain}
        </div>
      )}
    </div>
  );
}

/**
 * Memoized so tick-driven parents only re-render the boxes whose props change
 * (per the eng-review "React.memo on KpiBox/charts" requirement).
 */
export const KpiBox = memo(KpiBoxComponent);

export default KpiBox;
