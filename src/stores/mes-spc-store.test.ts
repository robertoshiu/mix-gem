import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import { MOCK_LOTS, MOCK_RECIPES, generateSeedMeasurements } from '@/lib/mes-mock-data';
import type { SpcViolation, SecsEvent } from '@/lib/mes-types';

beforeEach(() => {
  useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
});

describe('initial state', () => {
  it('has empty measurements', () => {
    expect(useMesSpcStore.getState().measurements).toHaveLength(0);
  });

  it('has equipmentState idle', () => {
    expect(useMesSpcStore.getState().equipmentState).toBe('idle');
  });
});

describe('startProcessing', () => {
  it('sets activeLotId and equipmentState to processing', () => {
    useMesSpcStore.getState().startProcessing('LOT-2026-001', 'LITHO-193nm-v4');
    const state = useMesSpcStore.getState();
    expect(state.activeLotId).toBe('LOT-2026-001');
    expect(state.equipmentState).toBe('processing');
  });
});

describe('addMeasurement', () => {
  it('appends measurement to array', () => {
    const m = generateSeedMeasurements('LOT-2026-001', 1)[0];
    useMesSpcStore.getState().addMeasurement(m);
    expect(useMesSpcStore.getState().measurements).toHaveLength(1);
  });
});

describe('addViolation', () => {
  it('appends violation and sets equipmentState to inhibited', () => {
    const v: SpcViolation = {
      id: 'v1', lotId: 'LOT-2026-001', waferNumber: 5,
      parameter: 'cd', rule: 'rule_1', value: 49.0, limit: 48.0,
      acknowledged: false, timestamp: new Date(),
    };
    useMesSpcStore.getState().addViolation(v);
    const state = useMesSpcStore.getState();
    expect(state.violations).toHaveLength(1);
    expect(state.equipmentState).toBe('inhibited');
  });
});

describe('acknowledgeViolation', () => {
  it('marks violation acknowledged and resets equipmentState', () => {
    const v: SpcViolation = {
      id: 'v1', lotId: 'LOT-2026-001', waferNumber: 5,
      parameter: 'cd', rule: 'rule_1', value: 49.0, limit: 48.0,
      acknowledged: false, timestamp: new Date(),
    };
    useMesSpcStore.setState({ violations: [v], equipmentState: 'inhibited' });
    useMesSpcStore.getState().acknowledgeViolation('v1');
    const state = useMesSpcStore.getState();
    expect(state.violations[0].acknowledged).toBe(true);
    expect(state.equipmentState).toBe('processing');
  });
});

describe('addEvent', () => {
  it('caps events at 100', () => {
    const store = useMesSpcStore.getState();
    for (let i = 0; i < 105; i++) {
      const e: SecsEvent = {
        id: `e${i}`, type: 's6f11_spc_data', label: `event ${i}`,
        timestamp: new Date(), secsMessage: {},
      };
      store.addEvent(e);
    }
    expect(useMesSpcStore.getState().events).toHaveLength(100);
  });
});

describe('injectFault / clearFault', () => {
  it('sets and clears activeFault', () => {
    useMesSpcStore.getState().injectFault({ type: 'sudden_shift', parameter: 'cd', severity: 1.0, startedAtWafer: 5 });
    expect(useMesSpcStore.getState().activeFault).not.toBeNull();
    useMesSpcStore.getState().clearFault();
    expect(useMesSpcStore.getState().activeFault).toBeNull();
  });
});
