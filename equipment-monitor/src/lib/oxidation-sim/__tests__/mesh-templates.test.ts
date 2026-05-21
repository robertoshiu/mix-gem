import { createMesh } from '../mesh-templates';
import { DEFAULT_PARAMS } from '../constants';
import type { SimulationParams } from '../types';

describe('mesh-templates', () => {
  it('blanket mesh has ~400 nodes (20x20)', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    expect(mesh.nr).toBe(20);
    expect(mesh.nz).toBe(20);
    expect(mesh.nodes).toHaveLength(mesh.nr * mesh.nz);
  });

  it('locos mesh has extra radial nodes (~25x20)', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, geometryType: 'locos' };
    const mesh = createMesh('locos', params);
    expect(mesh.nr).toBe(25);
    expect(mesh.nz).toBe(20);
    expect(mesh.nodes).toHaveLength(mesh.nr * mesh.nz);
  });

  it('sti mesh has extra depth nodes (~25x25)', () => {
    const params: SimulationParams = { ...DEFAULT_PARAMS, geometryType: 'sti' };
    const mesh = createMesh('sti', params);
    expect(mesh.nr).toBe(25);
    expect(mesh.nz).toBe(25);
    expect(mesh.nodes).toHaveLength(mesh.nr * mesh.nz);
  });

  it('all elements reference valid node indices', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    const maxIdx = mesh.nodes.length - 1;
    for (const el of mesh.elements) {
      for (const ni of el.nodes) {
        expect(ni).toBeGreaterThanOrEqual(0);
        expect(ni).toBeLessThanOrEqual(maxIdx);
      }
    }
  });

  it('blanket mesh element count is (nr-1)*(nz-1)', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    expect(mesh.elements).toHaveLength((mesh.nr - 1) * (mesh.nz - 1));
  });

  it('nodes have initial temperature at T_AMBIENT', () => {
    const mesh = createMesh('blanket', DEFAULT_PARAMS);
    for (const node of mesh.nodes) {
      expect(node.T).toBe(25);
      expect(node.stress).toBe(0);
    }
  });

  it('trench depth parameter changes STI mesh node positions', () => {
    const shallow = createMesh('sti', { ...DEFAULT_PARAMS, geometryType: 'sti', trenchDepth: 100 });
    const deep = createMesh('sti', { ...DEFAULT_PARAMS, geometryType: 'sti', trenchDepth: 500 });
    const shallowMaxZ = Math.max(...shallow.nodes.map(n => n.z));
    const deepMaxZ = Math.max(...deep.nodes.map(n => n.z));
    expect(deepMaxZ).toBeGreaterThan(shallowMaxZ);
  });

  it('locos mesh contains Si3N4 material nodes', () => {
    const mesh = createMesh('locos', { ...DEFAULT_PARAMS, geometryType: 'locos' });
    const nitrideNodes = mesh.nodes.filter(n => n.material === 'Si3N4');
    expect(nitrideNodes.length).toBeGreaterThan(0);
  });
});
