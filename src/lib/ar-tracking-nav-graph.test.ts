import {
  EQUIPMENT_AABBS,
  NAV_EDGES,
  NAV_NODES,
  NAV_PATROL_ROUTES,
  edgeClearsAllAABBs,
  nearestNavNode,
  pointClearOfAABBs,
  resolvePatrolRoute,
  segmentIntersectsAABB,
} from './ar-tracking-nav-graph';

describe('ar-tracking-nav-graph', () => {
  describe('segmentIntersectsAABB', () => {
    const box = { xMin: 0, xMax: 4, zMin: 0, zMax: 4 };

    it('detects intersection when segment crosses box', () => {
      expect(segmentIntersectsAABB(-1, 2, 5, 2, box)).toBe(true);
    });

    it('returns false when segment misses box', () => {
      expect(segmentIntersectsAABB(-1, 5, 5, 5, box)).toBe(false);
    });

    it('returns false when segment ends before box', () => {
      expect(segmentIntersectsAABB(-5, 2, -1, 2, box)).toBe(false);
    });

    it('detects intersection when diagonal segment crosses box', () => {
      // Diagonal from top-left to bottom-right, crossing through the box
      expect(segmentIntersectsAABB(-1, 5, 5, -1, box)).toBe(true);
    });

    it('returns false when diagonal segment misses box entirely', () => {
      // Diagonal entirely to the right of the box
      expect(segmentIntersectsAABB(5, 5, 10, 0, box)).toBe(false);
    });
  });

  describe('pointClearOfAABBs', () => {
    it('returns true for a point far from all equipment', () => {
      expect(pointClearOfAABBs(0, -20, EQUIPMENT_AABBS, 1.5)).toBe(true);
    });

    it('returns false for a point inside an equipment bay', () => {
      // Center of Litho Bay (-18, 10)
      expect(pointClearOfAABBs(-18, 10, EQUIPMENT_AABBS, 1.5)).toBe(false);
    });
  });

  describe('all nav nodes clear of equipment AABBs', () => {
    it.each(Object.entries(NAV_NODES))(
      'node %s at [%j] has >= 1.5m clearance from all equipment',
      (id, [x, z]) => {
        expect(pointClearOfAABBs(x, z, EQUIPMENT_AABBS, 1.5)).toBe(true);
      },
    );
  });

  describe('all nav edges clear of equipment AABBs', () => {
    it.each(NAV_EDGES)(
      'edge %s -> %s does not cross any equipment bay',
      (fromId, toId) => {
        const [x1, z1] = NAV_NODES[fromId];
        const [x2, z2] = NAV_NODES[toId];
        expect(edgeClearsAllAABBs(x1, z1, x2, z2, EQUIPMENT_AABBS)).toBe(true);
      },
    );
  });

  describe('patrol routes', () => {
    it.each(Object.entries(NAV_PATROL_ROUTES))(
      'route %s uses only valid node IDs',
      (_, nodeIds) => {
        nodeIds.forEach((nodeId) => {
          expect(NAV_NODES).toHaveProperty(nodeId);
        });
      },
    );

    it.each(Object.entries(NAV_PATROL_ROUTES))(
      'route %s uses only connected edges',
      (_, nodeIds) => {
        for (let i = 0; i < nodeIds.length - 1; i++) {
          const a = nodeIds[i];
          const b = nodeIds[i + 1];
          const hasEdge = NAV_EDGES.some(
            ([from, to]) => (from === a && to === b) || (from === b && to === a),
          );
          expect(hasEdge).toBe(true);
        }
      },
    );

    it.each(Object.entries(NAV_PATROL_ROUTES))(
      'route %s loops (first === last)',
      (_, nodeIds) => {
        expect(nodeIds[0]).toBe(nodeIds[nodeIds.length - 1]);
      },
    );
  });

  describe('resolvePatrolRoute', () => {
    it('converts node IDs to coordinates', () => {
      const coords = resolvePatrolRoute(['W-NW', 'W-MID']);
      expect(coords).toEqual([[-29, 14], [-29, 0]]);
    });

    it('throws for unknown node ID', () => {
      expect(() => resolvePatrolRoute(['NONEXISTENT'])).toThrow('Unknown nav node');
    });
  });

  describe('nearestNavNode', () => {
    it('finds closest node to a given position', () => {
      // Position very close to W-NW (-29, 14)
      expect(nearestNavNode(-28, 13)).toBe('W-NW');
    });
  });

  describe('known bad edges are rejected', () => {
    it('N-CMP to CE-FAR crosses CMP Bay', () => {
      const [x1, z1] = NAV_NODES['N-CMP'];
      const [x2, z2] = NAV_NODES['CE-FAR'];
      expect(edgeClearsAllAABBs(x1, z1, x2, z2, EQUIPMENT_AABBS)).toBe(false);
    });

    it('W-NW to N-IW crosses Litho Bay', () => {
      const [x1, z1] = NAV_NODES['W-NW'];
      const [x2, z2] = NAV_NODES['N-IW'];
      expect(edgeClearsAllAABBs(x1, z1, x2, z2, EQUIPMENT_AABBS)).toBe(false);
    });
  });
});
