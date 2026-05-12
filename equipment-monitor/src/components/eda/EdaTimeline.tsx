'use client';

import { AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import { EDA_STAGE_DEFINITIONS, EDA_STAGE_ORDER } from '@/lib/eda-mock-data';
import type { EdaStage, StageState } from '@/lib/eda-types';
import { cn } from '@/lib/utils';

interface EdaTimelineProps {
  stages: StageState[];
  selectedStage: EdaStage;
  onSelectStage: (stage: EdaStage) => void;
}

export function EdaTimeline({ stages, selectedStage, onSelectStage }: EdaTimelineProps) {
  const byStage = new Map(stages.map((stage) => [stage.stage, stage]));

  return (
    <section className="border-t border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.94)] px-4 py-3" aria-label="EDA pipeline timeline">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        {EDA_STAGE_ORDER.map((stageId) => {
          const stage = byStage.get(stageId);
          const definition = EDA_STAGE_DEFINITIONS[stageId];
          const selected = selectedStage === stageId;
          const warning = stage?.status === 'warning' || stage?.status === 'failed';
          const completed = stage?.status === 'completed';
          return (
            <button
              key={stageId}
              type="button"
              onClick={() => onSelectStage(stageId)}
              className={cn(
                'min-h-[74px] rounded-2xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]',
                selected ? 'border-[#F47920] bg-[#F47920]/12' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.065]',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-[var(--sf-text-primary)]">{definition.shortLabel}</span>
                {warning ? <AlertTriangle className="h-4 w-4 text-[var(--sf-status-amber)]" aria-hidden="true" /> : completed ? <CheckCircle className="h-4 w-4 text-[var(--sf-status-green)]" aria-hidden="true" /> : <Circle className="h-4 w-4 text-[var(--sf-text-muted)]" aria-hidden="true" />}
              </div>
              <p className="mt-1 truncate text-[10px] text-[var(--sf-text-secondary)]">{definition.label}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${stage?.progress ?? 0}%`, backgroundColor: warning ? 'var(--sf-status-amber)' : definition.color }}
                />
              </div>
              <p className="mt-1 font-mono text-[10px] text-[var(--sf-text-muted)]">{Math.round(stage?.progress ?? 0)}%</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
