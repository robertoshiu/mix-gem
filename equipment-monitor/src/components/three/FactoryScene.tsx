'use client';

import { Billboard, Line, OrbitControls, Sparkles, Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Vec3 = [number, number, number];

const FLOOR_OUTLINE: Vec3[] = [
  [-18, 0.08, -18],
  [18, 0.08, -18],
  [18, 0.08, 18],
  [-18, 0.08, 18],
  [-18, 0.08, -18],
];

const SUBSYSTEM_LINKS: Array<{ from: Vec3; to: Vec3; color: string }> = [
  { from: [-6.5, 3.1, -6.5], to: [0, 2.7, 0], color: '#3b82f6' },
  { from: [6.5, 3.1, -6.5], to: [0, 2.7, 0], color: '#10b981' },
  { from: [-6.5, 3.1, 6.5], to: [0, 2.7, 0], color: '#f59e0b' },
  { from: [6.5, 3.1, 6.5], to: [0, 2.7, 0], color: '#ef4444' },
];

const TOOL_POSITIONS: Array<{ position: Vec3; color: string; label: string; rotation?: number }> = [
  { position: [-2.8, 0.1, -10.4], color: '#38bdf8', label: 'ETCH-12' },
  { position: [2.8, 0.1, -10.4], color: '#22d3ee', label: 'CVD-05' },
  { position: [-2.8, 0.1, 10.4], color: '#a78bfa', label: 'LITHO-03', rotation: Math.PI },
  { position: [2.8, 0.1, 10.4], color: '#60a5fa', label: 'MET-08', rotation: Math.PI },
];

function FacilityShell() {
  const floorTiles = useMemo(() => {
    const tiles: Vec3[] = [];
    for (let x = -17; x <= 17; x += 1) {
      for (let z = -17; z <= 17; z += 1) {
        tiles.push([x, 0.018, z]);
      }
    }
    return tiles;
  }, []);

  const ceilingPanels = useMemo(() => {
    const panels: Vec3[] = [];
    for (let x = -15; x <= 15; x += 3) {
      for (let z = -15; z <= 15; z += 3) {
        panels.push([x, 5.86, z]);
      }
    }
    return panels;
  }, []);

  return (
    <group>
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[38, 38]} />
        <meshStandardMaterial color="#09111d" roughness={0.76} metalness={0.18} />
      </mesh>

      {floorTiles.map(([x, y, z]) => {
        const isGrate = Math.abs(x) === 5 || Math.abs(z) === 5 || (Math.abs(x) > 12 && z % 4 === 0);
        const isAisle = Math.abs(x) <= 1 || Math.abs(z) <= 1;
        return (
          <mesh key={`${x}-${z}`} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.88, 0.88]} />
            <meshStandardMaterial
              color={isGrate ? '#1e293b' : isAisle ? '#172033' : (x + z) % 2 === 0 ? '#111827' : '#0f172a'}
              roughness={isGrate ? 0.42 : 0.68}
              metalness={isGrate ? 0.54 : 0.2}
            />
          </mesh>
        );
      })}

      <Line points={FLOOR_OUTLINE} color="#38bdf8" lineWidth={2.4} transparent opacity={0.86} dashed dashSize={1.2} gapSize={0.32} />
      <Line points={[[-18, 0.13, 0], [18, 0.13, 0]]} color="#64748b" lineWidth={1} transparent opacity={0.46} />
      <Line points={[[0, 0.13, -18], [0, 0.13, 18]]} color="#64748b" lineWidth={1} transparent opacity={0.46} />

      {[
        { position: [0, 3.1, -18] as Vec3, size: [36, 6.0, 0.26] as Vec3 },
        { position: [0, 3.1, 18] as Vec3, size: [36, 6.0, 0.26] as Vec3 },
        { position: [-18, 3.1, 0] as Vec3, size: [0.26, 6.0, 36] as Vec3 },
        { position: [18, 3.1, 0] as Vec3, size: [0.26, 6.0, 36] as Vec3 },
      ].map((wall) => (
        <mesh key={wall.position.join('-')} position={wall.position} receiveShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color="#334155" transparent opacity={0.24} roughness={0.38} metalness={0.34} />
        </mesh>
      ))}

      {[-13.5, -4.5, 4.5, 13.5].map((x) => (
        <group key={x} position={[x, 0, -17.4]}>
          <mesh position={[0, 2.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.34, 5.8, 0.34]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.48} metalness={0.44} />
          </mesh>
          <mesh position={[0, 5.25, 0]} castShadow>
            <boxGeometry args={[4.4, 0.16, 0.48]} />
            <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={0.16} roughness={0.28} metalness={0.34} />
          </mesh>
        </group>
      ))}

      {ceilingPanels.map(([x, y, z], index) => (
        <group key={`${x}-${z}`} position={[x, y, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.25, 2.25]} />
            <meshStandardMaterial color={index % 3 === 0 ? '#dbeafe' : '#64748b'} emissive="#93c5fd" emissiveIntensity={index % 3 === 0 ? 0.18 : 0.04} transparent opacity={0.34} />
          </mesh>
          <pointLight position={[0, -0.16, 0]} intensity={index % 5 === 0 ? 0.16 : 0.06} color="#dbeafe" distance={5.5} />
        </group>
      ))}
    </group>
  );
}

