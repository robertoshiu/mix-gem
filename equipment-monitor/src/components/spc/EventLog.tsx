'use client';

import type { SecsEvent, SecsEventType } from '@/lib/mes-types';
import { cn } from '@/lib/utils';

const EVENT_COLORS: Record<SecsEventType, string> = {
  s6f11_spc_data:    'text-[#14B8A6]',
  s2f41_stop:        'text-[#EF4444]',
  s2f42_ack:         'text-[#94A3B8]',
  s2f41_resume:      'text-[#10B981]',
  s2f49_recipe_push: 'text-[#3B82F6]',
  s2f50_recipe_ack:  'text-[#94A3B8]',
};

interface EventLogProps {
  events: SecsEvent[];
}

export function EventLog({ events }: EventLogProps) {
  return (
    <div className="bg-[#111D2E] rounded border border-[#1E3A5F] p-3 flex flex-col gap-1 h-full overflow-hidden">
      <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide shrink-0">Event Log</span>

      {events.length === 0 ? (
        <p className="text-xs text-[#475569] mt-2">No events yet</p>
      ) : (
        <div className="overflow-y-auto flex flex-col gap-0.5 flex-1">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-2 py-0.5">
              <span className="text-[10px] text-[#475569] font-['Fira_Code',monospace] shrink-0 mt-0.5">
                {event.timestamp.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={cn('text-xs truncate', EVENT_COLORS[event.type])}>
                {event.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}