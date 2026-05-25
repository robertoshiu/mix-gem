import { mulberry32, pick, gaussian, selectCategory, generateTick, generateEquipmentUpdate, createScenarioState, advanceScenario, type MessageCategory, type ScenarioState } from './secs-gem-sim-engine';
import { SCENARIO_TEMPLATES } from './secs-gem-demo-data';

describe('mulberry32', () => {
  it('returns deterministic sequence for same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('returns different sequences for different seeds', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(99);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it('returns values in [0, 1) range', () => {
    const rng = mulberry32(123);
    const values = Array.from({ length: 1000 }, () => rng());
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('pick', () => {
  it('picks element from array based on rand value', () => {
    const arr = ['a', 'b', 'c', 'd'];
    expect(pick(arr, 0.0)).toBe('a');
    expect(pick(arr, 0.24)).toBe('a');
    expect(pick(arr, 0.25)).toBe('b');
    expect(pick(arr, 0.99)).toBe('d');
  });
});

describe('gaussian', () => {
  it('returns values centered around mean', () => {
    const rng = mulberry32(42);
    const values = Array.from({ length: 500 }, () => gaussian(50, 1.5, rng(), rng()));
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    expect(avg).toBeGreaterThan(48);
    expect(avg).toBeLessThan(52);
  });

  it('respects stddev spread', () => {
    const rng = mulberry32(42);
    const values = Array.from({ length: 500 }, () => gaussian(50, 1.5, rng(), rng()));
    const min = Math.min(...values);
    const max = Math.max(...values);
    expect(min).toBeGreaterThan(40);
    expect(max).toBeLessThan(60);
  });
});

describe('selectCategory', () => {
  it('returns collection for low values (weight 0.35)', () => {
    expect(selectCategory(0.0)).toBe('collection');
    expect(selectCategory(0.34)).toBe('collection');
  });

  it('returns status for values in [0.35, 0.50)', () => {
    expect(selectCategory(0.35)).toBe('status');
    expect(selectCategory(0.49)).toBe('status');
  });

  it('distributes all 7 categories across full range', () => {
    const categories = new Set<MessageCategory>();
    for (let i = 0; i < 100; i++) {
      categories.add(selectCategory(i / 100));
    }
    expect(categories.size).toBe(7);
  });
});

describe('generateTick', () => {
  it('returns at least 1 message per tick', () => {
    const result = generateTick(42, 0);
    expect(result.messages.length).toBeGreaterThanOrEqual(1);
  });

  it('returns at most 2 messages per tick (request + reply pair)', () => {
    for (let i = 0; i < 50; i++) {
      const result = generateTick(42, i);
      expect(result.messages.length).toBeLessThanOrEqual(2);
    }
  });

  it('is deterministic for same seed and tick', () => {
    const r1 = generateTick(42, 5);
    const r2 = generateTick(42, 5);
    expect(r1.messages.map(m => m.sf)).toEqual(r2.messages.map(m => m.sf));
    expect(r1.messages.map(m => m.summary)).toEqual(r2.messages.map(m => m.summary));
  });

  it('produces different messages for different ticks', () => {
    const results = Array.from({ length: 20 }, (_, i) => generateTick(42, i));
    const allSummaries = results.flatMap(r => r.messages.map(m => m.summary));
    const uniqueSummaries = new Set(allSummaries);
    expect(uniqueSummaries.size).toBeGreaterThan(allSummaries.length * 0.4);
  });

  it('covers all 7 message categories over 200 ticks', () => {
    const sfSet = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const result = generateTick(42, i);
      for (const msg of result.messages) {
        sfSet.add(msg.sf);
      }
    }
    expect(sfSet.has('S6F11')).toBe(true);
    expect(sfSet.has('S1F3')).toBe(true);
    expect(sfSet.has('S2F41')).toBe(true);
    expect(sfSet.has('S2F49')).toBe(true);
    expect(sfSet.has('S5F1')).toBe(true);
    expect(sfSet.has('S1F1')).toBe(true);
    expect(sfSet.has('S10F1')).toBe(true);
  });

  it('no duplicate message ids in 200 ticks', () => {
    const allIds = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const result = generateTick(42, i);
      for (const msg of result.messages) {
        expect(allIds.has(msg.id)).toBe(false);
        allIds.add(msg.id);
      }
    }
  });

  it('messages have valid DemoSecsMessage shape', () => {
    const result = generateTick(42, 0);
    for (const msg of result.messages) {
      expect(msg).toHaveProperty('id');
      expect(msg).toHaveProperty('timestamp');
      expect(msg).toHaveProperty('direction');
      expect(msg).toHaveProperty('sf');
      expect(msg).toHaveProperty('stream');
      expect(msg).toHaveProperty('function');
      expect(msg).toHaveProperty('wbit');
      expect(msg).toHaveProperty('latencyMs');
      expect(msg).toHaveProperty('systemBytes');
      expect(msg).toHaveProperty('summary');
      expect(msg).toHaveProperty('payload');
      expect(['H2E', 'E2H']).toContain(msg.direction);
      expect(msg.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('burst pairs have matching request/reply streams', () => {
    let foundPair = false;
    for (let i = 0; i < 100; i++) {
      const result = generateTick(42, i);
      if (result.messages.length === 2) {
        const [req, reply] = result.messages;
        expect(req.stream).toBe(reply.stream);
        expect(reply.function).toBe(req.function + 1);
        foundPair = true;
      }
    }
    expect(foundPair).toBe(true);
  });
});

describe('generateEquipmentUpdate', () => {
  const mockEquipment = [
    { id: 'litho-01', connectionState: 'selected' as const, status: 'running' as const, waferProgress: '14/25', timers: { t3: '45s', t5: '10s', t6: '5s', t7: '10s' } },
    { id: 'coat-01', connectionState: 'connected' as const, status: 'idle' as const, waferProgress: '0/25', timers: { t3: '45s', t5: '10s', t6: '5s', t7: '10s' } },
  ];

  it('returns array of updates', () => {
    const updates = generateEquipmentUpdate(42, 0, mockEquipment);
    expect(Array.isArray(updates)).toBe(true);
  });

  it('updates are deterministic for same seed', () => {
    const u1 = generateEquipmentUpdate(42, 10, mockEquipment);
    const u2 = generateEquipmentUpdate(42, 10, mockEquipment);
    expect(u1).toEqual(u2);
  });

  it('each update has equipmentId and changes', () => {
    for (let i = 0; i < 200; i++) {
      const updates = generateEquipmentUpdate(42, i, mockEquipment);
      for (const u of updates) {
        expect(u).toHaveProperty('equipmentId');
        expect(u).toHaveProperty('changes');
        expect(mockEquipment.some(e => e.id === u.equipmentId)).toBe(true);
      }
    }
  });
});

describe('scenario cycling', () => {
  it('createScenarioState starts at template 0 step 0', () => {
    const state = createScenarioState();
    expect(state.templateIndex).toBe(0);
    expect(state.stepIndex).toBe(0);
  });

  it('advanceScenario moves to next step when matching sf arrives', () => {
    const state = createScenarioState();
    // Step 0 primary is S1F13
    const result = advanceScenario(state, 'S1F13');
    expect(result.stepIndex).toBe(1);
  });

  it('advanceScenario does not advance on non-matching sf', () => {
    const state = createScenarioState();
    const result = advanceScenario(state, 'S10F1');
    expect(result.stepIndex).toBe(0);
  });

  it('cycles to next template when all steps complete', () => {
    let state = createScenarioState();
    // SPC violation template: S1F13, S6F11, S2F41, S2F49
    state = advanceScenario(state, 'S1F13');
    state = advanceScenario(state, 'S6F11');
    state = advanceScenario(state, 'S2F41');
    state = advanceScenario(state, 'S2F49');
    expect(state.templateIndex).toBe(1);
    expect(state.stepIndex).toBe(0);
  });

  it('wraps around to template 0 after last template completes', () => {
    let state: ScenarioState = { templateIndex: 3, stepIndex: 0 };
    // PM template: S2F41, S6F11, S2F49, S2F41
    state = advanceScenario(state, 'S2F41');
    state = advanceScenario(state, 'S6F11');
    state = advanceScenario(state, 'S2F49');
    state = advanceScenario(state, 'S2F41');
    expect(state.templateIndex).toBe(0);
    expect(state.stepIndex).toBe(0);
  });
});
