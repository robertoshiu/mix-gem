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

  it('resumes GEM state from PAUSED to EXECUTING after violation acknowledgment', () => {
    const engine = new SimulatorEngine();
    useMesSpcStore.getState().injectFault({
      type: 'sudden_shift',
      parameter: 'cd',
      severity: 2,
      startedAtWafer: 1,
    });

    engine.start();
    jest.advanceTimersByTime(2000);

    const pausedState = useMesSpcStore.getState();
    const violation = pausedState.violations.find((v) => !v.acknowledged);
    expect(violation).toBeDefined();
    expect(pausedState.gemState).toBe('PAUSED');
    expect(pausedState.waferNumber).toBe(2);
    const stopEvents = pausedState.events.filter((e) => e.type === 's2f41_stop');
    expect(stopEvents).toHaveLength(1);
    expect(stopEvents[0].secsMessage.params).toEqual([
      { cpname: 'REASON', cpval: `SPC_VIOLATION:${violation!.parameter}:${violation!.rule}` },
    ]);

    pausedState.acknowledgeViolation(violation!.id);
    pausedState.clearFault();
    pausedState.activeAlarms.forEach((alarm) => pausedState.acknowledgeAlarm(alarm.id));

    engine.start();

    expect(useMesSpcStore.getState().gemState).toBe('EXECUTING');
    expect(useMesSpcStore.getState().stateHistory.at(-1)?.to).toBe('EXECUTING');
    expect(useMesSpcStore.getState().events.filter((e) => e.type === 's2f41_resume')).toHaveLength(1);

    jest.advanceTimersByTime(2000);
    const resumedState = useMesSpcStore.getState();
    expect(resumedState.gemState).toBe('EXECUTING');
    expect(resumedState.violations.filter((v) => !v.acknowledged)).toHaveLength(0);
    expect(resumedState.events.filter((e) => e.type === 's2f41_stop')).toHaveLength(1);
    engine.stop();
  });
});
