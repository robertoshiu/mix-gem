'use client';

import { PARAM_BOUNDS, PRESETS, ION_DB } from '@/lib/implant-sim';
import type { PresetId, SimulationParams, IonSpecies, CrystalOrientation } from '@/lib/implant-sim';

interface ParameterPanelProps {
  params: SimulationParams;
  activePreset: PresetId | null;
  onParamChange: (key: keyof SimulationParams, value: number | string) => void;
  onPreset: (id: PresetId) => void;
}

const SLIDER_KEYS: (keyof typeof PARAM_BOUNDS)[] = [
  'beamEnergy', 'dose', 'beamCurrent', 'tiltAngle', 'twistAngle',
  'screenOxideThickness', 'photoresistThickness', 'substrateTemperature',
  'amorphizationThreshold', 'damageAnnealingRate',
];

const ION_OPTIONS: IonSpecies[] = ['B', 'P', 'As', 'BF2'];
const CRYSTAL_OPTIONS: CrystalOrientation[] = ['100', '110', '111'];

export function ParameterPanel({ params, activePreset, onParamChange, onPreset }: ParameterPanelProps) {
  return (
    <div className="rounded-2xl border border-[rgba(6,182,212,0.2)] bg-[rgba(2,6,23,0.8)] px-4 py-3 backdrop-blur-xl">
      <div className="grid grid-cols-6 gap-x-6 gap-y-2 sm:grid-cols-12">
        {/* Dropdown: Ion Species */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Ion Species</span>
          <select
            value={params.ionSpecies}
            onChange={(e) => onParamChange('ionSpecies', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-cyan-500"
          >
            {ION_OPTIONS.map(s => (
              <option key={s} value={s}>{ION_DB[s].symbol}</option>
            ))}
          </select>
        </label>

        {/* Dropdown: Crystal Orientation */}
        <label className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
          <span>Crystal</span>
          <select
            value={params.crystalOrientation}
            onChange={(e) => onParamChange('crystalOrientation', e.target.value)}
            className="rounded bg-white/10 px-1 py-0.5 text-[10px] accent-cyan-500"
          >
            {CRYSTAL_OPTIONS.map(o => (
              <option key={o} value={o}>&lt;{o}&gt;</option>
            ))}
          </select>
        </label>

        {/* 10 Sliders */}
        {SLIDER_KEYS.map((key) => {
          const b = PARAM_BOUNDS[key];
          const isDose = key === 'dose';
          const rawVal = isDose ? Math.log10(params.dose) : params[key as keyof SimulationParams] as number;

          return (
            <label key={key} className="flex flex-col gap-0.5 font-mono text-[10px] text-[var(--sf-text-secondary)]">
              <span>{b.label}</span>
              <input
                type="range"
                min={b.min}
                max={b.max}
                step={isDose ? 0.5 : b.step}
                value={rawVal}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onParamChange(key as keyof SimulationParams, isDose ? Math.pow(10, v) : v);
                }}
                className="accent-cyan-500"
              />
              <span className="text-[var(--sf-text-muted)]">
                {isDose ? `1e${Math.log10(params.dose).toFixed(0)}` : `${rawVal}`}{b.unit ? ` ${b.unit}` : ''}
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
