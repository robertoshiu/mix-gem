import {
  DYNAMIC_ZONES,
  INITIAL_PERSONNEL,
  RESTRICTED_ZONES,
  useArTrackingStore,
} from '@/stores/ar-tracking-store';

beforeEach(() => {
  useArTrackingStore.setState({
    personnel: INITIAL_PERSONNEL.map((person) => ({ ...person })),
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
