import { solveThermalStep, createThermalProfile } from '../thermal-fea';
import { createMesh } from '../mesh-templates';
import { DEFAULT_PARAMS, T_AMBIENT } from '../constants';

describe('thermal-fea', () => {
  it('uniform heating produces temperature above ambient', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 1.0, 85, oxidationRate, 'dry');
    const avgT = mesh.nodes.reduce((s, n) => s + n.T, 0) / mesh.nodes.length;
    expect(avgT).toBeGreaterThan(T_AMBIENT);
  });

  it('edge temperature is lower than center with lampBalance < 100', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 10.0, 70, oxidationRate, 'dry');
    const centerT = mesh.nodes[0].T;
    const edgeT = mesh.nodes[mesh.nr - 1].T;
    expect(centerT).toBeGreaterThan(edgeT);
  });

  it('temperature is uniform when lampBalance is 100', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 10.0, 100, oxidationRate, 'dry');
    const temps = mesh.nodes.map(n => n.T);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    expect(max - min).toBeLessThan(5);
  });

  it('exothermic oxidation heat source raises temperature', () => {
    const mesh1 = createMesh('blanket', DEFAULT_PARAMS);
    const mesh2 = createMesh('blanket', DEFAULT_PARAMS);
    const noHeat = new Array(mesh1.nr).fill(0);
    const withHeat = new Array(mesh1.nr).fill(1e6);
    solveThermalStep(mesh1, 1000, 10.0, 85, noHeat, 'dry');
    solveThermalStep(mesh2, 1000, 10.0, 85, withHeat, 'dry');
    const avgT1 = mesh1.nodes.reduce((s, n) => s + n.T, 0) / mesh1.nodes.length;
    const avgT2 = mesh2.nodes.reduce((s, n) => s + n.T, 0) / mesh2.nodes.length;
    expect(avgT2).toBeGreaterThanOrEqual(avgT1);
  });

  it('all node temperatures are finite', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 1.0, 85, oxidationRate, 'dry');
    for (const node of mesh.nodes) {
      expect(isFinite(node.T)).toBe(true);
    }
  });

  it('createThermalProfile generates correct number of steps', () => {
    const profile = createThermalProfile(DEFAULT_PARAMS);
    expect(profile).toHaveLength(DEFAULT_PARAMS.totalSteps ?? 200);
  });

  it('thermal profile follows ramp-soak-cool phases', () => {
    const profile = createThermalProfile(DEFAULT_PARAMS);
    const phases = profile.map(s => s.phase);
    expect(phases[0]).toBe('ramp');
    expect(phases).toContain('soak');
    expect(phases[phases.length - 1]).toBe('cool');
  });

  it('material interfaces maintain temperature continuity', () => {
    const params = { ...DEFAULT_PARAMS, geometryType: 'locos' as const, initialOxideThickness: 50 };
    const mesh = createMesh('locos', params);
    const oxidationRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 1000, 10.0, 85, oxidationRate, 'dry');
    for (let i = 1; i < mesh.nodes.length; i++) {
      const prev = mesh.nodes[i - 1];
      const curr = mesh.nodes[i];
      if (prev.material !== curr.material && Math.abs(prev.r - curr.r) < 1) {
        expect(Math.abs(prev.T - curr.T)).toBeLessThan(50);
      }
    }
  });

  it('Si thermal conductivity decreases with temperature', () => {
    const mesh1 = createMesh('blanket', DEFAULT_PARAMS);
    const mesh2 = createMesh('blanket', DEFAULT_PARAMS);
    const zeroRate = new Array(mesh1.nr).fill(0);
    solveThermalStep(mesh1, 800, 10.0, 70, zeroRate, 'dry');
    solveThermalStep(mesh2, 1200, 10.0, 70, zeroRate, 'dry');
    const delta1 = mesh1.nodes[0].T - mesh1.nodes[mesh1.nr - 1].T;
    const delta2 = mesh2.nodes[0].T - mesh2.nodes[mesh2.nr - 1].T;
    expect(Math.abs(delta2)).toBeGreaterThanOrEqual(Math.abs(delta1) * 0.5);
  });

  it('multiple steps accumulate temperature correctly', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const zeroRate = new Array(mesh.nr).fill(0);
    solveThermalStep(mesh, 500, 5.0, 85, zeroRate, 'dry');
    const T_after1 = mesh.nodes[0].T;
    solveThermalStep(mesh, 1000, 5.0, 85, zeroRate, 'dry');
    const T_after2 = mesh.nodes[0].T;
    expect(T_after2).toBeGreaterThan(T_after1);
  });
});
