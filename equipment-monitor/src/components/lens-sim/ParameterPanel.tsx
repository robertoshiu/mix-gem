'use client';

import { PARAM_BOUNDS, PRESETS } from '@/lib/lens-sim';
import type { PresetId, SimulationParams } from '@/lib/lens-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: Array<{ key: keyof SimulationParams; label: string; labelCN: string }> = [
  { key: 'dose', label: 'Dose', labelCN: '\u5242\u91CF' },
  { key: 'scanSpeed', label: 'Scan Speed', labelCN: '\u626B\u63CF\u901F\u5EA6' },
  { key: 'coolingPower', label: 'Cooling', labelCN: '\u51B7\u5374\u529F\u7387' },
  { key: 'fluidFlowRate', label: 'Flow Rate', labelCN: '\u6D41\u91CF' },
  { key: 'resistThickness', label: 'Resist', labelCN: '\u5149\u963B\u539A\u5EA6' },
  { key: 'ambientTemp', label: 'Ambient', labelCN: '\u73AF\u5883\u6E29\u5EA6' },
];

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(34,211,238,0.22)] bg-[rgba(8,18,31,0.82)] p-3 backdrop-blur-xl">
      {/* Sliders */}
      <div className="mb-3 grid grid-cols-3 gap-x-6 gap-y-2 xl:grid-cols-6">
        {SLIDER_KEYS.map(({ key, label, labelCN }) => {
          const bounds = PARAM_BOUNDS[key] as { min: number; max: number; default: number; step: number; unit: string; displayScale?: number };
          const displayValue = bounds.displayScale
            ? (params[key] * bounds.displayScale).toFixed(0)
            : params[key].toFixed(key === 'ambientTemp' ? 1 : key === 'fluidFlowRate' ? 1 : 0);

          return (
            <label key={key} className="flex flex-col gap-0.5">
              <span className="font-mono text-[10px] text-[var(--sf-text-muted)]">
                {label} <span className="text-[var(--sf-text-muted)]/60">({labelCN})</span>
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={params[key]}
                  onChange={(e) => onParamChange(key, Number(e.target.value))}
                  onDoubleClick={() => onParamChange(key, bounds.default)}
                  className="h-1 flex-1 cursor-pointer accent-[var(--sf-accent-cyan)]"
                />
                <span className="w-16 text-right font-mono text-[11px] text-white">
                  {displayValue}{bounds.unit}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {/* What-If presets */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--sf-text-muted)]">
          What-If
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPreset(preset.id)}
            className="rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors"
            style={{
              borderColor: activePreset === preset.id ? preset.color : 'rgba(255,255,255,0.1)',
              backgroundColor: activePreset === preset.id ? `${preset.color}20` : 'transparent',
              color: activePreset === preset.id ? preset.color : 'var(--sf-text-secondary)',
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
