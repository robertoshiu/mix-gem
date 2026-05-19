'use client';

import { useState, useRef, useEffect } from 'react';
import type { SecsEvent, SecsEventType } from '@/lib/mes-types';
import { cn } from '@/lib/utils';
import {
  Zap,
  AlertTriangle,
  Play,
  CheckCircle,
  Upload,
  Check,
  TrendingUp,
  Activity,
  XCircle,
  Shield,
  Bell,
} from 'lucide-react';

const EVENT_COLORS: Record<string, string> = {
  s6f11_spc_data:    'text-[var(--smartfactory-accent-teal)]',
  s2f41_stop:        'text-[var(--smartfactory-status-red)]',
  s2f42_ack:         'text-[var(--smartfactory-text-secondary)]',
  s2f41_resume:      'text-[var(--smartfactory-status-green)]',
  s2f49_recipe_push: 'text-[var(--smartfactory-accent-blue)]',
  s2f50_recipe_ack:  'text-[var(--smartfactory-text-secondary)]',
  s2f49_apply:       'text-[var(--smartfactory-accent-blue)]',
  s2f50_apply_ack:   'text-[var(--smartfactory-text-secondary)]',
  s2f49_override:    'text-[var(--smartfactory-accent-blue)]',
  s2f50_override_ack: 'text-[var(--smartfactory-text-secondary)]',
  s6f11_notification: 'text-[var(--smartfactory-status-warning)]',
};

const EVENT_ICONS: Record<SecsEventType, React.ComponentType<{ className?: string; size?: number }>> = {
  s6f11_spc_data:      Zap,
  s2f41_stop:          AlertTriangle,
  s2f42_ack:           CheckCircle,
  s2f41_resume:        Play,
  s2f49_recipe_push:   Upload,
  s2f50_recipe_ack:    Check,
  s2f49_apply:         TrendingUp,
  s2f50_apply_ack:     Activity,
  s2f49_override:      XCircle,
  s2f50_override_ack:  Shield,
  s6f11_notification:  Bell,
};

type Filter = 'All' | 'SPC' | 'Violations' | 'Commands';

interface EventLogProps {
  events: SecsEvent[];
}

export function EventLog({ events }: EventLogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when events array changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const fitsFilter = (event: SecsEvent): boolean => {
    switch (activeFilter) {
      case 'SPC':
        return event.type.includes('spc_data') || event.type.includes('6f11');
      case 'Violations':
        return event.type.includes('stop') || event.type.includes('on_hold');
      case 'Commands':
        return event.type.includes('2f41') || event.type.includes('2f49') || event.type.includes('2f50');
      default:
        return true;
    }
  };

  const matchesSearch = (event: SecsEvent): boolean => {
    if (!searchQuery) return true;
    return event.label.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const filteredEvents = events.filter((e) => fitsFilter(e) && matchesSearch(e));

  const payloadPreview = (event: SecsEvent): string | null => {
    const msg = event.secsMessage;
    if (!msg || Object.keys(msg).length === 0) return null;
    const preview = JSON.stringify(msg);
    return preview.length > 40 ? preview.slice(0, 40) + '\u2026' : preview;
  };

  const filterButtons: Filter[] = ['All', 'SPC', 'Violations', 'Commands'];

  return (
    <div
      data-testid="event-log"
      className="bg-[var(--smartfactory-surface-card)] rounded border border-[var(--smartfactory-border-default)] p-3 flex flex-col gap-2 h-full overflow-hidden"
    >
      <span className="text-xs font-semibold text-[var(--smartfactory-text-secondary)] uppercase tracking-wide shrink-0">
        Event Log
      </span>

      {/* Search input */}
      <input
        data-testid="event-search"
        type="text"
        placeholder="Search events..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="text-xs bg-[var(--smartfactory-surface-raised)] border border-[var(--smartfactory-border-default)] rounded px-2 py-1 text-[var(--smartfactory-text-primary)] placeholder-[var(--smartfactory-text-muted)] outline-none focus:border-[var(--smartfactory-border-active)] shrink-0"
      />

      {/* Filter buttons */}
      <div className="flex gap-1 shrink-0">
        {filterButtons.map((f) => (
          <button
            key={f}
            data-testid={`event-filter-${f}`}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'text-xs px-2 py-0.5 rounded border transition-colors',
              activeFilter === f
                ? 'bg-[var(--smartfactory-border-active)] border-[var(--smartfactory-border-active)] text-[var(--smartfactory-text-primary)]'
                : 'bg-transparent border-[var(--smartfactory-border-default)] text-[var(--smartfactory-text-muted)] hover:text-[var(--smartfactory-text-secondary)]',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Event list */}
      {filteredEvents.length === 0 ? (
        <p className="text-xs text-[var(--smartfactory-text-muted)] mt-2">No events yet</p>
      ) : (
        <div
          ref={scrollRef}
          className="overflow-y-auto flex flex-col gap-0.5 flex-1"
        >
          {filteredEvents.map((event) => {
            const IconComponent = EVENT_ICONS[event.type];
            const preview = payloadPreview(event);
            return (
              <div key={event.id} className="flex items-start gap-2 py-0.5">
                <IconComponent
                  className={cn('shrink-0 mt-0.5', EVENT_COLORS[event.type])}
                  size={14}
                />
                <span className="text-[10px] text-[var(--smartfactory-text-muted)] font-['Fira_Code',monospace] shrink-0 mt-0.5">
                  {event.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className={cn('text-xs truncate', EVENT_COLORS[event.type])}>
                    {event.label}
                  </span>
                  {preview && (
                    <span className="text-[10px] text-[var(--smartfactory-text-muted)] truncate font-['Fira_Code',monospace]">
                      {preview}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
