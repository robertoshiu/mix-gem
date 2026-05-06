'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Sparkles, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '@/lib/animation';

const ZONE_SIZE = 11.5;
const L_MARKER_LEN = 1.5;

const ZONE_LABELS: Record<ZoneType, string> = {
  power: 'POWER MONITORING',
  'building-auto': 'BUILDING AUTO',
  gas: 'GAS DETECTION',
  fire: 'FIRE ALARM',
};

const ZONE_THEME: Record<ZoneType, { tokenName: string; fallbackHex: string; accentRgb: string }> = {
  power: { tokenName: '--sf-power-primary', fallbackHex: '#3b82f6', accentRgb: '59,130,246' },
  'building-auto': { tokenName: '--sf-ba-primary', fallbackHex: '#10b981', accentRgb: '16,185,129' },
  gas: { tokenName: '--sf-gas-primary', fallbackHex: '#f59e0b', accentRgb: '245,158,11' },
  fire: { tokenName: '--sf-fire-primary', fallbackHex: '#ef4444', accentRgb: '239,68,68' },
};

const sparkleConfig: Record<ZoneType, { count: number; speed: number }> = {
  power: { count: 16, speed: 0.24 },
  'building-auto': { count: 0, speed: 0 },
  gas: { count: 20, speed: 0.32 },
  fire: { count: 24, speed: 0.42 },
};

export type ZoneType = 'power' | 'building-auto' | 'gas' | 'fire';

export interface SubsystemZoneProps {
  zoneType: ZoneType;
  position: [number, number, number];
  onClick: () => void;
  hasAlert?: boolean;
  alertCount?: number;
  statusLabel?: string;
}

/**
 * Interactive 3D subsystem zone for the war room factory scene.
 *
 * Features:
 * - Colored floor plane per subsystem type
 * - Billboarded text label and alert status above the zone
 * - Hover highlight via emissive brightening
 * - Alert pulse animation via useFrame emissive cycling
 * - Sparkles particle effect when alert is active (per-zone caps)
 * - Corner L-markers and crossing floor guide lines
 * - Click handler for zone interaction
 */
export function SubsystemZone({
  zoneType,
  position,
  onClick,
  hasAlert = false,
  alertCount,
  statusLabel,
}: SubsystemZoneProps) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();

  const theme = ZONE_THEME[zoneType];
  const color =
    (typeof document !== 'undefined'
      ? getComputedStyle(document.documentElement).getPropertyValue(theme.tokenName).trim()
      : '') || theme.fallbackHex;
  const textColor = '#e2e8f0';
  const textOutline = '#0B0F19';
  const label = ZONE_LABELS[zoneType];

  const isAlerting = hasAlert || (alertCount ?? 0) > 0;
  const { count: sparkleCount, speed: sparkleSpeed } = sparkleConfig[zoneType];

  // Animate emissive: pulse when alerting, highlight when hovered
  useFrame((state) => {
    if (!materialRef.current) return;

    if (isAlerting) {
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

  const half = ZONE_SIZE / 2;
  const px = position[0];
  const py = position[1];
  const pz = position[2];

  // Corner L-marker line segments (4 corners × 2 segments each)
  const lMarkers: Array<[Array<[number, number, number]>, string]> = [
    // near-left corner: lines go +x and +z
    [[[px - half, py, pz - half], [px - half + L_MARKER_LEN, py, pz - half]], 'nl-x'],
    [[[px - half, py, pz - half], [px - half, py, pz - half + L_MARKER_LEN]], 'nl-z'],
    // near-right corner: lines go -x and +z
    [[[px + half, py, pz - half], [px + half - L_MARKER_LEN, py, pz - half]], 'nr-x'],
    [[[px + half, py, pz - half], [px + half, py, pz - half + L_MARKER_LEN]], 'nr-z'],
    // far-left corner: lines go +x and -z
    [[[px - half, py, pz + half], [px - half + L_MARKER_LEN, py, pz + half]], 'fl-x'],
    [[[px - half, py, pz + half], [px - half, py, pz + half - L_MARKER_LEN]], 'fl-z'],
    // far-right corner: lines go -x and -z
    [[[px + half, py, pz + half], [px + half - L_MARKER_LEN, py, pz + half]], 'fr-x'],
    [[[px + half, py, pz + half], [px + half, py, pz + half - L_MARKER_LEN]], 'fr-z'],
  ];

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
        <meshBasicMaterial color={color} transparent opacity={isAlerting ? 0.72 : 0.34} />
      </mesh>

      {/* Billboarded zone label */}
      <Billboard position={[position[0], position[1] + 2, position[2]]}>
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

      {/* Alert status label */}
      <Billboard position={[position[0], position[1] + 1.3, position[2]]}>
        <Text
          fontSize={0.4}
          color={isAlerting ? color : '#94a3b8'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor={textOutline}
        >
          {statusLabel || (isAlerting ? `${alertCount ?? 0} ALERTS` : 'NOMINAL')}
        </Text>
      </Billboard>

      {/* Alert particle effect */}
      {isAlerting && !reduced && sparkleCount > 0 && (
        <Sparkles
          position={[position[0], position[1] + 1.5, position[2]]}
          count={sparkleCount}
          scale={ZONE_SIZE}
          size={2}
          speed={sparkleSpeed}
          color={color}
        />
      )}

      {/* Corner L-markers */}
      {lMarkers.map(([seg, key]) => (
        <Line
          key={key}
          points={seg}
          color={color}
          lineWidth={1}
          transparent
          opacity={0.42}
        />
      ))}

      {/* Crossing floor guide lines */}
      <Line
        points={[[px - half, py, pz], [px + half, py, pz]]}
        color={color}
        lineWidth={0.5}
        transparent
        opacity={0.2}
      />
      <Line
        points={[[px, py, pz - half], [px, py, pz + half]]}
        color={color}
        lineWidth={0.5}
        transparent
        opacity={0.2}
      />
    </group>
  );
}