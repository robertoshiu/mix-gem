import { SimulatorEngine } from './simulator-engine';
import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';

jest.useFakeTimers();

beforeEach(() => {
  useMesSpcStore.setState({ ...INITIAL_MES_SPC_STATE });
  useMesSpcStore.getState().startProcessing('LOT-2026-001', 'LITHO-193nm-v4');
  // Pre-seed measurements so engine has window data
  useMesSpcStore.setState({ measurements: [] });
});

afterEach(() => {
  jest.clearAllTimers();
});

describe('SimulatorEngine', () => {
  it('adds a measurement after one tick (2000ms)', () => {
    const engine = new SimulatorEngine();
    engine.start();
    jest.advanceTimersByTime(2000);
    expect(useMesSpcStore.getState().measurements.length).toBeGreaterThan(0);
    engine.stop();
  });

  it('adds S6F11 event after one tick', () => {
    const engine = new SimulatorEngine();
    engine.start();
    jest.advanceTimersByTime(2000);
    const events = useMesSpcStore.getState().events;
    expect(events.some((e) => e.type === 's6f11_spc_data')).toBe(true);
    engine.stop();
  });

  it('stops after calling stop()', () => {
    const engine = new SimulatorEngine();
    engine.start();
    engine.stop();
    jest.advanceTimersByTime(10000);
    expect(useMesSpcStore.getState().measurements.length).toBe(0);
  });

  it('stops and sets lot completed when wafer >= 25', () => {
    useMesSpcStore.setState({ waferNumber: 25 });
    const engine = new SimulatorEngine();
    engine.start();
    jest.advanceTimersByTime(2000);
    const state = useMesSpcStore.getState();
    const lot = state.lots.find((l) => l.id === 'LOT-2026-001');
    expect(lot?.status).toBe('completed');
    engine.stop();
  });
});
