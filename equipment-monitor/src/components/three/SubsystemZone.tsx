'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const ZONE_SIZE = 12;

const ZONE_LABELS: Record<ZoneType, string> = {
  power: 'POWER MONITORING',
  'building-auto': 'BUILDING AUTO',
  gas: 'GAS DETECTION',
  fire: 'FIRE ALARM',
};

export type ZoneType = 'power' | 'building-auto' | 'gas' | 'fire';

export interface SubsystemZoneProps {
  zoneType: ZoneType;
  position: [number, number, number];
  onClick: () => void;
  hasAlert?: boolean;
}

/** Resolve a CSS custom property to a colour string at mount time. */
function useCssColour(name: string, fallback: string): string {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    setValue(resolved || fallback);
  }, [name, fallback]);
  return value;
}

function getCSSVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
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

  const color = useCssColour(
    zoneType === 'power'
      ? '--sf-power-primary'
      : zoneType === 'building-auto'
        ? '--sf-ba-primary'
        : zoneType === 'gas'
          ? '--sf-gas-primary'
          : '--sf-fire-primary',
    zoneType === 'power'
      ? '#3b82f6'
      : zoneType === 'building-auto'
        ? '#10b981'
        : zoneType === 'gas'
          ? '#f59e0b'
          : '#ef4444',
  );

  const textColor = useCssColour('--sf-text-primary', '#e2e8f0');
  const textOutline = useCssColour('--sf-bg-base', '#0B0F19');
  const label = ZONE_LABELS[zoneType];

  // Animate emissive: pulse when alerting, highlight when hovered
  useFrame((state) => {
    if (!materialRef.current) return;

    if (hasAlert) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.5 + 0.5;
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
      {/* Floor plane */}
      <mesh
        position={position}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[ZONE_SIZE, 0.1, ZONE_SIZE]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Billboarded zone label */}
      <Billboard
        position={[position[0], position[1] + 2, position[2]]}
      >
        <Text
          fontSize={0.8}
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
      {hasAlert && (
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
