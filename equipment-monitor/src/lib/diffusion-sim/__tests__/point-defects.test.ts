
import {
  createPointDefectState, stepPointDefects, getSuperSaturation,
  equilibriumVacancies, equilibriumInterstitials,
} from '../point-defects';

describe('point-defects', () => {
  it('equilibrium vacancy increases with temperature', () => {
    const v800 = equilibriumVacancies(800);
    const v1000 = equilibriumVacancies(1000);
    expect(v1000).toBeGreaterThan(v800);
    expect(v800).toBeGreaterThan(0);
  });

  it('equilibrium interstitial is much lower than vacancy', () => {
    const cV = equilibriumVacancies(1000);
    const cI = equilibriumInterstitials(1000);
    expect(cI).toBeLessThan(cV);
    expect(cI).toBeGreaterThan(0);
  });

  it('createPointDefectState initializes with implant damage in {311}', () => {
    const damage = new Array(200).fill(0);
    damage[50] = 1e18;
    const state = createPointDefectState(200, damage);
    expect(state.defect311[50]).toBe(1e18);
    expect(state.defect311[0]).toBe(0);
    expect(state.vacancies).toHaveLength(200);
    expect(state.interstitials).toHaveLength(200);
  });

  it('stepPointDefects dissolves {311} defects', () => {
    const damage = new Array(200).fill(1e16);
    const state = createPointDefectState(200, damage);
    const initial311 = state.defect311[100];
    stepPointDefects(state, 1000, 1.0, 'N2', 1.0, 1.0, 1.0);
    expect(state.defect311[100]).toBeLessThan(initial311);
  });

  it('IV recombination reduces both species', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    for (let i = 0; i < 200; i++) {
      state.interstitials[i] = 1e20;
      state.vacancies[i] = 1e20;
    }
    const prevI = state.interstitials[100];
    stepPointDefects(state, 1000, 0.1, 'N2', 1.0, 1.0, 1.0);
    expect(state.interstitials[100]).toBeLessThan(prevI);
    expect(state.vacancies[100]).toBeLessThan(prevI);
  });

  it('OED injects interstitials at surface with O2 ambient', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    const prevI0 = state.interstitials[0];
    stepPointDefects(state, 1000, 1.0, 'O2', 1.0, 1.0, 1.0);
    expect(state.interstitials[0]).toBeGreaterThan(prevI0);
  });

  it('N2 ambient produces no OED injection', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    const stateO2 = createPointDefectState(200, new Array(200).fill(0));
    stepPointDefects(state, 1000, 1.0, 'N2', 1.0, 1.0, 1.0);
    stepPointDefects(stateO2, 1000, 1.0, 'O2', 1.0, 1.0, 1.0);
    expect(stateO2.interstitials[0]).toBeGreaterThan(state.interstitials[0]);
  });

  it('getSuperSaturation returns ~1 at equilibrium', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    for (let i = 0; i < 50; i++) {
      stepPointDefects(state, 1000, 1.0, 'N2', 1.0, 1.0, 1.0);
    }
    const { sI, sV } = getSuperSaturation(state, 1000, 1.0, 1.0);
    expect(sI[100]).toBeCloseTo(1.0, 0);
    expect(sV[100]).toBeCloseTo(1.0, 0);
  });

  it('high interstitialFactor increases supersaturation', () => {
    const state = createPointDefectState(200, new Array(200).fill(0));
    const { sI: sI_1 } = getSuperSaturation(state, 1000, 1.0, 1.0);
    const { sI: sI_5 } = getSuperSaturation(state, 1000, 5.0, 1.0);
    expect(sI_5[100]).toBeLessThan(sI_1[100]);
  });
});
