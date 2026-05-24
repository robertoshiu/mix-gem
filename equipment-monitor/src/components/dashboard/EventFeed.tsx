'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import {
  SUBSYSTEM_DEFS,
  type FacilityEvent,
} from '@/lib/engines/dashboard-facility-types';

// ---------------------------------------------------------------------------
// Severity icon helpers
// ---------------------------------------------------------------------------

const SEVERITY_ICON: Record<string, string> = {
  info: '\u2139',      // ℹ
  warning: '\u26A0',   // ⚠
  critical: '\uD83D\uDD34', // 🔴
};

const SEVERITY_MSG_COLOR: Record<string, string> = {
  info: 'var(--sf-text-secondary, #94a3b8)',
  warning: '#fbbf24',
  critical: '#ef4444',
};

// ---------------------------------------------------------------------------
// Opacity fade formula
// ---------------------------------------------------------------------------

function eventOpacity(eventTick: number, currentTick: number): number {
  const age = currentTick - eventTick;
  if (age > 40) return 0.4;
  if (age > 30) return 0.4 + 0.6 * ((40 - age) / 10);
  return 1;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface EventFeedProps {
  events: FacilityEvent[];
  currentTick: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EventFeed({ events, currentTick }: EventFeedProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const prevLenRef = useRef(events.length);

  // Track manual scroll
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    // If user scrolled away from top, mark as manually scrolled
    userScrolledRef.current = el.scrollTop > 4;
  }, []);

  // Auto-scroll to top when new events arrive (unless user scrolled)
  useEffect(() => {
    if (events.length > prevLenRef.current && !userScrolledRef.current) {
      const el = listRef.current;
      if (el) el.scrollTop = 0;
    }
    prevLenRef.current = events.length;
  }, [events.length]);

  // Display newest first
  const reversed = [...events].reverse();

  return (
    <div className="rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.78)] backdrop-blur-xl font-mono text-[11px] leading-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(34,211,238,0.10)]">
        <span className="text-[rgba(34,211,238,0.7)] font-semibold tracking-wider text-[11px]">
          FACILITY EVENT LOG
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[rgba(148,163,184,0.6)] text-[10px]">
            {events.length} events
          </span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-green-400 text-[10px] font-semibold tracking-wide">
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Event list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-[320px] overflow-y-auto px-3 py-1"
      >
        {reversed.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[rgba(148,163,184,0.5)]">
            Awaiting facility events...
          </div>
        ) : (
          reversed.map((evt) => {
            const def = SUBSYSTEM_DEFS[evt.subsystem];
            const opacity = eventOpacity(evt.tick, currentTick);
            const isCritical = evt.severity === 'critical';

            return (
              <div
                key={evt.id}
                data-testid="event-row"
                className="flex items-start gap-2 py-0.5"
                style={{ opacity }}
              >
                {/* Timestamp */}
                <span
                  className="shrink-0 w-[58px]"
                  style={{ color: def.color }}
                >
                  {evt.timestamp}
                </span>

                {/* Subsystem tag */}
                <span
                  className="shrink-0 w-[38px] text-center font-bold"
                  style={{ color: def.color }}
                >
                  {def.shortLabel}
                </span>

                {/* Severity icon */}
                <span
                  className={`shrink-0 w-[18px] text-center${isCritical ? ' animate-pulse' : ''}`}
                >
                  {SEVERITY_ICON[evt.severity]}
                </span>

                {/* Message */}
                <span
                  className="flex-1 truncate"
                  style={{ color: SEVERITY_MSG_COLOR[evt.severity] }}
                >
                  {evt.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
