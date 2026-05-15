import {
  DYNAMIC_ZONES,
  INITIAL_EQUIPMENT,
  INITIAL_PERSONNEL,
  RESTRICTED_ZONES,
  useArTrackingStore,
} from '@/stores/ar-tracking-store';

beforeEach(() => {
  useArTrackingStore.setState({
    personnel: INITIAL_PERSONNEL.map((person) => ({ ...person })),
    equipment: INITIAL_EQUIPMENT.map((item) => ({ ...item })),
    alerts: [],
    pipTarget: null,
    focusPersonnelId: null,
    recipeStates: Object.fromEntries(DYNAMIC_ZONES.map((zone) => [zone.id, 'idle' as const])),
  });
});

describe('initial state', () => {
  it('has 4 personnel in normal status', () => {
    const state = useArTrackingStore.getState();
    expect(state.personnel).toHaveLength(4);
    state.personnel.forEach((person) => expect(person.status).toBe('normal'));
  });

  it('starts personnel in idle state with zero timers', () => {
    const state = useArTrackingStore.getState();
    state.personnel.forEach((person) => {
      expect(person.state).toBe('idle');
      expect(person.stateTimer).toBe(0);
    });
  });

  it('has 8 equipment bays in idle state', () => {
    const equipment = useArTrackingStore.getState().equipment;
    expect(equipment).toHaveLength(8);
    expect(equipment.map((item) => item.bay)).toEqual([
      'Litho Bay',
      'Etch Bay',
      'Diffusion Bay',
      'Metrology',
      'CMP Bay',
      'Implant',
      'Stocker',
      'Photo Track',
    ]);
    equipment.forEach((item) => {
      expect(item.state).toBe('idle');
      expect(item.stateTimer).toBe(0);
    });
  });

  it('starts with no PiP target', () => {
    expect(useArTrackingStore.getState().pipTarget).toBeNull();
  });

  it('has all recipe states idle', () => {
    const states = useArTrackingStore.getState().recipeStates;
    expect(states['IMPLANT-BEAM']).toBe('idle');
    expect(states['LITHO-EUV']).toBe('idle');
  });

  it('has 2 permanent restricted zones', () => {
    expect(RESTRICTED_ZONES).toHaveLength(2);
    expect(RESTRICTED_ZONES.map((zone) => zone.id)).toEqual(['HV-ZONE', 'CHEM-STORE']);
  });

  it('has 2 dynamic zones', () => {
    expect(DYNAMIC_ZONES).toHaveLength(2);
    expect(DYNAMIC_ZONES.map((zone) => zone.id)).toEqual(['IMPLANT-BEAM', 'LITHO-EUV']);
  });
});

describe('PiP actions', () => {
  it('openPip sets pipTarget', () => {
    useArTrackingStore.getState().openPip('OP-01');
    expect(useArTrackingStore.getState().pipTarget).toBe('OP-01');
  });

  it('closePip clears pipTarget', () => {
    useArTrackingStore.getState().openPip('OP-01');
    useArTrackingStore.getState().closePip();
    expect(useArTrackingStore.getState().pipTarget).toBeNull();
  });

  it('switchPipTarget changes target', () => {
    useArTrackingStore.getState().openPip('OP-01');
    useArTrackingStore.getState().switchPipTarget('OP-03');
    expect(useArTrackingStore.getState().pipTarget).toBe('OP-03');
  });
});

describe('triggerAlert auto-opens PiP', () => {
  it('auto-opens PiP on first alert when pipTarget is null', () => {
    useArTrackingStore.getState().triggerAlert('OP-02', 'HV-ZONE');
    const state = useArTrackingStore.getState();
    expect(state.alerts).toHaveLength(1);
    expect(state.pipTarget).toBe('OP-02');
  });

  it('does not change pipTarget if already set', () => {
    useArTrackingStore.getState().openPip('OP-01');
    useArTrackingStore.getState().triggerAlert('OP-02', 'HV-ZONE');
    expect(useArTrackingStore.getState().pipTarget).toBe('OP-01');
  });

  it('starts alerts with info severity', () => {
    useArTrackingStore.getState().triggerAlert('OP-01', 'HV-ZONE');
    expect(useArTrackingStore.getState().alerts[0].severity).toBe('info');
  });
});