function Label({ position, title, detail, color, width = 3.5 }: { position: Vec3; title: string; detail: string; color: string; width?: number }) {
  return (
    <Billboard position={position}>
      <Text fontSize={0.28} color="#e2e8f0" anchorX="center" anchorY="middle" outlineWidth={0.035} outlineColor="#020617">
        {`${title}\n${detail}`}
      </Text>
      <mesh position={[0, 0, -0.035]}>
        <planeGeometry args={[width, 0.78]} />
        <meshBasicMaterial color={color} transparent opacity={0.17} />
      </mesh>
    </Billboard>
  );
}

function WarningStripe({ position, rotation = 0, length = 6.5, color = '#f59e0b' }: { position: Vec3; rotation?: number; length?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[-length / 2 + index * 0.76, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <planeGeometry args={[0.42, 0.12]} />
          <meshBasicMaterial color={index % 2 === 0 ? color : '#020617'} transparent opacity={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function PowerYard() {
  return (
    <group position={[-6.5, 0.12, -6.5]}>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[7.4, 0.16, 6.8]} />
        <meshStandardMaterial color="#0f2450" roughness={0.52} metalness={0.24} transparent opacity={0.72} />
      </mesh>
      <WarningStripe position={[0, 0.2, 3.02]} length={6.6} color="#3b82f6" />

      {[-2.15, 0, 2.15].map((x, index) => (
        <group key={x} position={[x, 0, -0.85]}>
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.05, 1.45, 1.52]} />
            <meshStandardMaterial color="#1d4ed8" emissive="#3b82f6" emissiveIntensity={0.14 + index * 0.03} roughness={0.34} metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.62, 0.66]}>
            <boxGeometry args={[1.2, 0.14, 0.18]} />
            <meshStandardMaterial color="#bfdbfe" emissive="#60a5fa" emissiveIntensity={0.16} />
          </mesh>
          {[-0.36, 0.36].map((ix) => (
            <mesh key={ix} position={[ix, 1.78, -0.24]} castShadow>
              <cylinderGeometry args={[0.075, 0.075, 0.48, 14]} />
              <meshStandardMaterial color="#dbeafe" emissive="#60a5fa" emissiveIntensity={0.24} metalness={0.42} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}
      {[-3.1, -1.55, 0, 1.55, 3.1].map((x) => (
        <group key={x} position={[x, 0, 1.62]}>
          <mesh position={[0, 0.92, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 1.84, 10]} />
            <meshStandardMaterial color="#bfdbfe" emissive="#3b82f6" emissiveIntensity={0.18} />
          </mesh>
          <mesh position={[0, 1.92, 0]}>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshBasicMaterial color="#dbeafe" />
          </mesh>
        </group>
      ))}
      <Line points={[[-3.4, 2.08, 1.62], [3.4, 2.08, 1.62]]} color="#93c5fd" lineWidth={2.4} transparent opacity={0.9} />
      <Line points={[[-3.1, 1.42, -1.8], [3.1, 1.42, -1.8]]} color="#60a5fa" lineWidth={1.2} transparent opacity={0.58} />
      <Label position={[0, 3.26, 0]} title="POWER SUBSTATION" detail="22.8kV / UPS / TRANSFORMERS" color="#3b82f6" width={3.8} />
    </group>
  );
}

function HvacPlant() {
  const fanRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!fanRef.current) return;
    fanRef.current.rotation.z = state.clock.elapsedTime * 1.2;
  });

  return (
    <group position={[6.5, 0.12, -6.5]}>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[7.4, 0.16, 6.6]} />
        <meshStandardMaterial color="#064e3b" roughness={0.52} metalness={0.18} transparent opacity={0.66} />
      </mesh>
      <WarningStripe position={[0, 0.2, 2.94]} length={6.5} color="#10b981" />

      {[-2.55, -0.85, 0.85, 2.55].map((x) => (
        <group key={x} position={[x, 2.02, -0.75]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.56, 0.56, 0.3, 40]} />
            <meshStandardMaterial color="#cbd5e1" emissive="#10b981" emissiveIntensity={0.1} roughness={0.28} metalness={0.48} />
          </mesh>
          <group ref={x === -0.85 ? fanRef : undefined}>
            <Line points={[[0, -0.44, 0], [0, 0.44, 0]]} color="#34d399" lineWidth={1.7} />
            <Line points={[[-0.44, 0, 0], [0.44, 0, 0]]} color="#34d399" lineWidth={1.7} />
          </group>
        </group>
      ))}
      {[-2.45, 0, 2.45].map((x) => (
        <mesh key={x} position={[x, 0.78, 1.38]} castShadow receiveShadow>
          <boxGeometry args={[1.34, 1.1, 0.86]} />
          <meshStandardMaterial color="#134e4a" emissive="#10b981" emissiveIntensity={0.08} roughness={0.34} metalness={0.34} />
        </mesh>
      ))}
      <mesh position={[0, 2.34, 1.38]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 6.1, 18]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.26} metalness={0.62} />
      </mesh>
      <Line points={[[-3.1, 2.75, 1.38], [3.1, 2.75, 1.38]]} color="#6ee7b7" lineWidth={1.4} transparent opacity={0.68} />
      <Label position={[0, 3.44, 0]} title="CLEANROOM HVAC" detail="FFU / MAKE-UP AIR / PRESSURE" color="#10b981" width={4.2} />
    </group>
  );
}

