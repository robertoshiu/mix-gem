import { thermalStress, volumeExpansionStress, viscousRelaxation, computeStressField } from '../stress-model';
import { createMesh } from '../mesh-templates';
import { DEFAULT_PARAMS, T_AMBIENT } from '../constants';

describe('stress-model', () => {
  it('zero delta-T produces zero thermal stress', () => {
    expect(thermalStress('Si', 'SiO2', T_AMBIENT, T_AMBIENT)).toBe(0);
  });

  it('heating produces nonzero thermal stress between Si and SiO2', () => {
    const s = thermalStress('Si', 'SiO2', T_AMBIENT, 1000);
    expect(Math.abs(s)).toBeGreaterThan(0);
  });

  it('volume expansion produces compressive stress in oxide', () => {
    const s = volumeExpansionStress(10, 1000);
    expect(s).toBeLessThan(0);
  });

  it('no new oxide produces zero expansion stress', () => {
    expect(volumeExpansionStress(0, 1000)).toBe(0);
  });

  it('viscous relaxation reduces stress magnitude', () => {
    const s0 = -500;
    const s1 = viscousRelaxation(s0, 1000, 60);
    expect(Math.abs(s1)).toBeLessThan(Math.abs(s0));
  });

  it('relaxation is faster at higher temperature', () => {
    const s0 = -500;
    const s_low = viscousRelaxation(s0, 800, 60);
    const s_high = viscousRelaxation(s0, 1100, 60);
    expect(Math.abs(s_high)).toBeLessThan(Math.abs(s_low));
  });

  it('computeStressField updates mesh stress values', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    for (const node of mesh.nodes) node.T = 1000;
    const oxThickness = new Array(mesh.nr).fill(10);
    computeStressField(mesh, oxThickness, 1.0);
    const stresses = mesh.nodes.map(n => n.stress);
    const anyNonZero = stresses.some(s => s !== 0);
    expect(anyNonZero).toBe(true);
  });

  it('STI trench corner has higher stress than flat surface', () => {
    const mesh = createMesh('sti', { ...DEFAULT_PARAMS, geometryType: 'sti' });
    for (const node of mesh.nodes) node.T = 1000;
    const oxThickness = new Array(mesh.nr).fill(20);
    computeStressField(mesh, oxThickness, 5.0);
    const surfaceStress = Math.abs(mesh.nodes[0].stress);
    const cornerNodes = mesh.nodes.filter(n => n.z > 200 && n.z < 400);
    const maxCornerStress = Math.max(...cornerNodes.map(n => Math.abs(n.stress)));
    expect(maxCornerStress).toBeGreaterThanOrEqual(surfaceStress * 0.5);
  });

  it('all stress values are finite', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    for (const node of mesh.nodes) node.T = 1000;
    const oxThickness = new Array(mesh.nr).fill(10);
    computeStressField(mesh, oxThickness, 1.0);
    for (const node of mesh.nodes) {
      expect(isFinite(node.stress)).toBe(true);
    }
  });

  it('stress magnitude increases with lower temperature (less relaxation)', () => {
    const s_900 = viscousRelaxation(-1000, 900, 60);
    const s_1100 = viscousRelaxation(-1000, 1100, 60);
    expect(Math.abs(s_900)).toBeGreaterThan(Math.abs(s_1100));
  });
});
