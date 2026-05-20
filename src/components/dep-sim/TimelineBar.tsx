'use client';

import { ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { CycleState } from '@/lib/dep-sim';

interface TimelineBarProps {
  currentIndex: number;
  totalCycles: number;
  playing: boolean;
  currentCycle: CycleState | null;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSeek: (index: number) => void;
  onReset: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const PHASE_COLORS: Record<string, string> = {
  'bdeas-pulse': '#3b82f6',
  'purge-a': '#6b7280',
  'o3-pulse': '#f97316',
  'purge-b': '#6b7280',
};

const PHASE_LABELS: Record<string, string> = {
  'bdeas-pulse': 'BDEAS Pulse',
  'purge-a': 'Purge',
  'o3-pulse': 'O\u2083 Pulse',
  'purge-b': 'Purge',
};

export function TimelineBar({
  currentIndex, totalCycles, playing, currentCycle,
  onPlay, onPause, onStep, onSeek, onReset,
  playbackSpeed, onSpeedChange,
}: TimelineBarProps) {
  const progress = totalCycles > 0 ? ((currentIndex + 1) / totalCycles) * 100 : 0;
  const phase = currentCycle?.phase ?? 'purge-b';
  const thickness = currentCycle?.cumulativeThickness.toFixed(1) ?? '0.0';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(59,130,246,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-2 backdrop-blur-xl">
      <div className="flex items-center gap-1">
        <button type="button" onClick={playing ? onPause : onPlay} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onStep} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Step one cycle" disabled={currentIndex >= totalCycles - 1}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onReset} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Reset">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-w-[200px]">
        <input type="range" min={-1} max={totalCycles - 1} value={currentIndex} onChange={(e) => onSeek(Number(e.target.value))} className="w-full accent-blue-500" aria-label="Cycle timeline" />
        <div className="mt-0.5 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: PHASE_COLORS[phase] }} />
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs">
        <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: PHASE_COLORS[phase], color: '#fff' }}>
          {PHASE_LABELS[phase]}
        </span>
        <span className="text-[var(--sf-text-secondary)]">
          Cycle {currentIndex + 1}/{totalCycles}
        </span>
        <span style={{ color: '#3b82f6' }}>
          {thickness} {'\u00C5'}
        </span>
        <select value={playbackSpeed} onChange={(e) => onSpeedChange(Number(e.target.value))} className="rounded bg-white/10 px-2 py-1 text-xs" aria-label="Playback speed">
          <option value={1}>1{'\u00D7'}</option>
          <option value={2}>2{'\u00D7'}</option>
          <option value={5}>5{'\u00D7'}</option>
          <option value={10}>10{'\u00D7'}</option>
        </select>
      </div>
    </div>
  );
}