function GasFarm() {
  return (
    <group position={[-6.5, 0.12, 6.5]}>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[7.4, 0.16, 6.8]} />
        <meshStandardMaterial color="#451a03" roughness={0.5} metalness={0.18} transparent opacity={0.7} />
      </mesh>
      <WarningStripe position={[0, 0.2, -3.04]} length={6.5} color="#f59e0b" />

      {[-2.8, -1.68, -0.56, 0.56, 1.68, 2.8].map((x, index) => (
        <group key={x} position={[x, 0.98, -0.72]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.72, 1.88, 0.62]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#78350f' : '#334155'} emissive="#f59e0b" emissiveIntensity={0.09} roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.94, 0.45]}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshBasicMaterial color={index === 2 ? '#ef4444' : '#fbbf24'} />
          </mesh>
          <mesh position={[0, -0.18, 0.44]}>
            <boxGeometry args={[0.42, 0.08, 0.04]} />
            <meshBasicMaterial color="#fde68a" transparent opacity={0.8} />
          </mesh>
        </group>
      ))}
      {[-2.05, 0, 2.05].map((x) => (
        <group key={x} position={[x, 0, 1.38]}>
          <mesh position={[0, 0.96, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.48, 1.9, 28]} />
            <meshStandardMaterial color="#64748b" emissive="#f59e0b" emissiveIntensity={0.08} roughness={0.28} metalness={0.58} />
          </mesh>
          <mesh position={[0, 1.96, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.29, 0.025, 8, 24]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </group>
      ))}
      <Line points={[[-3.4, 2.05, -0.22], [3.4, 2.05, -0.22]]} color="#f59e0b" lineWidth={2} transparent opacity={0.86} />
      <Line points={[[-3.0, 1.18, 1.38], [3.0, 1.18, 1.38]]} color="#fbbf24" lineWidth={1.2} dashed dashSize={0.24} gapSize={0.16} transparent opacity={0.72} />
      <Sparkles count={22} scale={[6, 2.2, 2.8]} size={1.2} speed={0.12} color="#f59e0b" />
      <Label position={[0, 3.28, 0]} title="SPECIALTY GAS BUNKER" detail="TOXIC GAS / VMB / SCRUBBER" color="#f59e0b" width={4.0} />
    </group>
  );
}

function FireSafetyPlant() {
  return (
    <group position={[6.5, 0.12, 6.5]}>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[7.4, 0.16, 6.7]} />
        <meshStandardMaterial color="#450a0a" roughness={0.52} metalness={0.18} transparent opacity={0.68} />
      </mesh>
      <WarningStripe position={[0, 0.2, -3]} length={6.6} color="#ef4444" />

      {[-1.55, 0, 1.55].map((x) => (
        <group key={x} position={[x, 0.73, -0.85]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.08, 1.24, 0.72]} />
            <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={0.14} roughness={0.32} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.82, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.31, 32]} />
            <meshBasicMaterial color="#fecaca" transparent opacity={0.78} />
          </mesh>
        </group>
      ))}
      {[-2.85, -1.42, 0, 1.42, 2.85].map((x) => (
        <group key={x} position={[x, 2.24, 1.36]}>
          <mesh>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.72} />
          </mesh>
          <mesh position={[0, -0.38, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.78, 8]} />
            <meshStandardMaterial color="#fecaca" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.92, 1.54]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 5.9, 18]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.1} metalness={0.46} roughness={0.3} />
      </mesh>
      <Line points={[[-3.1, 2.24, 1.36], [3.1, 2.24, 1.36]]} color="#ef4444" lineWidth={2} transparent opacity={0.88} />
      <Label position={[0, 3.28, 0]} title="FIRE & LIFE SAFETY" detail="VESDA / SPRINKLER / FM-200" color="#ef4444" width={4.0} />
    </group>
  );
}

