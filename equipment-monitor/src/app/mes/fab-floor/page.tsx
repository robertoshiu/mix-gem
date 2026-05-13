'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft } from 'lucide-react';
import { FabFloorScene } from '@/components/babylon/FabFloorScene';
import { ProcessHudPanel } from '@/components/fab-floor/ProcessHudPanel';
import { ProcessPipelineBar } from '@/components/fab-floor/ProcessPipelineBar';
import { useProcessStore } from '@/stores/process-store';
import type { ProcessId } from '@/lib/fab-process-data';

function readInitialProcess(): ProcessId | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('process');
  const ids: ProcessId[] = ['oxidation', 'lithography', 'etching', 'deposition', 'implant', 'diffusion', 'cmp', 'metallization'];
  return ids.includes(value as ProcessId) ? (value as ProcessId) : null;
}

export default function FabFloorPage() {
  const processes = useProcessStore((state) => state.processes);
  const selectedProcess = useProcessStore((state) => state.selectedProcess);
  const panelOpen = useProcessStore((state) => state.panelOpen);
  const selectProcess = useProcessStore((state) => state.selectProcess);
  const clearSelection = useProcessStore((state) => state.clearSelection);
  const tick = useProcessStore((state) => state.tick);
  const process = processes.find((candidate) => candidate.id === selectedProcess) ?? null;

  useEffect(() => {
    const initial = readInitialProcess();
    if (initial) selectProcess(initial);
  }, [selectProcess]);

  useEffect(() => {
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [tick]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--sf-bg-canvas)] text-[var(--sf-text-primary)]">
      <header className="z-30 flex shrink-0 flex-col gap-4 border-b border-[rgba(34,211,238,0.2)] bg-[rgba(2,6,23,0.9)] px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link href="/" className="mb-2 inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--sf-accent-cyan)] hover:text-[var(--sf-text-primary)]">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Command Center
            </Link>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--sf-accent-cyan)]" aria-hidden="true" />
              <h1 className="text-lg font-semibold tracking-[0.22em]">8-PROCESS FAB FLOOR</h1>
            </div>
            <p className="mt-1 text-xs text-[var(--sf-text-secondary)]">Babylon.js U-shape process flow with live FOUP carriers and station HUD drill-downs</p>
          </div>
          <div className="rounded-full border border-[rgba(34,211,238,0.35)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--sf-accent-cyan)]">ESC resets camera · Click station opens HUD</div>
        </div>
        <ProcessPipelineBar processes={processes} activeProcessId={selectedProcess} compact />
      </header>

      <main className="relative flex min-h-[720px] flex-1 overflow-hidden">
        <FabFloorScene processes={processes} selectedProcess={selectedProcess} onSelectProcess={selectProcess} onClearSelection={clearSelection} />
        <ProcessHudPanel process={process} open={panelOpen} onClose={clearSelection} />
        <section aria-label="Fab floor status" className="pointer-events-none absolute inset-x-3 bottom-3 z-20 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {processes.slice(0, 4).map((item) => (
            <button key={item.id} type="button" onClick={() => selectProcess(item.id)} className="pointer-events-auto rounded-2xl border bg-[rgba(17,29,46,0.78)] p-4 text-left shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 motion-reduce:hover:translate-y-0" style={{ borderColor: item.color }}>
              <div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold">{item.name}</span><span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ color: item.color }}>{item.nominalOee.toFixed(1)}%</span></div>
              <p className="font-mono text-xs text-[var(--sf-text-secondary)]">{item.nominalWph} WPH · Q{item.queueDepth}</p>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