describe('personnel behavior state', () => {
  it("setPersonnelState('OP-01', 'observing') changes state and resets the timer", () => {
    useArTrackingStore.getState().tickPersonnelTimers(2_000);
    useArTrackingStore.getState().setPersonnelState('OP-01', 'observing');
    const person = useArTrackingStore.getState().personnel.find((item) => item.id === 'OP-01');
    expect(person?.state).toBe('observing');
    expect(person?.stateTimer).toBe(0);
  });

  it("setPersonnelState('OP-01', 'patrolling') changes back from observing", () => {
    useArTrackingStore.getState().setPersonnelState('OP-01', 'observing');
    useArTrackingStore.getState().tickPersonnelTimers(1_500);
    useArTrackingStore.getState().setPersonnelState('OP-01', 'patrolling');
    const person = useArTrackingStore.getState().personnel.find((item) => item.id === 'OP-01');
    expect(person?.state).toBe('patrolling');
    expect(person?.stateTimer).toBe(0);
  });

  it('tracks multiple personnel state changes independently', () => {
    useArTrackingStore.getState().setPersonnelState('OP-01', 'observing');
    useArTrackingStore.getState().setPersonnelState('OP-02', 'avoiding');

    const state = useArTrackingStore.getState();
    expect(state.personnel.find((item) => item.id === 'OP-01')?.state).toBe('observing');
    expect(state.personnel.find((item) => item.id === 'OP-01')?.stateTimer).toBe(0);
    expect(state.personnel.find((item) => item.id === 'OP-02')?.state).toBe('avoiding');
    expect(state.personnel.find((item) => item.id === 'OP-02')?.stateTimer).toBe(0);
    expect(state.personnel.find((item) => item.id === 'OP-03')?.state).toBe('idle');
  });

  it('tickPersonnelTimers advances timers in seconds', () => {
    useArTrackingStore.getState().tickPersonnelTimers(2_500);
    const person = useArTrackingStore.getState().personnel.find((item) => item.id === 'OP-02');
    expect(person?.stateTimer).toBe(2.5);
  });

  it('tickPersonnelTimers advances timers and escalates severity thresholds', () => {
    useArTrackingStore.getState().setPersonnelZoneStatus('OP-01', 'HV-ZONE');
    useArTrackingStore.getState().triggerAlert('OP-01', 'HV-ZONE');
    useArTrackingStore.getState().tickPersonnelTimers(3_000);
    expect(useArTrackingStore.getState().alerts[0].severity).toBe('info');

    useArTrackingStore.getState().tickPersonnelTimers(3_000);
    expect(useArTrackingStore.getState().alerts[0].severity).toBe('warning');

    useArTrackingStore.getState().tickPersonnelTimers(11_000);
    expect(useArTrackingStore.getState().alerts[0].severity).toBe('critical');
  });
});

