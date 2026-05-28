'use client';

import { useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Analytics event model (decoupled from the facility EventFeed on purpose).
//
// This component is an intentional DUPLICATE of
// `src/components/dashboard/EventFeed.tsx`, adapted for the analytics domain.
// It carries its own event type + category map so the shipping facility feed
// stays untouched. Consolidating the two is deferred (see DESIGN.md / TODOS).
// ---------------------------------------------------------------------------

export type AnalyticsEventSeverity = 'info' | 'warning' | 'critical';

export type AnalyticsCategory =
  | 'yield'
  | 'apc'
  | 'reliability'
  | 'optimization'
  | 'multifab'
  | 'vpp';

export interface AnalyticsEvent {
  id: string;
  tick: number;
  timestamp: string;
  category: AnalyticsCategory;
  severity: AnalyticsEventSeverity;
  message: string;
}

interface CategoryDef {
  label: string;
  shortLabel: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Category color + short-label map (analytics-specific; uses the home-dashboard
// accent palette so the feed reads as the same product as the facility log).
// ---------------------------------------------------------------------------

export const ANALYTICS_CATEGORY_DEFS: Record<AnalyticsCategory, CategoryDef> = {
  yield: {
    label: 'Yield Forecast',
    shortLabel: 'YLD',
    color: '#22d3ee', // cyan
  },
  apc: {
    label: 'APC R2R',
    shortLabel: 'APC',
    color: '#a78bfa', // violet
  },
  reliability: {
    label: 'Reliability',
    shortLabel: 'REL',
    color: '#f59e0b', // amber
  },
  optimization: {
    label: 'Cross-Process Opt',
    shortLabel: 'OPT',
    color: '#14b8a6', // teal
  },
  multifab: {
    label: 'Multi-Fab',
    shortLabel: 'MFB',
    color: '#3b82f6', // blue
  },
  vpp: {
    label: 'Virtual Process Pipeline',
    shortLabel: 'VPP',
    color: '#f47920', // orange
  },
};

// ---------------------------------------------------------------------------
// Severity icon helpers
// ---------------------------------------------------------------------------

const SEVERITY_TOKEN: Record<AnalyticsEventSeverity, string> = {
  info: 'INFO',
  warning: 'WARN',
  critical: 'CRIT',
};

const SEVERITY_MSG_COLOR: Record<AnalyticsEventSeverity, string> = {
  info: 'var(--sf-text-secondary, #94a3b8)',
  warning: '#fbbf24',
  critical: '#ef4444',
};

// ---------------------------------------------------------------------------
// Opacity fade formula (180-tick window with wrap, mirrors EventFeed)
// ---------------------------------------------------------------------------

function eventOpacity(eventTick: number, currentTick: number): number {
  const age = currentTick >= eventTick ? currentTick - eventTick : currentTick + 180 - eventTick;
  if (age > 40) return 0.4;
  if (age > 30) return 0.4 + 0.6 * ((40 - age) / 10);
  return 1;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AnalyticsEventFeedProps {
  events: AnalyticsEvent[];
  currentTick: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyticsEventFeed({ events, currentTick }: AnalyticsEventFeedProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const prevLenRef = useRef(events.length);
  const lastAnnouncedCriticalIdRef = useRef<string | null>(null);
  const announcerRef = useRef<HTMLDivElement>(null);

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

  // Drive the polite live region: announce ONLY a genuinely NEW critical event,
  // never every tick. The newest critical event (events are appended, so scan
  // from the end) is compared against the last id we announced; we set the
  // region text exactly once per distinct critical event, then clear it so an
  // unrelated tick re-render does not re-trigger the screen reader.
  useEffect(() => {
    let newestCritical: AnalyticsEvent | null = null;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].severity === 'critical') {
        newestCritical = events[i];
        break;
      }
    }

    const announcer = announcerRef.current;
    if (!announcer) return;

    if (!newestCritical) {
      lastAnnouncedCriticalIdRef.current = null;
      announcer.textContent = '';
      return;
    }

    if (newestCritical.id === lastAnnouncedCriticalIdRef.current) {
      // Already announced this critical event — keep the region quiet so a
      // per-tick re-render is not read out again.
      announcer.textContent = '';
      return;
    }

    lastAnnouncedCriticalIdRef.current = newestCritical.id;
    const def = ANALYTICS_CATEGORY_DEFS[newestCritical.category];
    announcer.textContent = `Critical ${def.label} event: ${newestCritical.message}`;
  }, [events]);

  return (
    <div className="rounded-2xl border border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.78)] backdrop-blur-xl font-mono text-[11px] leading-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(34,211,238,0.10)]">
        <span className="text-[rgba(34,211,238,0.7)] font-semibold tracking-wider text-[11px]">
          FAB ANALYTICS EVENT STREAM
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

      {/* High-frequency event list: aria-live OFF so per-tick churn is not
          announced to screen readers (would be overwhelming at 1 Hz). */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-[320px] overflow-y-auto px-3 py-1"
        role="log"
        aria-live="off"
        aria-label="Fab analytics event stream"
      >
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[rgba(148,163,184,0.5)]">
            Awaiting fab events…
          </div>
        ) : (
          <ul role="list">
            {events.map((_, reversedIndex) => {
              const originalIndex = events.length - 1 - reversedIndex;
              const evt = events[originalIndex];
              const def = ANALYTICS_CATEGORY_DEFS[evt.category];
              const opacity = eventOpacity(evt.tick, currentTick);
              const isCritical = evt.severity === 'critical';

              return (
                <li
                  key={`${evt.id}-${originalIndex}`}
                  data-testid="analytics-event-row"
                  className="flex items-start gap-2 py-0.5"
                  style={{ opacity }}
                  aria-label={`${evt.timestamp} ${def.shortLabel} ${evt.severity}: ${evt.message}`}
                >
                  {/* Timestamp */}
                  <span
                    className="shrink-0 w-[58px]"
                    style={{ color: def.color }}
                  >
                    {evt.timestamp}
                  </span>

                  {/* Category tag */}
                  <span
                    className="shrink-0 w-[38px] text-center font-bold"
                    style={{ color: def.color }}
                  >
                    {def.shortLabel}
                  </span>

                  {/* Severity icon */}
                  <span
                    className={`shrink-0 w-[34px] text-center text-[9px] font-bold${isCritical ? ' animate-pulse' : ''}`}
                    aria-hidden="true"
                  >
                    {SEVERITY_TOKEN[evt.severity]}
                  </span>

                  {/* Message */}
                  <span
                    className="flex-1 truncate"
                    style={{ color: SEVERITY_MSG_COLOR[evt.severity] }}
                  >
                    {evt.message}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Single polite live region: announces ONLY new critical-severity events
          (never every tick). Visually hidden but exposed to assistive tech. */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="analytics-critical-announcer"
        className="sr-only"
      />
    </div>
  );
}
