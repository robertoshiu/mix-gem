'use client';

import { create } from 'zustand';
import {
  calculateFabKpis,
  createInitialProcesses,
  simulateProcesses,
  type FabKpis,
  type FabProcess,
  type ProcessId,
} from '@/lib/fab-process-data';

interface CameraTarget {
  position: [number, number, number];
  radius: number;
}

interface ProcessStore {
  processes: FabProcess[];
  selectedProcess: ProcessId | null;
  panelOpen: boolean;
  cameraTarget: CameraTarget | null;
  fabKpis: FabKpis;
  selectProcess: (id: ProcessId) => void;
  clearSelection: () => void;
  tick: () => void;
}

const initialProcesses = createInitialProcesses();

export const useProcessStore = create<ProcessStore>((set, get) => ({
  processes: initialProcesses,
  selectedProcess: null,
  panelOpen: false,
  cameraTarget: null,
  fabKpis: calculateFabKpis(initialProcesses),
  selectProcess: (id) => {
    const process = get().processes.find((candidate) => candidate.id === id);
    set({
      selectedProcess: id,
      panelOpen: true,
      cameraTarget: process ? { position: process.position, radius: 11 } : null,
    });
  },
  clearSelection: () => set({ selectedProcess: null, panelOpen: false, cameraTarget: null }),
  tick: () =>
    set((state) => {
      const processes = simulateProcesses(state.processes);
      return { processes, fabKpis: calculateFabKpis(processes) };
    }),
}));
