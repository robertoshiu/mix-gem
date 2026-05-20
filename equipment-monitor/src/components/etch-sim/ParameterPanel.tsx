'use client';

import { PARAM_BOUNDS, PRESETS } from '@/lib/etch-sim';
import type { PresetId, SimulationParams } from '@/lib/etch-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof typeof PARAM_BOUNDS)[] = [
  'icpPower', 'biasPower', 'chamberPressure', 'cf4Flow',
  'o2Flow', 'chuckTemp', 'trenchWidth', 'aspectRatio',
];

const SLIDER_LABELS: Record<string, string> = {
  icpPower: 'ICP Power',
  biasPower: 'Bias Power',
  chamberPressure: 'Pressure',
  cf4Flow: 'CF\u2084 Flow',
  o2Flow: 'O\u2082 Flow',
  chuckTemp: 'Chuck Temp',
  trenchWidth: 'Trench W',
  aspectRatio: 'Aspect Ratio',
};

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(168,85,247,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-x-6 gap-y-2 sm:grid-cols-8">
        {SLIDER_KEYS.map((key) => {
          const b = PARAM_BOUNDS[key];
          const val = params[key];
          return (
            <label key={key} className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
              <span>{SLIDER_LABELS[key]}</span>
              <input type="range" min={b.min} max={b.max} step={b.step} value={val} onChange={(e) => onParamChange(key, Number(e.target.value))} className="accent-purple-500" />
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