function ProcessTool({ position, color, label, rotation = 0 }: { position: Vec3; color: string; label: string; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.84, 1.45]} />
        <meshStandardMaterial color="#dbeafe" emissive={color} emissiveIntensity={0.08} roughness={0.36} metalness={0.26} />
      </mesh>
      <mesh position={[0.74, 1.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.82, 0.88, 1.24]} />
        <meshStandardMaterial color="#1e293b" emissive={color} emissiveIntensity={0.18} roughness={0.3} metalness={0.42} />
      </mesh>
      <mesh position={[-0.7, 1.18, 0]} castShadow>
        <cylinderGeometry args={[0.45, 0.34, 0.86, 28]} />
        <meshStandardMaterial color="#f8fafc" emissive="#38bdf8" emissiveIntensity={0.09} roughness={0.28} metalness={0.32} />
      </mesh>
      <mesh position={[0, 0.12, 0.86]}>
        <boxGeometry args={[1.6, 0.16, 0.12]} />
        <meshBasicMaterial color={color} transparent opacity={0.74} />
      </mesh>
      <Label position={[0, 2.45, 0]} title={label} detail="PROCESS TOOL ONLINE" color={color} width={2.7} />
    </group>
  );
}

function CentralCommandCore() {
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!beaconRef.current) return;
    const scale = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.08;
    beaconRef.current.scale.setScalar(scale);
  });

  return (
    <group position={[0, 0.12, 0]}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.2, 3.5, 0.34, 72]} />
        <meshStandardMaterial color="#0f172a" emissive="#22d3ee" emissiveIntensity={0.12} roughness={0.24} metalness={0.58} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => {
        const angle = (index / 10) * Math.PI * 2;
        return (
          <group key={index} position={[Math.cos(angle) * 2.25, 0.82, Math.sin(angle) * 2.25]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.86, 0.48, 0.22]} />
              <meshStandardMaterial color="#020617" emissive="#22d3ee" emissiveIntensity={0.18} roughness={0.32} metalness={0.44} />
            </mesh>
            <mesh position={[0, 0.3, -0.07]} rotation={[-0.42, 0, 0]}>
              <planeGeometry args={[0.66, 0.28]} />
              <meshBasicMaterial color={index % 3 === 0 ? '#ef4444' : '#22d3ee'} transparent opacity={0.74} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[4.25, 1.15, 4.25]} />
        <meshStandardMaterial color="#111827" emissive="#22d3ee" emissiveIntensity={0.12} wireframe transparent opacity={0.78} />
      </mesh>
      <mesh ref={beaconRef} position={[0, 2.45, 0]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial color="#f8fafc" emissive="#22d3ee" emissiveIntensity={1.15} roughness={0.18} metalness={0.22} />
      </mesh>
      <Line points={[[0, 0.44, -3.4], [0, 0.44, 3.4]]} color="#22d3ee" lineWidth={1.7} transparent opacity={0.74} />
      <Line points={[[-3.4, 0.44, 0], [3.4, 0.44, 0]]} color="#22d3ee" lineWidth={1.7} transparent opacity={0.74} />
      <Label position={[0, 3.26, 0]} title="FACILITY COMMAND CORE" detail="BMS / EHS / POWER TELEMETRY" color="#22d3ee" width={4.3} />
    </group>
  );
}

