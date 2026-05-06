'use client';

import { Line } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CleanroomShell() {
  return (
    <>
      {/* North wall at z=-16 */}
      <mesh position={[0, 3.5, -16]}>
        <boxGeometry args={[32, 3.5, 0.2]} />
        <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.25} />
      </mesh>
      {/* South wall at z=16 */}
      <mesh position={[0, 3.5, 16]}>
        <boxGeometry args={[32, 3.5, 0.2]} />
        <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.25} />
      </mesh>
      {/* West wall at x=-16 */}
      <mesh position={[-16, 3.5, 0]}>
        <boxGeometry args={[0.2, 3.5, 32]} />
        <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.25} />
      </mesh>
      {/* East wall at x=16 */}
      <mesh position={[16, 3.5, 0]}>
        <boxGeometry args={[0.2, 3.5, 32]} />
        <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.25} />
      </mesh>
    </>
  );
}

interface ToolBayProps {
  position: [number, number, number];
  color: string;
}

export function ToolBay({ position, color }: ToolBayProps) {
  const boxes = [0, 1.5, 3].map((offset, i) => (
    <mesh key={i} position={[position[0] + offset, 0.5, position[2]]}>
      <boxGeometry args={[1.2, 1, 0.8]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.3} transparent opacity={0.6} />
    </mesh>
  ));
  return <group>{boxes}</group>;
}

interface UtilityCorridorProps {
  from: [number, number, number];
  to: [number, number, number];
}

export function UtilityCorridor({ from, to }: UtilityCorridorProps) {
  const midX = (from[0] + to[0]) / 2;
  const midZ = (from[2] + to[2]) / 2;
  const length = Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[2] - from[2], 2));
  return (
    <mesh position={[midX, 2.8, midZ]} rotation={[0, Math.atan2(to[0] - from[0], to[2] - from[2]), 0]}>
      <boxGeometry args={[0.3, 0.3, length]} />
      <meshStandardMaterial color="#94a3b8" roughness={0.8} metalness={0.5} transparent opacity={0.5} />
    </mesh>
  );
}

interface DataFlowLineProps {
  from: [number, number, number];
  to: [number, number, number];
}

export function DataFlowLine({ from, to }: DataFlowLineProps) {
  return <Line points={[from, to]} color="#38bdf8" lineWidth={1} dashed dashSize={0.5} gapSize={0.3} transparent opacity={0.45} />;
}

interface StatusBeaconProps {
  position: [number, number, number];
  color: string;
  pulse?: boolean;
}

export function StatusBeacon({ position, color, pulse = false }: StatusBeaconProps) {
  const sphereRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (sphereRef.current && pulse) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      sphereRef.current.scale.setScalar(s);
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 3, 8]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <mesh ref={sphereRef} position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={pulse ? 0.8 : 0.3} />
      </mesh>
    </group>
  );
}

interface ZoneAccentLightProps {
  position: [number, number, number];
  color: string;
  intensity?: number;
}

export function ZoneAccentLight({ position, color, intensity = 0.8 }: ZoneAccentLightProps) {
  return <pointLight position={position} intensity={intensity} color={color} />;
}