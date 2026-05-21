import { createDamageState, recordDamage, applyAnnealing, isAmorphous, initializePAI, getAmorphousMap, peakDamage } from '../damage-model';

describe('damage-model', () => {
  test('fresh damage state has zero vacancies', () => {
    const state = createDamageState(100);
    expect(state.vacancies.every(v => v === 0)).toBe(true);
    expect(state.totalFrenkelPairs).toBe(0);
  });

  test('recordDamage increments vacancy at correct bin', () => {
    const state = createDamageState(100);
    recordDamage(state, 50, 1, 1, 5);
    expect(state.vacancies[50]).toBeGreaterThan(0);
    expect(state.totalFrenkelPairs).toBe(1);
  });

  test('repeated damage leads to amorphization', () => {
    const state = createDamageState(100);
    const threshold = 5;
    for (let i = 0; i < 1000; i++) {
      recordDamage(state, 25, 1, 1, threshold);
    }
    expect(isAmorphous(state, 25)).toBe(true);
    expect(isAmorphous(state, 50)).toBe(false);
  });

  test('annealing reduces vacancy density', () => {
    const state = createDamageState(100);
    recordDamage(state, 30, 1, 100, 5);
    const before = state.vacancies[30];

    applyAnnealing(state, 500, 1.0);
    expect(state.vacancies[30]).toBeLessThan(before);
  });

  test('annealing at room temp with zero rate does nothing', () => {
    const state = createDamageState(100);
    recordDamage(state, 30, 1, 100, 5);
    const before = state.vacancies[30];
    applyAnnealing(state, 25, 0);
    expect(state.vacancies[30]).toBe(before);
  });

  test('initializePAI creates amorphous surface layer', () => {
    const state = createDamageState(200);
    initializePAI(state, 30, 1);
    expect(isAmorphous(state, 10)).toBe(true);
    expect(isAmorphous(state, 25)).toBe(true);
    expect(isAmorphous(state, 50)).toBe(false);
  });

  test('getAmorphousMap returns boolean array', () => {
    const state = createDamageState(50);
    initializePAI(state, 10, 1);
    const map = getAmorphousMap(state);
    expect(map.length).toBe(50);
    expect(map[5]).toBe(true);
    expect(map[20]).toBe(false);
  });

  test('peakDamage finds the most damaged bin', () => {
    const state = createDamageState(100);
    recordDamage(state, 30, 1, 50, 5);
    recordDamage(state, 60, 1, 100, 5);
    const { peakBin } = peakDamage(state);
    expect(peakBin).toBe(60);
  });
});
