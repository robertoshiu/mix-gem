'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimelineBar } from '@/components/lens-sim/TimelineBar';
import { ParameterPanel } from '@/components/lens-sim/ParameterPanel';
import {
  createSimulation,
  stepWafer,
  applyPreset,
} from '@/lib/lens-sim';
import type { PresetId, SimulationParams, SimulationState, WaferMetric } from '@/lib/lens-sim';

const LensCrossSectionScene = dynamic(
  () => import('@/components/lens-sim/LensCrossSectionScene').then((m) => ({ default: m.LensCrossSectionScene })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Initializing lens simulation...</p></div> },
);

const WaferImpactMap = dynamic(
  () => import('@/components/lens-sim/WaferImpactMap').then((m) => ({ default: m.WaferImpactMap })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Loading wafer map...</p></div> },
);

export default function LensSimPage() {
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [metric, setMetric] = useState<WaferMetric>('cd');
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentWafer = sim.currentIndex >= 0 ? sim.wafers[sim.currentIndex] ?? null : null;

  // Auto-play interval
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    const ms = Math.max(100, 1200 / speed);
    intervalRef.current = setInterval(() => {
      setSim((prev) => {
        if (prev.currentIndex >= prev.lotSize - 1) {
          setPlaying(false);
          return prev;
        }
        return stepWafer(prev);
      });
    }, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed]);

  const handleStep = useCallback(() => {
    setSim((prev) => stepWafer(prev));
  }, []);

  const handleSeek = useCallback((index: number) => {
    setPlaying(false);
    setSim((prev) => {
      let state = createSimulation(prev.params);
      for (let i = 0; i <= index; i++) {
        state = stepWafer(state);
      }
      return state;
    });
  }, []);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setActivePreset(null);
    setSim(createSimulation());
  }, []);

  const handleParamChange = useCallback((key: keyof SimulationParams, value: number) => {
    setSim((prev) => {
      const newParams = { ...prev.params, [key]: value };
      let state = createSimulation(newParams);
      for (let i = 0; i <= prev.currentIndex; i++) {
        state = stepWafer(state);
      }
      return state;
    });
  }, []);

  const handlePreset = useCallback((id: PresetId) => {
    setActivePreset(id);
    setSim((prev) => applyPreset(prev, id));
  }, []);

  return (
    <div className="relative flex min-h-[calc(100dvh-104px)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_32%),var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      {/* Timeline */}
      <div className="z-10 px-4 pt-3">
        <TimelineBar
          currentIndex={sim.currentIndex}
          lotSize={sim.lotSize}
          playing={playing}
          currentWafer={currentWafer}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onStep={handleStep}
          onSeek={handleSeek}
          onReset={handleReset}
          playbackSpeed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* Split-screen panels */}
      <main className="flex flex-1 gap-1 overflow-hidden px-4 py-2" style={{ minHeight: 480 }}>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(34,211,238,0.15)]" data-testid="lens-cross-section-panel">
          <LensCrossSectionScene wafer={currentWafer} params={sim.params} />
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(34,211,238,0.15)]" data-testid="wafer-impact-panel">
          <WaferImpactMap wafer={currentWafer} metric={metric} onMetricChange={setMetric} />
        </div>
      </main>

      {/* Parameter panel */}
      <div className="z-10 px-4 pb-3">
        <ParameterPanel
          params={sim.params}
          activePreset={activePreset}
          onParamChange={handleParamChange}
          onPreset={handlePreset}
        />
      </div>
    </div>
  );
}
