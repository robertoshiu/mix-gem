'use client';

import { PARAM_BOUNDS, PRESETS } from '@/lib/oxidation-sim';
import type { PresetId, SimulationParams, OxidationType, GeometryType, SubstrateOrientation } from '@/lib/oxidation-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number | string) => void;
  onPreset: (id: PresetId) => void;
}

const OX_OPTIONS: { value: OxidationType; label: string }[] = [
  { value: 'dry', label: 'Dry O\u2082' },
  { value: 'wet', label: 'Wet O\u2082' },
  { value: 'n2o', label: 'N\u2082O' },
  { value: 'pyrogenic', label: 'Pyrogenic' },
  { value: 'hcl', label: 'HCl' },
  { value: 'hibox', label: 'HIBOX' },
];

const GEO_OPTIONS: { value: GeometryType; label: string }[] = [
  { value: 'blanket', label: 'Blanket' },
  { value: 'locos', label: 'LOCOS' },
  { value: 'sti', label: 'STI' },
];

const ORIENT_OPTIONS: SubstrateOrientation[] = ['100', '110', '111'];

type SliderKey = keyof typeof PARAM_BOUNDS;

const SLIDER_KEYS: SliderKey[] = [
  'peakTemperature', 'rampRate', 'soakTime', 'coolingRate',
  'pressure', 'hclConcentration', 'initialOxideThickness',
  'nitrideMaskWidth', 'trenchDepth', 'trenchWidth', 'lampBalance',
];

const LOG_KEYS = new Set<string>(['rampRate', 'soakTime', 'coolingRate']);

function isSliderVisible(key: SliderKey, params: SimulationParams): boolean {
  switch (key) {
    case 'pressure': return params.oxidationType === 'hibox';
    case 'hclConcentration': return params.oxidationType === 'hcl';
    case 'nitrideMaskWidth': return params.geometryType === 'locos' || params.geometryType === 'sti';
    case 'trenchDepth': return params.geometryType === 'sti';
    case 'trenchWidth': return params.geometryType === 'sti';
    default: return true;
  }
}

function getSliderValue(key: string, params: SimulationParams): number {
  const raw = params[key as keyof SimulationParams] as number;
  if (LOG_KEYS.has(key)) return Math.log10(Math.max(1e-10, raw));
  return raw;
}

function formatValue(key: string, params: SimulationParams): string {
  const raw = params[key as keyof SimulationParams] as number;
  if (LOG_KEYS.has(key)) {
    if (raw >= 1) return `${raw.toFixed(1)}`;
    return `${raw.toFixed(2)}`;
  }
  return `${raw}`;
}

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  const visibleSliders = SLIDER_KEYS.filter(k => isSliderVisible(k, params));

  return (
    <div className="rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-x-6 gap-y-2 sm:grid-cols-15">
        {/* Dropdown: Oxidation Type */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Ambient</span>
          <select
            value={params.oxidationType}
            onChange={(e) => onParamChange('oxidationType', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {OX_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        {/* Dropdown: Geometry Type */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Geometry</span>
          <select
            value={params.geometryType}
            onChange={(e) => onParamChange('geometryType', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {GEO_OPTIONS.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </label>

        {/* Dropdown: Orientation */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Orient</span>
          <select
            value={params.substrateOrientation}
            onChange={(e) => onParamChange('substrateOrientation', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {ORIENT_OPTIONS.map(o => (
              <option key={o} value={o}>&lt;{o}&gt;</option>
            ))}
          </select>
        </label>

        {/* Sliders */}
        {visibleSliders.map((key) => {
          const b = PARAM_BOUNDS[key];
          const isLog = LOG_KEYS.has(key);
          const sliderVal = getSliderValue(key, params);

          return (
            <label key={key} className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
              <span>{b.label}</span>
              <input
                type="range"
                min={b.min}
                max={b.max}
                step={b.step}
                value={sliderVal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onParamChange(key as keyof SimulationParams, isLog ? Math.pow(10, v) : v);
                }}
                className="accent-amber-500"
              />
              <span className="text-[var(--sf-text-muted)]">
                {formatValue(key, params)}{b.unit ? ` ${b.unit}` : ''}
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPreset(p.id)}
            className="rounded-full border px-3 py-1 font-mono text-[10px] transition-colors"
            style={{
              borderColor: p.color,
              backgroundColor: activePreset === p.id ? p.color : 'transparent',
              color: activePreset === p.id ? '#fff' : p.color,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
