'use client';

import type { PresetId, SimulationParams } from '@/lib/damascene-sim';
import { PARAM_BOUNDS, PRESETS } from '@/lib/damascene-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof SimulationParams)[] = [
  'appliedCurrent', 'bathTemp', 'additiveConc', 'seedThickness',
  'trenchWidth', 'trenchDepth', 'padPressure', 'padVelocity',
];

const LABELS: Record<string, string> = {
  appliedCurrent: 'Current',
  bathTemp: 'Bath Temp',
  additiveConc: 'Additive',
  seedThickness: 'Seed Thk',
  trenchWidth: 'Trench W',
  trenchDepth: 'Trench D',
  padPressure: 'Pad Press.',
  padVelocity: 'Pad Vel.',
};

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(148,163,184,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 xl:grid-cols-8">
        {SLIDER_KEYS.map((key) => {
          const bounds = PARAM_BOUNDS[key];
          return (
            <label key={key} className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)]">{LABELS[key]}</span>
              <input type="range" min={bounds.min} max={bounds.max} step={bounds.step} value={params[key]} onChange={(e) => onParamChange(key, Number(e.target.value))} className="accent-slate-400" />
              <span className="font-mono text-xs text-[var(--sf-text-secondary)]">{params[key]} {bounds.unit}</span>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
        <span className="text-[10px] uppercase tracking-wider text-[var(--sf-text-muted)] self-center mr-2">What-If</span>
        {PRESETS.map((preset) => (
          <button key={preset.id} type="button" onClick={() => onPreset(preset.id)} className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/10" style={{ borderColor: preset.color, color: preset.color, backgroundColor: activePreset === preset.id ? `color-mix(in srgb, ${preset.color} 18%, transparent)` : 'transparent' }}>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
