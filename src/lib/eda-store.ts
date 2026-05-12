'use client';

import { create } from 'zustand';
import { EdaSimulator } from './eda-simulator-engine';
import type { EdaStage, FaultType, PipelineRun, SimulatorSpeed, TechNode } from './eda-types';

interface EdaStoreState {
  simulator: EdaSimulator;
  run: PipelineRun;
  selectedStage: EdaStage;
  activeTab: 'inspector' | 'logs' | 'metrics' | 'layers';
  techNode: TechNode;
  selectStage: (stage: EdaStage) => void;
  setActiveTab: (tab: EdaStoreState['activeTab']) => void;
  setTechNode: (techNode: TechNode) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (speed: SimulatorSpeed) => void;
  injectFault: (fault: FaultType, stage: EdaStage) => void;
}

function createSimulator(techNode: TechNode) {
  return new EdaSimulator({ chipName: `ORION-${techNode}-AI-ACCEL`, techNode, seed: 20260512 });
}

const simulator = createSimulator('5nm');

export const useEdaStore = create<EdaStoreState>((set, get) => ({
  simulator,
  run: simulator.getState(),
  selectedStage: 'rtl',
  activeTab: 'inspector',
  techNode: '5nm',
  selectStage: (stage) => set({ selectedStage: stage, activeTab: 'inspector' }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTechNode: (techNode) => {
    get().simulator.dispose();
    const next = createSimulator(techNode);
    next.onTick((run) => set({ run }));
    set({ simulator: next, run: next.getState(), techNode, selectedStage: 'rtl', activeTab: 'inspector' });
  },
  start: () => get().simulator.start(),
  pause: () => get().simulator.pause(),
  reset: () => get().simulator.reset(),
  setSpeed: (speed) => get().simulator.setSpeed(speed),
  injectFault: (fault, stage) => get().simulator.injectFault(fault, stage),
}));

simulator.onTick((run) => useEdaStore.setState({ run }));
