'use client';

import type { PmSchedule } from '@/lib/tool-health';
import { PM_THRESHOLDS } from '@/lib/tool-health';

interface PmTimelineProps {
  schedule: PmSchedule;
  today?: string;
}

const DOT_COLORS: Record<string, string> = {
  completed: '#22C55E',
  scheduled: '#3B82F6',
  unscheduled: '#F59E0B',
};

export function PmTimeline({ schedule, today }: PmTimelineProps) {
  const todayDate = today ? new Date(today) : new Date();
  const nextPm = new Date(schedule.nextPmDate);
  const daysRemaining = Math.ceil((nextPm.getTime() - todayDate.getTime()) / 86400000);
  const isOverdue = daysRemaining < 0;

  const lastPm = new Date(schedule.lastPmDate);
  const totalSpan = nextPm.getTime() - lastPm.getTime();
  const elapsed = todayDate.getTime() - lastPm.getTime();
  const fraction = totalSpan > 0 ? Math.min(Math.max(elapsed / totalSpan, 0), 1) : 1;

  let barColor = '#22C55E';
  if (isOverdue) {
    barColor = '#EF4444';
  } else if (daysRemaining <= PM_THRESHOLDS.amber) {
    barColor = '#EF4444';
  } else if (daysRemaining <= PM_THRESHOLDS.green) {
    barColor = '#F59E0B';
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span style={{ color: barColor }} className="font-semibold">
          {isOverdue ? 'PM OVERDUE' : `Next PM in ${daysRemaining} days`}
        </span>
        <span className="text-[var(--smartfactory-text-muted)] font-mono text-[10px]">
          {schedule.nextPmDate}
        </span>
      </div>

      <div className="w-full bg-slate-700 rounded h-1.5">
        <div
          className="rounded h-1.5 transition-all"
          style={{ width: `${fraction * 100}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        {schedule.history.map((event, idx) => (
          <div
            key={event.id}
            data-testid={`pm-dot-${idx}`}
            className="flex flex-col items-center"
            title={`${event.date} — ${event.description} (${event.durationHours}h)`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full border border-slate-600"
              style={{ backgroundColor: DOT_COLORS[event.type] ?? DOT_COLORS.completed }}
            />
            <span className="text-[8px] text-[var(--smartfactory-text-muted)] mt-0.5 font-mono">
              {event.date.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