describe('equipment state', () => {
  it("setEquipmentState('IMPLANT', 'warmup') resets the timer", () => {
    useArTrackingStore.getState().tickEquipmentTimers(3_000);
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'warmup');
    const equipment = useArTrackingStore.getState().equipment.find((item) => item.id === 'IMPLANT');
    expect(equipment?.state).toBe('warmup');
    expect(equipment?.stateTimer).toBe(0);
  });

  it("setEquipmentState('IMPLANT', 'running') changes from warmup", () => {
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'warmup');
    useArTrackingStore.getState().tickEquipmentTimers(750);
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'running');
    const equipment = useArTrackingStore.getState().equipment.find((item) => item.id === 'IMPLANT');
    expect(equipment?.state).toBe('running');
    expect(equipment?.stateTimer).toBe(0);
  });

  it("setEquipmentState('IMPLANT', 'cooldown') changes from running", () => {
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'running');
    useArTrackingStore.getState().tickEquipmentTimers(750);
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'cooldown');
    const equipment = useArTrackingStore.getState().equipment.find((item) => item.id === 'IMPLANT');
    expect(equipment?.state).toBe('cooldown');
    expect(equipment?.stateTimer).toBe(0);
  });

  it("setEquipmentState('IMPLANT', 'idle') returns to idle", () => {
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'warmup');
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'running');
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'cooldown');
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'idle');
    const equipment = useArTrackingStore.getState().equipment.find((item) => item.id === 'IMPLANT');
    expect(equipment?.state).toBe('idle');
    expect(equipment?.stateTimer).toBe(0);
  });

  it('supports the full equipment lifecycle idle → warmup → running → cooldown → idle', () => {
    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'warmup');
    expect(useArTrackingStore.getState().equipment.find((item) => item.id === 'IMPLANT')?.state).toBe('warmup');

    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'running');
    expect(useArTrackingStore.getState().equipment.find((item) => item.id === 'IMPLANT')?.state).toBe('running');

    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'cooldown');
    expect(useArTrackingStore.getState().equipment.find((item) => item.id === 'IMPLANT')?.state).toBe('cooldown');

    useArTrackingStore.getState().setEquipmentState('IMPLANT', 'idle');
    expect(useArTrackingStore.getState().equipment.find((item) => item.id === 'IMPLANT')?.state).toBe('idle');
  });

  it('tickEquipmentTimers advances equipment timers in seconds', () => {
    useArTrackingStore.getState().tickEquipmentTimers(2_000);
    const equipment = useArTrackingStore.getState().equipment.find((item) => item.id === 'IMPLANT');
    expect(equipment?.stateTimer).toBe(2);
  });
});

describe('recipe states', () => {
  it('setRecipeState changes a zone to running', () => {
    useArTrackingStore.getState().setRecipeState('IMPLANT-BEAM', 'running');
    expect(useArTrackingStore.getState().recipeStates['IMPLANT-BEAM']).toBe('running');
    expect(useArTrackingStore.getState().recipeStates['LITHO-EUV']).toBe('idle');
  });

  it('setRecipeState changes a zone back to idle', () => {
    useArTrackingStore.getState().setRecipeState('LITHO-EUV', 'running');
    useArTrackingStore.getState().setRecipeState('LITHO-EUV', 'idle');
    expect(useArTrackingStore.getState().recipeStates['LITHO-EUV']).toBe('idle');
  });
});

describe('zone collision with dynamic zones', () => {
  it('setPersonnelZoneStatus works for dynamic zone IDs', () => {
    useArTrackingStore.getState().setPersonnelZoneStatus('OP-01', 'IMPLANT-BEAM');
    const person = useArTrackingStore.getState().personnel.find((item) => item.id === 'OP-01');
    expect(person?.inZone).toBe('IMPLANT-BEAM');
    expect(person?.status).toBe('violation');
  });
});

describe('existing actions still work', () => {
  it('acknowledgeAlert marks alert acknowledged', () => {
    useArTrackingStore.getState().triggerAlert('OP-01', 'HV-ZONE');
    const alertId = useArTrackingStore.getState().alerts[0].id;
    useArTrackingStore.getState().acknowledgeAlert(alertId);
    expect(useArTrackingStore.getState().alerts[0].acknowledged).toBe(true);
  });

  it('focusPersonnel and clearFocusPersonnel', () => {
    useArTrackingStore.getState().focusPersonnel('OP-03');
    expect(useArTrackingStore.getState().focusPersonnelId).toBe('OP-03');
    useArTrackingStore.getState().clearFocusPersonnel();
    expect(useArTrackingStore.getState().focusPersonnelId).toBeNull();
  });
});
