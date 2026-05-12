'use client';

import { Activity, Pause, Play, RefreshCw, Zap } from 'lucide-react';
import { EDA_STAGE_DEFINITIONS, EDA_STAGE_ORDER, FAULT_LABELS } from '@/lib/eda-mock-data';
import type { EdaStage, FaultType, SimulatorSpeed, TechNode } from '@/lib/eda-types';
import { cn } from '@/lib/utils';

const SPEEDS: SimulatorSpeed[] = [1, 2, 5, 10];
const TECH_NODES: TechNode[] = ['7nm', '5nm', '3nm'];
const FAULTS: Array<{ fault: FaultType; stage: EdaStage }> = [
  { fault: 'timing_closure_fail', stage: 'sta' },
  { fault: 'congestion_hotspot', stage: 'place_route' },
  { fault: 'drc_storm', stage: 'drc_lvs' },
  { fault: 'power_budget_exceeded', stage: 'synthesis' },
];

interface EdaToolbarProps {
  running: boolean;
  speed: SimulatorSpeed;
  techNode: TechNode;
  elapsedMs: number;
  currentStage: EdaStage | null;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: SimulatorSpeed) => void;
  onTechNodeChange: (techNode: TechNode) => void;
  onFaultInject: (fault: FaultType, stage: EdaStage) => void;
}

function formatElapsed(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function EdaToolbar({
  running,
  speed,
  techNode,
  elapsedMs,
  currentStage,
  onStart,
  onPause,
  onReset,
  onSpeedChange,
  onTechNodeChange,
  onFaultInject,
}: EdaToolbarProps) {
  return (
    <header className="border-b border-[rgba(34,211,238,0.18)] bg-[rgba(2,6,23,0.92)] px-4 py-4 backdrop-blur-xl md:px-6">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="h-5 w-5 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
            <h1 className="text-lg font-semibold tracking-[0.18em] text-[var(--sf-text-primary)]">EDA Pipeline Simulator</h1>
            <span className="rounded-full border border-[#F47920]/50 bg-[#F47920]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#FDBA74]">client-side digital flow</span>
          </div>
          <p className="mt-2 text-sm text-[var(--sf-text-secondary)]">
            {currentStage ? `${EDA_STAGE_DEFINITIONS[currentStage].label} running on ${EDA_STAGE_DEFINITIONS[currentStage].tool}` : 'Pipeline ready for RTL-to-tapeout simulation'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={running ? onPause : onStart}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.12)] px-4 text-sm font-semibold text-[var(--sf-text-primary)] transition-colors hover:bg-[rgba(34,211,238,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]"
          >
            {running ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            {running ? 'Pause' : 'Run'}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-[var(--sf-text-secondary)] transition-colors hover:bg-white/[0.08] hover:text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reset
          </button>

          <label className="sr-only" htmlFor="eda-tech-node">Tech node</label>
          <select
            id="eda-tech-node"
            value={techNode}
            onChange={(event) => onTechNodeChange(event.target.value as TechNode)}
            className="min-h-[44px] rounded-xl border border-white/10 bg-slate-950 px-3 font-mono text-sm text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]"
          >
            {TECH_NODES.map((node) => <option key={node} value={node}>{node}</option>)}
          </select>

          <div className="flex rounded-xl border border-white/10 bg-white/[0.035] p-1" aria-label="Simulation speed">
            {SPEEDS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSpeedChange(item)}
                className={cn(
                  'min-h-9 rounded-lg px-3 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-border-active)]',
                  speed === item ? 'bg-[#F47920] text-white' : 'text-[var(--sf-text-secondary)] hover:bg-white/[0.08]',
                )}
              >
                {item}x
              </button>
            ))}
          </div>

          <label className="sr-only" htmlFor="eda-fault">Inject fault</label>
          <select
            id="eda-fault"
            defaultValue=""
            onChange={(event) => {
              const selected = FAULTS.find((item) => `${item.fault}:${item.stage}` === event.target.value);
              if (selected) onFaultInject(selected.fault, selected.stage);
              event.target.value = '';
            }}
            className="min-h-[44px] rounded-xl border border-[#F47920]/40 bg-slate-950 px-3 font-mono text-xs text-[var(--sf-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F47920]"
          >
            <option value="">Inject fault...</option>
            {FAULTS.map(({ fault, stage }) => (
              <option key={`${fault}:${stage}`} value={`${fault}:${stage}`}>{FAULT_LABELS[fault]} @ {EDA_STAGE_DEFINITIONS[stage].shortLabel}</option>
            ))}
          </select>

          <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs text-[var(--sf-text-secondary)]">
            <Zap className="mr-1 inline h-3.5 w-3.5 text-[#F47920]" aria-hidden="true" />
            {formatElapsed(elapsedMs)} / {EDA_STAGE_ORDER.length} stages
          </div>
        </div>
      </div>
    </header>
  );
}
