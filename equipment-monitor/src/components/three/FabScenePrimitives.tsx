'use client';

import { Billboard, Line, Sparkles, Text } from '@react-three/drei';
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
  const pulseRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!pulseRef.current) return;
    const t = (Math.sin(state.clock.elapsedTime * 2.4) + 1) / 2;
    pulseRef.current.position.set(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    );
  });

  return (
    <>
      <Line points={[from, to]} color="#38bdf8" lineWidth={1} dashed dashSize={0.5} gapSize={0.3} transparent opacity={0.45} />
      <group ref={pulseRef}>
        <mesh>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      </group>
    </>
  );
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

export function TransformerBank({ position, color }: ToolBayProps) {
  return (
    <group position={position}>
      {[-1.1, 0, 1.1].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.8, 1.4, 1.2]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.42} metalness={0.45} transparent opacity={0.72} />
          </mesh>
          {[ -0.24, 0.24 ].map((ix) => (
            <mesh key={ix} position={[ix, 1.65, -0.2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.34, 10]} />
              <meshStandardMaterial color="#dbeafe" emissive={color} emissiveIntensity={0.25} />
            </mesh>
          ))}
        </group>
      ))}
      <Line points={[[-1.8, 1.85, 0], [1.8, 1.85, 0]]} color={color} lineWidth={2} />
    </group>
  );
}

export function HvacArray({ position, color }: ToolBayProps) {
  return (
    <group position={position}>
      {[-1.4, 0, 1.4].map((x) => (
        <group key={x} position={[x, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.45, 0.45, 0.2, 32]} />
            <meshStandardMaterial color="#94a3b8" emissive={color} emissiveIntensity={0.14} transparent opacity={0.74} />
          </mesh>
          <Line points={[[0, -0.38, 0], [0, 0.38, 0]]} color={color} lineWidth={1.4} />
          <Line points={[[-0.38, 0, 0], [0.38, 0, 0]]} color={color} lineWidth={1.4} />
        </group>
      ))}
      <UtilityCorridor from={[-2.2, 2.2, 0]} to={[2.2, 2.2, 0]} />
    </group>
  );
}

export function GasCabinetCluster({ position, color }: ToolBayProps) {
  return (
    <group position={position}>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.95, 0]}>
          <boxGeometry args={[0.9, 1.9, 0.65]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} roughness={0.36} metalness={0.35} transparent opacity={0.72} />
        </mesh>
      ))}
      <mesh position={[0, 1.2, 1]}>
        <cylinderGeometry args={[0.36, 0.5, 2.2, 24]} />
        <meshStandardMaterial color="#64748b" emissive={color} emissiveIntensity={0.12} transparent opacity={0.7} />
      </mesh>
      <Sparkles count={16} scale={2.4} size={1.5} speed={0.18} color={color} />
    </group>
  );
}

export function FireSuppressionPanel({ position, color }: ToolBayProps) {
  return (
    <group position={position}>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.35, 1.7, 0.35]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} roughness={0.34} metalness={0.2} transparent opacity={0.78} />
      </mesh>
      {[-1.6, -0.6, 0.6, 1.6].map((x) => (
        <mesh key={x} position={[x, 2.4, 0]}>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      <Line points={[[-1.8, 2.4, 0], [1.8, 2.4, 0]]} color={color} lineWidth={1.4} />
    </group>
  );
}

interface HudOverlayProps {
  position: [number, number, number];
  title: string;
  lines: string[];
  color: string;
}

export function HudOverlay({ position, title, lines, color }: HudOverlayProps) {
  return (
    <Billboard position={position}>
      <Text fontSize={0.24} color="#e2e8f0" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#020617">
        {`${title}\n${lines.join('\n')}`}
      </Text>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.7, 1.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.13} />
      </mesh>
    </Billboard>
  );
}

interface LithoToolProps {
  position: [number, number, number];
  color: string;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export function LithoScanner({ position, color, label, selected, onClick }: LithoToolProps) {
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onClick?.(); }}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[1.6, 2.2, 1.2]} />
        <meshStandardMaterial color="#1e293b" emissive={color} emissiveIntensity={selected ? 0.38 : 0.18} metalness={0.45} roughness={0.34} />
      </mesh>
      <mesh position={[0, 2.45, 0]}>
        <cylinderGeometry args={[0.45, 0.35, 0.8, 28]} />
        <meshStandardMaterial color="#cbd5e1" emissive="#22d3ee" emissiveIntensity={0.18} transparent opacity={0.78} />
      </mesh>
      <mesh position={[0, 0.22, 0.2]}>
        <boxGeometry args={[1.2, 0.18, 0.8]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <HudOverlay position={[0, 3.35, 0]} title={label} lines={[selected ? 'DETAIL LINKED' : 'READY', '193i SCANNER']} color={color} />
    </group>
  );
}

export function CoaterDeveloperTrack({ position, color, label, selected, onClick }: LithoToolProps) {
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onClick?.(); }}>
      {[-1.6, -0.8, 0, 0.8, 1.6].map((x, index) => (
        <mesh key={x} position={[x, 0.55, 0]}>
          <boxGeometry args={[0.62, 1.1, 1.4]} />
          <meshStandardMaterial color="#334155" emissive={color} emissiveIntensity={selected ? 0.26 : 0.1 + index * 0.02} roughness={0.46} metalness={0.25} />
        </mesh>
      ))}
      <Line points={[[-2.1, 1.25, 0], [2.1, 1.25, 0]]} color={color} lineWidth={2} />
      <HudOverlay position={[0, 2.35, 0]} title={label} lines={['HMDS COAT BAKE DEV', selected ? 'ACTIVE LOT' : 'IDLE SLOT']} color={color} />
    </group>
  );
}

export function MetrologyTool({ position, color, label, selected, onClick }: LithoToolProps) {
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onClick?.(); }}>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.1, 1.5, 1.1]} />
        <meshStandardMaterial color="#0f172a" emissive={color} emissiveIntensity={selected ? 0.32 : 0.16} roughness={0.32} metalness={0.38} />
      </mesh>
      <mesh position={[0, 1.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.42, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.72} />
      </mesh>
      <HudOverlay position={[0, 2.65, 0]} title={label} lines={['METROLOGY', selected ? 'SELECTED' : 'SAMPLING']} color={color} />
    </group>
  );
}

export function AmhsRail({ color }: { color: string }) {
  const carrierRef = useRef<THREE.Group>(null);
  const path: Array<[number, number, number]> = [[-8, 3.2, -7], [8, 3.2, -7], [8, 3.2, 7], [-8, 3.2, 7]];
  useFrame((state) => {
    if (!carrierRef.current) return;
    const t = (state.clock.elapsedTime * 0.14) % 4;
    const index = Math.floor(t);
    const next = (index + 1) % path.length;
    const local = t - index;
    const from = path[index];
    const to = path[next];
    carrierRef.current.position.set(
      from[0] + (to[0] - from[0]) * local,
      from[1] + (to[1] - from[1]) * local,
      from[2] + (to[2] - from[2]) * local,
    );
  });

  return (
    <group>
      <Line points={[...path, path[0]]} color={color} lineWidth={2.2} transparent opacity={0.8} />
      <group ref={carrierRef}>
        <mesh>
          <boxGeometry args={[0.65, 0.45, 0.65]} />
          <meshStandardMaterial color="#f8fafc" emissive={color} emissiveIntensity={0.22} roughness={0.28} metalness={0.32} />
        </mesh>
        <HudOverlay position={[0, 0.9, 0]} title="FOUP-A17" lines={['25 WAFERS', 'ETA 04:20']} color={color} />
      </group>
    </group>
  );
}
