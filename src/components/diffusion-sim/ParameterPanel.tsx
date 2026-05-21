'use client';

import { PARAM_BOUNDS, PRESETS, DOPANT_DB, THERMAL_MODES } from '@/lib/diffusion-sim';
import type { PresetId, SimulationParams, DopantSpecies, ThermalMode, AmbientGas, SubstrateOrientation } from '@/lib/diffusion-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number | string) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof typeof PARAM_BOUNDS)[] = [
  'peakTemperature', 'rampRate', 'soakTime', 'coolingRate',
  'initialDose', 'initialDepth', 'screenOxideThickness', 'backgroundDoping',
  'interstitialFactor', 'vacancyFactor', 'clusteringThreshold',
];

const DOPANT_OPTIONS: DopantSpecies[] = ['B', 'P', 'As', 'Sb', 'In', 'Ge'];
const MODE_OPTIONS: ThermalMode[] = ['furnace', 'rta', 'spike', 'flash', 'laser'];
const GAS_OPTIONS: AmbientGas[] = ['N2', 'O2', 'N2O2'];
const ORIENT_OPTIONS: SubstrateOrientation[] = ['100', '110', '111'];

const LOG_KEYS = new Set(['rampRate', 'soakTime', 'coolingRate', 'initialDose', 'backgroundDoping', 'clusteringThreshold']);

function getSliderValue(key: string, params: SimulationParams): number {
  const raw = params[key as keyof SimulationParams] as number;
  if (LOG_KEYS.has(key)) return Math.log10(Math.max(1e-10, raw));
  return raw;
}

function formatValue(key: string, params: SimulationParams): string {
  const raw = params[key as keyof SimulationParams] as number;
  if (LOG_KEYS.has(key)) {
    const exp = Math.log10(Math.max(1e-10, raw));
    return `1e${exp.toFixed(1)}`;
  }
  return `${raw}`;
}

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-x-6 gap-y-2 sm:grid-cols-15">
        {/* Dropdown: Dopant Species */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Dopant</span>
          <select
            value={params.dopantSpecies}
            onChange={(e) => onParamChange('dopantSpecies', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {DOPANT_OPTIONS.map(s => (
              <option key={s} value={s}>{DOPANT_DB[s].symbol}</option>
            ))}
          </select>
        </label>

        {/* Dropdown: Thermal Mode */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Mode</span>
          <select
            value={params.thermalMode}
            onChange={(e) => onParamChange('thermalMode', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {MODE_OPTIONS.map(m => (
              <option key={m} value={m}>{THERMAL_MODES[m].label}</option>
            ))}
          </select>
        </label>

        {/* Dropdown: Ambient Gas */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Ambient</span>
          <select
            value={params.ambientGas}
            onChange={(e) => onParamChange('ambientGas', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-amber-500"
          >
            {GAS_OPTIONS.map(g => (
              <option key={g} value={g}>{g === 'N2O2' ? 'N\u2082+O\u2082' : g === 'N2' ? 'N\u2082' : 'O\u2082'}</option>
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

        {/* 11 Sliders */}
        {SLIDER_KEYS.map((key) => {
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
