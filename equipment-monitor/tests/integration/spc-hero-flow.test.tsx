import { useMesSpcStore, INITIAL_MES_SPC_STATE } from '@/stores/mes-spc-store';
import type { SpcViolation, FaultConfig } from '@/lib/mes-types';

beforeEach(() => {
  useMesSpcStore.setState(INITIAL_MES_SPC_STATE);
});

describe('SPC Hero Flow', () => {
  it('initializes with 3 lots and 3 recipes', () => {
    const { lots, recipes } = useMesSpcStore.getState();
    expect(lots).toHaveLength(3);
    expect(recipes).toHaveLength(3);
  });

  it('injects fault and registers activeFault in store', () => {
    const store = useMesSpcStore.getState();
    const fault: FaultConfig = {
      type: 'sudden_shift',
      parameter: 'cd',
      severity: 1.0,
      startedAtWafer: 5,
    };
    store.injectFault(fault);
    expect(useMesSpcStore.getState().activeFault).toEqual(fault);
  });

  it('full acknowledge flow resets equipment from inhibited to processing', () => {
    const store = useMesSpcStore.getState();

    // Start processing
    store.startProcessing('LOT-2026-001', 'LITHO-193nm-v4');
    let state = useMesSpcStore.getState();
    expect(state.activeLotId).toBe('LOT-2026-001');
    expect(state.equipmentState).toBe('processing');

    // Add violation — equipment becomes inhibited
    const violation: SpcViolation = {
      id: 'v1',
      lotId: 'LOT-2026-001',
      waferNumber: 5,
      parameter: 'cd',
      rule: 'rule_1',
      value: 49.0,
      limit: 48.0,
      acknowledged: false,
      timestamp: new Date(),
    };
    store.addViolation(violation);
    state = useMesSpcStore.getState();
    expect(state.violations).toHaveLength(1);
    expect(state.equipmentState).toBe('inhibited');

    // Acknowledge violation — equipment resumes processing
    store.acknowledgeViolation('v1');
    state = useMesSpcStore.getState();
    expect(state.violations[0].acknowledged).toBe(true);
    expect(state.equipmentState).toBe('processing');
  });
});
