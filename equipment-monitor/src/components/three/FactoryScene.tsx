'use client';

import { OrbitControls, Grid, Line } from '@react-three/drei';
import { CleanroomShell, ToolBay, UtilityCorridor, DataFlowLine, StatusBeacon, ZoneAccentLight } from './FabScenePrimitives';

const FLOOR_POINTS: [number, number, number][] = [
  [-16, 0.08, -16],
  [16, 0.08, -16],
  [16, 0.08, 16],
  [-16, 0.08, 16],
  [-16, 0.08, -16],
];

/**
 * Shared 3D factory shell. Interactive zone floor meshes live in SubsystemZone;
 * this component only provides lighting, camera controls, grid, and landmarks to
 * avoid duplicate co-planar geometry/z-fighting.
 */
export function FactoryScene() {
  return (
    <>
      {/* LIGHTING */}
      <ambientLight intensity={0.35} color="#1a2744" />
      <directionalLight position={[15, 25, 10]} intensity={0.9} color="#e8edf5" />
      <directionalLight position={[-10, 12, -8]} intensity={0.3} color="#4a90d9" />

      <OrbitControls
        enableRotate
        enableZoom
        enablePan
        target={[0, 0.3, 0]}
        minDistance={10}
        maxDistance={56}
        maxPolarAngle={Math.PI / 2.15}
      />

      <Grid
        position={[0, 0, 0]}
        args={[42, 42]}
        cellSize={1}
        cellThickness={0.55}
        cellColor="#1E3A5F"
        sectionSize={6}
        sectionThickness={1.3}
        sectionColor="#22D3EE"
        fadeDistance={45}
        fadeStrength={1.7}
        infiniteGrid={false}
      />

      <Line points={FLOOR_POINTS} color="#38bdf8" lineWidth={1.8} transparent opacity={0.58} />

      {/* FAB PRIMITIVES */}
      <CleanroomShell />
      <ToolBay position={[-6.5, 0.12, -6.5]} color="#3b82f6" />
      <ToolBay position={[6.5, 0.12, -6.5]} color="#10b981" />
      <ToolBay position={[-6.5, 0.12, 6.5]} color="#f59e0b" />
      <ToolBay position={[6.5, 0.12, 6.5]} color="#ef4444" />
      <UtilityCorridor from={[-6.5, 2.8, -6.5]} to={[6.5, 2.8, 6.5]} />
      <UtilityCorridor from={[-6.5, 2.8, 6.5]} to={[6.5, 2.8, -6.5]} />
      <DataFlowLine from={[-6.5, 2, -6.5]} to={[0, 2, 0]} />
      <DataFlowLine from={[6.5, 2, -6.5]} to={[0, 2, 0]} />
      <DataFlowLine from={[-6.5, 2, 6.5]} to={[0, 2, 0]} />
      <DataFlowLine from={[6.5, 2, 6.5]} to={[0, 2, 0]} />
      <ZoneAccentLight position={[-6.5, 4, -6.5]} color="#3b82f6" />
      <ZoneAccentLight position={[6.5, 4, -6.5]} color="#10b981" />
      <ZoneAccentLight position={[-6.5, 4, 6.5]} color="#f59e0b" />
      <ZoneAccentLight position={[6.5, 4, 6.5]} color="#ef4444" />
      <StatusBeacon position={[-3, 0, -3]} color="#3b82f6" pulse={true} />

      {/* EXISTING LANDMARKS */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[4.8, 2.2, 4.8]} />
        <meshStandardMaterial color="#94a3b8" wireframe transparent opacity={0.72} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.35, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.42} />
      </mesh>
    </>
  );
}