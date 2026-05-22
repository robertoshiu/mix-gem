'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import type { StepState } from '@/lib/oxidation-sim';

interface TimelineBarProps {
  currentIndex: number;
  totalSteps: number;
  playing: boolean;
  currentStep: StepState | null;
  backHref?: string;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSeek: (index: number) => void;
  onReset: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

function formatTime(s: number): string {
  if (s >= 60) return `${(s / 60).toFixed(1)} min`;
  if (s >= 1) return `${s.toFixed(1)} s`;
  if (s >= 1e-3) return `${(s * 1e3).toFixed(1)} ms`;
  return `${(s * 1e6).toFixed(1)} \u00B5s`;
}

const PHASE_COLORS: Record<string, string> = {
  ramp: '#F59E0B',
  soak: '#EF4444',
  cool: '#3B82F6',
};

export function TimelineBar({
  currentIndex, totalSteps, playing, currentStep, backHref,
  onPlay, onPause, onStep, onSeek, onReset,
  playbackSpeed, onSpeedChange,
}: TimelineBarProps) {
  const progress = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;
  const temp = currentStep?.temperature?.toFixed(0) ?? '--';
  const time = currentStep ? formatTime(currentStep.time) : '--';
  const phase = currentStep?.thermalPhase ?? 'ramp';

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-2 backdrop-blur-xl">
      {backHref && (
        <Link href={backHref} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Back">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      <div className="flex items-center gap-1">
        <button type="button" onClick={playing ? onPause : onPlay} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button type="button" onClick={onStep} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Step" disabled={currentIndex >= totalSteps - 1}>
          <ChevronRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={onReset} className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full hover:bg-white/10" aria-label="Reset">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-w-[200px]">
        <input type="range" min={-1} max={totalSteps - 1} value={currentIndex} onChange={(e) => onSeek(Number(e.target.value))} className="w-full accent-amber-500" aria-label="Step timeline" />
        <div className="mt-0.5 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs">
        <span className="text-[var(--sf-text-secondary)]">
          Step {currentIndex + 1}/{totalSteps}
        </span>
        <span style={{ color: '#F59E0B' }}>
          {temp}°C
        </span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: (PHASE_COLORS[phase] ?? '#94a3b8') + '33', color: PHASE_COLORS[phase] ?? '#94a3b8' }}>
          {phase}
        </span>
        <span className="text-[var(--sf-text-muted)]">
          t={time}
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
