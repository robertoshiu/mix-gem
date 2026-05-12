import { EdaSimulator } from './eda-simulator-engine';

describe('EdaSimulator', () => {
  it('starts the RTL stage and advances metrics on tick', () => {
    const simulator = new EdaSimulator({ chipName: 'TEST-CHIP', techNode: '7nm', seed: 42 });

    simulator.tick();

    const state = simulator.getState();
    expect(state.currentStage).toBe('rtl');
    expect(state.stages[0].progress).toBeGreaterThan(0);
    expect(state.stages[0].logs.length).toBeGreaterThan(0);
  });

  it('injects a congestion fault and retries place and route before completion', () => {
    const simulator = new EdaSimulator({ chipName: 'TEST-CHIP', techNode: '7nm', seed: 7 });
    simulator.injectFault('congestion_hotspot', 'place_route');

    for (let index = 0; index < 160; index += 1) simulator.tick();

    const placeRoute = simulator.getState().stages.find((stage) => stage.stage === 'place_route');
    expect(placeRoute?.retries).toBeGreaterThanOrEqual(1);
    expect(placeRoute?.status === 'warning' || placeRoute?.status === 'completed').toBe(true);
  });

  it('emits snapshots to subscribers', () => {
    const simulator = new EdaSimulator({ chipName: 'TEST-CHIP', techNode: '5nm', seed: 11 });
    const states: string[] = [];

    const unsubscribe = simulator.onTick((state) => states.push(state.currentStage ?? 'none'));
    simulator.tick();
    unsubscribe();
    simulator.tick();

    expect(states).toEqual(['none', 'rtl']);
  });
});
