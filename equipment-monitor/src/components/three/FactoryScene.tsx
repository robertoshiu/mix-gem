'use client';

import { OrbitControls, Grid } from '@react-three/drei';

const ZONE_COLORS = {
  power: '#3b82f6',
  buildingAutomation: '#10b981',
  gas: '#f59e0b',
  fire: '#ef4444',
} as const;

const ZONE_SIZE = 12;
const CENTER_BUILDING: [number, number, number] = [4, 3, 4];

/**
 * 3D factory war room scene: 2x2 zone grid with center building outline.
 * Rendered as a child of FactoryCanvas (which provides the R3F Canvas wrapper).
 */
export function FactoryScene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />

      {/* Camera Controls */}
      <OrbitControls
        enableRotate
        enableZoom
        enablePan
        minDistance={5}
        maxDistance={80}
      />

      {/* Floor reference grid */}
      <Grid
        position={[0, 0, 0]}
        args={[60, 60]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1E3A5F"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2563EB"
        fadeDistance={50}
        infiniteGrid
      />

      {/* Zone 1: Power Monitoring (top-left) */}
      <mesh position={[-7, 0.05, -7]}>
        <boxGeometry args={[ZONE_SIZE, 0.1, ZONE_SIZE]} />
        <meshStandardMaterial
          color={ZONE_COLORS.power}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Zone 2: Building Automation (top-right) */}
      <mesh position={[7, 0.05, -7]}>
        <boxGeometry args={[ZONE_SIZE, 0.1, ZONE_SIZE]} />
        <meshStandardMaterial
          color={ZONE_COLORS.buildingAutomation}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Zone 3: Gas Detection (bottom-left) */}
      <mesh position={[-7, 0.05, 7]}>
        <boxGeometry args={[ZONE_SIZE, 0.1, ZONE_SIZE]} />
        <meshStandardMaterial
          color={ZONE_COLORS.gas}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Zone 4: Fire Alarm (bottom-right) */}
      <mesh position={[7, 0.05, 7]}>
        <boxGeometry args={[ZONE_SIZE, 0.1, ZONE_SIZE]} />
        <meshStandardMaterial
          color={ZONE_COLORS.fire}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Center building outline (wireframe box at origin) */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={CENTER_BUILDING} />
        <meshStandardMaterial color="#94a3b8" wireframe={true} />
      </mesh>
    </>
  );
}
