'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimelineBar } from '@/components/damascene-sim/TimelineBar';
import { ParameterPanel } from '@/components/damascene-sim/ParameterPanel';
import {
  createSimulation,
  stepForward,
  stepN,
  applyPreset,
} from '@/lib/damascene-sim';
import type { PresetId, SimulationParams, SimulationState, WaferMetric } from '@/lib/damascene-sim';

const ElectroplatingScene = dynamic(
  () => import('@/components/damascene-sim/ElectroplatingScene').then((m) => ({ default: m.ElectroplatingScene })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Initializing electroplating simulation...</p></div> },
);

const WaferMetricsPanel = dynamic(
  () => import('@/components/damascene-sim/WaferMetricsPanel').then((m) => ({ default: m.WaferMetricsPanel })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center bg-[var(--sf-bg-canvas)]"><p className="animate-pulse font-mono text-sm text-[var(--sf-text-muted)] motion-reduce:animate-none">Loading wafer metrics...</p></div> },
);

export default function DamasceneSimPage() {
  const [sim, setSim] = useState<SimulationState>(() => createSimulation());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [metric, setMetric] = useState<WaferMetric>('thickness');
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = sim.currentIndex >= 0 ? sim.steps[sim.currentIndex] ?? null : null;

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    const ms = Math.max(50, 600 / speed);
    intervalRef.current = setInterval(() => {
      setSim((prev) => {
        if (prev.currentIndex >= prev.totalSteps - 1) {
          setPlaying(false);
          return prev;
        }
        return stepForward(prev);
      });
    }, ms);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed]);

  const handleStep = useCallback(() => {
    setSim((prev) => stepForward(prev));
  }, []);

  const handleSeek = useCallback((index: number) => {
    setPlaying(false);
    setSim((prev) => {
      if (index < 0) return createSimulation(prev.params);
      let state = createSimulation(prev.params);
      state = stepN(state, index + 1);
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
      if (prev.currentIndex >= 0) {
        state = stepN(state, prev.currentIndex + 1);
      }
      return state;
    });
  }, []);

  const handlePreset = useCallback((id: PresetId) => {
    setActivePreset(id);
    setSim((prev) => applyPreset(prev, id));
  }, []);

  return (
    <div className="relative flex min-h-[calc(100dvh-104px)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.10),transparent_32%),var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      <div className="z-10 px-4 pt-3">
        <TimelineBar
          backHref="/mes/fab-floor/metallization"
          currentIndex={sim.currentIndex}
          totalSteps={sim.totalSteps}
          playing={playing}
          currentStep={currentStep}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onStep={handleStep}
          onSeek={handleSeek}
          onReset={handleReset}
          playbackSpeed={speed}
          onSpeedChange={setSpeed}
        />
      </div>

      <main className="flex flex-1 gap-1 overflow-hidden px-4 py-2" style={{ minHeight: 480 }}>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.15)]" data-testid="electroplating-scene-panel">
          <ElectroplatingScene step={currentStep} params={sim.params} />
        </div>
        <div className="flex-1 overflow-hidden rounded-2xl border border-[rgba(148,163,184,0.15)]" data-testid="wafer-metrics-panel">
          <WaferMetricsPanel steps={sim.steps} currentStep={currentStep} metric={metric} onMetricChange={setMetric} />
        </div>
      </main>

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
