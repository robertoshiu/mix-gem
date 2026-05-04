'use client';

import { useState } from 'react';
import { Zap, X } from 'lucide-react';
import type { FaultConfig, FaultType } from '@/lib/mes-types';

const FAULT_OPTIONS: { value: FaultType; label: string; param: 'cd' | 'cdu' | 'ovl_x' | 'ler' }[] = [
  { value: 'sudden_shift',       label: 'Sudden Shift (CD)',         param: 'cd' },
  { value: 'gradual_drift',      label: 'Gradual Drift (CD)',        param: 'cd' },
  { value: 'increased_variance', label: 'Increased Variance (CDU)',  param: 'cdu' },
  { value: 'overlay_excursion',  label: 'Overlay Excursion (OVL-X)', param: 'ovl_x' },
  { value: 'focus_degradation',  label: 'Focus Degradation (LER)',   param: 'ler' },
];

interface FaultInjectorProps {
  activeFault: FaultConfig | null;
  currentWafer?: number;
  onInject: (fault: FaultConfig) => void;
  onClear: () => void;
}

export function FaultInjector({ activeFault, currentWafer = 1, onInject, onClear }: FaultInjectorProps) {
  const [selected, setSelected] = useState<FaultType>('sudden_shift');

  function handleInject() {
    const option = FAULT_OPTIONS.find((o) => o.value === selected)!;
    onInject({ type: option.value, parameter: option.param, severity: 1.0, startedAtWafer: currentWafer });
  }

  return (
    <div className="bg-[#111D2E] rounded border border-[#1E3A5F] p-3 flex flex-col gap-2">
      <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">Fault Injection</span>

      <select
        className="bg-[#182840] border border-[#1E3A5F] text-[#F1F5F9] text-sm rounded px-2 py-1.5 cursor-pointer focus:outline-none focus:border-[#2563EB]"
        value={selected}
        onChange={(e) => setSelected(e.target.value as FaultType)}
        disabled={!!activeFault}
      >
        {FAULT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {activeFault ? (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-[#F1F5F9] cursor-pointer transition-colors"
          aria-label="Clear fault"
        >
          <X className="w-4 h-4" />
          Clear Fault
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInject}
          className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded text-sm font-semibold bg-[#F47920] hover:bg-[#e06a18] text-white cursor-pointer transition-colors"
          aria-label="Inject fault"
        >
          <Zap className="w-4 h-4" />
          Inject Fault
        </button>
      )}

      {activeFault && (
        <span className="text-xs text-[#F59E0B]">
          Active: {FAULT_OPTIONS.find((o) => o.value === activeFault.type)?.label}
        </span>
      )}
    </div>
  );
}