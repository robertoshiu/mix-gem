'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '@/lib/animation';

const ZONE_SIZE = 11.5;

const ZONE_LABELS: Record<ZoneType, string> = {
  power: 'POWER MONITORING',
  'building-auto': 'BUILDING AUTO',
  gas: 'GAS DETECTION',
  fire: 'FIRE ALARM',
};

const ZONE_COLORS: Record<ZoneType, string> = {
  power: '#3b82f6',
  'building-auto': '#10b981',
  gas: '#f59e0b',
  fire: '#ef4444',
};

export type ZoneType = 'power' | 'building-auto' | 'gas' | 'fire';

export interface SubsystemZoneProps {
  zoneType: ZoneType;
  position: [number, number, number];
  onClick: () => void;
  hasAlert?: boolean;
}

/**
 * Interactive 3D subsystem zone for the war room factory scene.
 *
 * Features:
 * - Colored floor plane (12x0.1x12) per subsystem type
 * - Billboarded text label above the zone
 * - Hover highlight via emissive brightening
 * - Alert pulse animation via useFrame emissive cycling
 * - Sparkles particle effect when alert is active
 * - Click handler for zone interaction
 */
export function SubsystemZone({
  zoneType,
  position,
  onClick,
  hasAlert = false,
}: SubsystemZoneProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();

  const color = ZONE_COLORS[zoneType];
  const textColor = '#e2e8f0';
  const textOutline = '#0B0F19';
  const label = ZONE_LABELS[zoneType];

  // Animate emissive: pulse when alerting, highlight when hovered
  useFrame((state) => {
    if (!materialRef.current) return;

    if (hasAlert) {
      const pulse = reduced ? 0.55 : Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
      const emissiveColor = new THREE.Color(color);
      materialRef.current.emissive = emissiveColor.multiplyScalar(0.15 + pulse * 0.65);
    } else if (hovered) {
      materialRef.current.emissive = new THREE.Color(color);
      materialRef.current.emissiveIntensity = 0.3;
    } else {
      materialRef.current.emissive = new THREE.Color(0x000000);
      materialRef.current.emissiveIntensity = 0;
    }
  });

  return (
    <group>
      {/* Floor slab */}
      <mesh
        position={position}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[ZONE_SIZE, 0.16, ZONE_SIZE]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={hovered ? 0.48 : 0.34}
          roughness={0.38}
          metalness={0.12}
        />
      </mesh>

      <mesh position={[position[0], position[1] + 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ZONE_SIZE * 0.42, ZONE_SIZE * 0.45, 56]} />
        <meshBasicMaterial color={color} transparent opacity={hasAlert ? 0.72 : 0.34} />
      </mesh>

      {/* Billboarded zone label */}
      <Billboard
        position={[position[0], position[1] + 2, position[2]]}
      >
        <Text
          fontSize={0.72}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor={textOutline}
        >
          {label}
        </Text>
      </Billboard>

      {/* Alert particle effect */}
      {hasAlert && !reduced && (
        <Sparkles
          position={[position[0], position[1] + 1.5, position[2]]}
          count={30}
          scale={ZONE_SIZE}
          size={2}
          speed={0.3}
          color={color}
        />
      )}
    </group>
  );
}