function PipeRackNetwork() {
  return (
    <group>
      {[-13.2, 13.2].map((x) => (
        <group key={x} position={[x, 3.02, 0]}>
          {[0, 0.28, 0.56].map((offset, index) => (
            <mesh key={offset} position={[offset, index * 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.07 - index * 0.01, 0.07 - index * 0.01, 30.6, 16]} />
              <meshStandardMaterial
                color={index === 0 ? '#94a3b8' : x < 0 ? '#f59e0b' : '#10b981'}
                emissive={index === 0 ? '#000000' : x < 0 ? '#f59e0b' : '#10b981'}
                emissiveIntensity={index === 0 ? 0 : 0.12}
                roughness={0.26}
                metalness={0.62}
              />
            </mesh>
          ))}
        </group>
      ))}

      {[-13.2, 13.2].map((x) =>
        [-14, -8, -2, 4, 10, 16].map((z) => (
          <Line key={`${x}-${z}`} points={[[x, 2.55, z], [x, 3.38, z + 0.8], [x, 2.55, z + 1.6]]} color="#64748b" lineWidth={0.9} transparent opacity={0.58} />
        )),
      )}

      {SUBSYSTEM_LINKS.map((link) => (
        <Line key={`${link.from.join('-')}-${link.to.join('-')}`} points={[link.from, link.to]} color={link.color} lineWidth={1.45} dashed dashSize={0.4} gapSize={0.22} transparent opacity={0.76} />
      ))}
    </group>
  );
}

function AmhsRail() {
  const carrierRef = useRef<THREE.Group>(null);
  const path: Vec3[] = [[-10.5, 3.7, -10.5], [10.5, 3.7, -10.5], [10.5, 3.7, 10.5], [-10.5, 3.7, 10.5]];

  useFrame((state) => {
    if (!carrierRef.current) return;
    const t = (state.clock.elapsedTime * 0.18) % path.length;
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
      <Line points={[...path, path[0]]} color="#e2e8f0" lineWidth={2.5} transparent opacity={0.86} />
      <Line points={[[-10.5, 3.42, -10.5], [10.5, 3.42, -10.5], [10.5, 3.42, 10.5], [-10.5, 3.42, 10.5], [-10.5, 3.42, -10.5]]} color="#38bdf8" lineWidth={1.2} dashed dashSize={0.42} gapSize={0.24} transparent opacity={0.52} />
      <group ref={carrierRef}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.48, 0.8]} />
          <meshStandardMaterial color="#f8fafc" emissive="#22d3ee" emissiveIntensity={0.22} roughness={0.24} metalness={0.38} />
        </mesh>
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.28, 0.34, 0.4, 24]} />
          <meshStandardMaterial color="#cbd5e1" emissive="#60a5fa" emissiveIntensity={0.14} roughness={0.28} metalness={0.34} />
        </mesh>
        <Label position={[0, 0.92, 0]} title="OHT FOUP-A17" detail="25 WAFERS / ETA 04:20" color="#22d3ee" width={2.9} />
      </group>
    </group>
  );
}

function DataPulse({ from, to, color, speed }: { from: Vec3; to: Vec3; color: string; speed: number }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = (Math.sin(state.clock.elapsedTime * speed) + 1) / 2;
    ref.current.position.set(
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + (to[2] - from[2]) * t,
    );
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight intensity={0.22} color={color} distance={3.2} />
    </group>
  );
}

function TelemetryPulses() {
  return (
    <group>
      {SUBSYSTEM_LINKS.map((link, index) => (
        <DataPulse key={link.color} from={link.from} to={link.to} color={link.color} speed={1.5 + index * 0.26} />
      ))}
    </group>
  );
}

/**
 * War-room 3D factory district: semiconductor cleanroom with raised floor tiles,
 * ceiling FFUs, AMHS rail, process tools, utility chases, and realistic facility
 * support areas around a central command core. Interactive zones remain layered
 * by SubsystemZone so the existing dashboard controls still work.
 */
export function FactoryScene() {
  return (
    <>
      <color attach="background" args={['#050914']} />
      <fog attach="fog" args={['#07111f', 18, 58]} />
      <ambientLight intensity={0.28} color="#f8fafc" />
      <directionalLight position={[15, 25, 14]} intensity={0.78} color="#dbeafe" castShadow />
      <directionalLight position={[-16, 13, -10]} intensity={0.25} color="#f59e0b" />
      <pointLight position={[0, 5.2, 0]} intensity={1.35} color="#22d3ee" distance={24} />
      <pointLight position={[-6.5, 3.6, 6.5]} intensity={0.48} color="#f59e0b" distance={12} />
      <pointLight position={[6.5, 3.6, 6.5]} intensity={0.4} color="#ef4444" distance={12} />

      <OrbitControls enableRotate enableZoom enablePan target={[0, 1.1, 0]} minDistance={12} maxDistance={50} maxPolarAngle={Math.PI / 2.08} />

      <FacilityShell />
      <PipeRackNetwork />
      <AmhsRail />
      {TOOL_POSITIONS.map((tool) => (
        <ProcessTool key={tool.label} {...tool} />
      ))}
      <PowerYard />
      <HvacPlant />
      <GasFarm />
      <FireSafetyPlant />
      <CentralCommandCore />
      <TelemetryPulses />
    </>
  );
}
