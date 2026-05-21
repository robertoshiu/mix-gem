'use client';

import { PARAM_BOUNDS, PRESETS } from '@/lib/cmp-sim';
import type { PresetId, SimulationParams } from '@/lib/cmp-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof typeof PARAM_BOUNDS)[] = [
  'downForce', 'waferRpm', 'platenRpm', 'slurryFlow', 'abrasiveConc',
  'slurryPh', 'padStiffness', 'asperityDensity', 'cuThickness', 'patternDensity',
];

const SLIDER_LABELS: Record<string, string> = {
  downForce: 'Down-Force',
  waferRpm: 'Wafer RPM',
  platenRpm: 'Platen RPM',
  slurryFlow: 'Slurry Flow',
  abrasiveConc: 'Abrasive %',
  slurryPh: 'Slurry pH',
  padStiffness: 'Pad Stiffness',
  asperityDensity: 'Asperity \u03B7',
  cuThickness: 'Cu Thick',
  patternDensity: 'Pattern \u03C1',
};

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-x-6 gap-y-2 sm:grid-cols-10">
        {SLIDER_KEYS.map((key) => {
          const b = PARAM_BOUNDS[key];
          const val = params[key as keyof SimulationParams];
          return (
            <label key={key} className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
              <span>{SLIDER_LABELS[key]}</span>
              <input type="range" min={b.min} max={b.max} step={b.step} value={val} onChange={(e) => onParamChange(key as keyof SimulationParams, Number(e.target.value))} className="accent-amber-500" />
              <span className="text-[var(--sf-text-muted)]">{val}{b.unit ? ` ${b.unit}` : ''}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => onPreset(p.id)} className="rounded-full border px-3 py-1 font-mono text-[10px] transition-colors" style={{ borderColor: p.color, backgroundColor: activePreset === p.id ? p.color : 'transparent', color: activePreset === p.id ? '#fff' : p.color }}>
            {p.label} {p.labelCN}
          </button>
        ))}
      </div>
    </div>
  );
}
