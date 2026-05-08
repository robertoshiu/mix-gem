'use client';

import { OrbitControls, Grid, Line } from '@react-three/drei';
import { CleanroomShell, DataFlowLine, FireSuppressionPanel, GasCabinetCluster, HvacArray, StatusBeacon, TransformerBank, UtilityCorridor, ZoneAccentLight } from './FabScenePrimitives';

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
      <ambientLight intensity={0.22} color="#060818" />
      <directionalLight position={[15, 25, 10]} intensity={0.55} color="#7dd3fc" />
      <directionalLight position={[-10, 12, -8]} intensity={0.38} color="#22d3ee" />

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
        cellColor="#12325a"
        sectionSize={6}
        sectionThickness={1.3}
        sectionColor="#00e5ff"
        fadeDistance={45}
        fadeStrength={1.7}
        infiniteGrid={false}
      />

      <Line points={FLOOR_POINTS} color="#38bdf8" lineWidth={2.2} transparent opacity={0.72} dashed dashSize={1.3} gapSize={0.35} />

      {/* FAB PRIMITIVES */}
      <CleanroomShell />
      <TransformerBank position={[-6.5, 0.12, -6.5]} color="#3b82f6" />
      <HvacArray position={[6.5, 0.12, -6.5]} color="#10b981" />
      <GasCabinetCluster position={[-6.5, 0.12, 6.5]} color="#f59e0b" />
      <FireSuppressionPanel position={[6.5, 0.12, 6.5]} color="#ef4444" />
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
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.24} wireframe transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.35, 64]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.42} />
      </mesh>
    </>
  );
}
