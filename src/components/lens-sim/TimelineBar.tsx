'use client';

import type { WaferState } from '@/lib/lens-sim';

interface TimelineBarProps {
  currentIndex: number;
  lotSize: number;
  playing: boolean;
  currentWafer: WaferState | null;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onSeek: (index: number) => void;
  onReset: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export function TimelineBar({
  currentIndex,
  lotSize,
  playing,
  currentWafer,
  onPlay,
  onPause,
  onStep,
  onSeek,
  onReset,
  playbackSpeed,
  onSpeedChange,
}: TimelineBarProps) {
  const waferNum = currentIndex + 1;
  const l1DeltaT = currentWafer?.lensElements[0]?.deltaT ?? 0;
  const maxCd = currentWafer ? Math.max(...currentWafer.cdMap.map(Math.abs)) : 0;
  const elapsed = currentWafer?.elapsedTime ?? 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(8,18,31,0.82)] px-4 py-2.5 backdrop-blur-xl">
      {/* Transport controls */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-2 py-1 font-mono text-xs text-[var(--sf-text-secondary)] hover:bg-white/[0.06]"
          aria-label="Reset to start"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onStep}
          disabled={currentIndex >= lotSize - 1}
          className="rounded-lg px-2 py-1 font-mono text-xs text-[var(--sf-text-secondary)] hover:bg-white/[0.06] disabled:opacity-30"
          aria-label="Step one wafer"
        >
          Step
        </button>
        <button
          type="button"
          onClick={playing ? onPause : onPlay}
          disabled={currentIndex >= lotSize - 1 && !playing}
          className="min-h-[36px] min-w-[36px] rounded-lg border border-[var(--sf-accent-cyan)] bg-[rgba(34,211,238,0.12)] px-2.5 py-1 font-mono text-xs text-white"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '\u23F8' : '\u25B6'}
        </button>
      </div>

      {/* Scrubber */}
      <input
        type="range"
        min={0}
        max={lotSize - 1}
        value={Math.max(0, currentIndex)}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="mx-2 h-1.5 flex-1 cursor-pointer accent-[var(--sf-accent-cyan)]"
        aria-label="Wafer timeline"
      />

      {/* Readouts */}
      <div className="flex items-center gap-4 font-mono text-[11px]">
        <span className="text-white">
          Wafer <span className="text-[var(--sf-accent-cyan)]">{waferNum}</span>/{lotSize}
        </span>
        <span className="text-[var(--sf-text-muted)]">t={elapsed.toFixed(0)}s</span>
        <span className="text-[var(--sf-text-muted)]">
          L1: <span className={l1DeltaT > 0.1 ? 'text-[#f59e0b]' : 'text-[#22d3ee]'}>+{l1DeltaT.toFixed(3)}&deg;C</span>
        </span>
        <span className="text-[var(--sf-text-muted)]">
          &Delta;CD: <span className={maxCd > 2 ? 'text-[#ef4444]' : 'text-[#22d3ee]'}>{maxCd.toFixed(1)}nm</span>
        </span>
      </div>

      {/* Speed selector */}
      <select
        value={playbackSpeed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
        className="rounded-lg border border-white/10 bg-transparent px-2 py-1 font-mono text-[10px] text-[var(--sf-text-secondary)]"
        aria-label="Playback speed"
      >
        {[1, 2, 5, 10].map((s) => (
          <option key={s} value={s}>{s}x</option>
        ))}
      </select>
    </div>
  );
}
