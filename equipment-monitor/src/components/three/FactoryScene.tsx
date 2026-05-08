'use client';

import { Billboard, Line, OrbitControls, Text } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Vec3 = [number, number, number];

const FLOOR_OUTLINE: Vec3[] = [
  [-16, 0.08, -16],
  [16, 0.08, -16],
  [16, 0.08, 16],
  [-16, 0.08, 16],
  [-16, 0.08, -16],
];

const SUBSYSTEM_LINKS: Array<{ from: Vec3; to: Vec3; color: string }> = [
  { from: [-6.5, 2.8, -6.5], to: [0, 2.4, 0], color: '#3b82f6' },
  { from: [6.5, 2.8, -6.5], to: [0, 2.4, 0], color: '#10b981' },
  { from: [-6.5, 2.8, 6.5], to: [0, 2.4, 0], color: '#f59e0b' },
  { from: [6.5, 2.8, 6.5], to: [0, 2.4, 0], color: '#ef4444' },
];

function FacilityShell() {
  const floorTiles = useMemo(() => {
    const tiles: Vec3[] = [];
    for (let x = -14; x <= 14; x += 2) {
      for (let z = -14; z <= 14; z += 2) {
        tiles.push([x, 0.02, z]);
      }
    }
    return tiles;
  }, []);

  return (
    <group>
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[34, 34]} />
        <meshStandardMaterial color="#0b1220" roughness={0.82} metalness={0.12} />
      </mesh>

      {floorTiles.map(([x, y, z]) => (
        <mesh key={`${x}-${z}`} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.82, 1.82]} />
          <meshStandardMaterial color={(Math.round(x + z) / 2) % 2 === 0 ? '#111827' : '#0f172a'} roughness={0.74} metalness={0.16} transparent opacity={0.82} />
        </mesh>
      ))}

      <Line points={FLOOR_OUTLINE} color="#38bdf8" lineWidth={2.2} transparent opacity={0.78} dashed dashSize={1.2} gapSize={0.34} />

      {[
        { position: [0, 3.0, -16] as Vec3, size: [32, 5.8, 0.22] as Vec3 },
        { position: [-16, 3.0, 0] as Vec3, size: [0.22, 5.8, 32] as Vec3 },
        { position: [16, 3.0, 0] as Vec3, size: [0.22, 5.8, 32] as Vec3 },
      ].map((wall) => (
        <mesh key={wall.position.join('-')} position={wall.position}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.18} />
        </mesh>
      ))}

      {[-12, -6, 0, 6, 12].map((x) => (
        <group key={x} position={[x, 0, -14.4]}>
          <mesh position={[0, 2.2, 0]}>
            <boxGeometry args={[0.32, 4.4, 0.32]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.34} />
          </mesh>
          <mesh position={[0, 4.55, 0]}>
            <boxGeometry args={[2.3, 0.18, 0.5]} />
            <meshStandardMaterial color="#cbd5e1" emissive="#38bdf8" emissiveIntensity={0.08} roughness={0.38} metalness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Label({ position, title, detail, color }: { position: Vec3; title: string; detail: string; color: string }) {
  return (
    <Billboard position={position}>
      <Text fontSize={0.34} color="#e2e8f0" anchorX="center" anchorY="middle" outlineWidth={0.035} outlineColor="#020617">
        {`${title}\n${detail}`}
      </Text>
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[3.3, 0.86]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} />
      </mesh>
    </Billboard>
  );
}

function PowerYard() {
  return (
    <group position={[-6.5, 0.12, -6.5]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[7.0, 0.16, 6.2]} />
        <meshStandardMaterial color="#172554" roughness={0.55} metalness={0.18} transparent opacity={0.58} />
      </mesh>
      {[-2.1, 0, 2.1].map((x) => (
        <group key={x} position={[x, 0, -0.6]}>
          <mesh position={[0, 0.82, 0]}>
            <boxGeometry args={[1.0, 1.45, 1.45]} />
            <meshStandardMaterial color="#1d4ed8" emissive="#3b82f6" emissiveIntensity={0.16} roughness={0.36} metalness={0.56} />
          </mesh>
          {[-0.32, 0.32].map((ix) => (
            <mesh key={ix} position={[ix, 1.72, -0.2]}>
              <cylinderGeometry args={[0.07, 0.07, 0.46, 12]} />
              <meshStandardMaterial color="#dbeafe" emissive="#60a5fa" emissiveIntensity={0.22} metalness={0.35} roughness={0.24} />
            </mesh>
          ))}
        </group>
      ))}
      {[-2.8, -1.4, 0, 1.4, 2.8].map((x) => (
        <mesh key={x} position={[x, 1.7, 1.55]}>
          <cylinderGeometry args={[0.045, 0.045, 2.1, 8]} />
          <meshStandardMaterial color="#bfdbfe" emissive="#3b82f6" emissiveIntensity={0.2} />
        </mesh>
      ))}
      <Line points={[[-3.2, 2.0, 1.55], [3.2, 2.0, 1.55]]} color="#93c5fd" lineWidth={2} transparent opacity={0.85} />
      <Label position={[0, 3.1, 0]} title="POWER SUBSTATION" detail="UPS / TRANSFORMERS / PF" color="#3b82f6" />
    </group>
  );
}

function HvacPlant() {
  return (
    <group position={[6.5, 0.12, -6.5]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[7.2, 0.16, 6.0]} />
        <meshStandardMaterial color="#064e3b" roughness={0.54} metalness={0.15} transparent opacity={0.5} />
      </mesh>
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <group key={x} position={[x, 1.95, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.52, 0.52, 0.28, 36]} />
            <meshStandardMaterial color="#cbd5e1" emissive="#10b981" emissiveIntensity={0.11} roughness={0.32} metalness={0.42} />
          </mesh>
          <Line points={[[0, -0.42, 0], [0, 0.42, 0]]} color="#10b981" lineWidth={1.4} />
          <Line points={[[-0.42, 0, 0], [0.42, 0, 0]]} color="#10b981" lineWidth={1.4} />
        </group>
      ))}
      {[-2.4, 0, 2.4].map((x) => (
        <mesh key={x} position={[x, 0.72, 1.45]}>
          <boxGeometry args={[1.3, 1.08, 0.8]} />
          <meshStandardMaterial color="#134e4a" emissive="#10b981" emissiveIntensity={0.09} roughness={0.38} metalness={0.28} />
        </mesh>
      ))}
      <mesh position={[0, 2.3, 1.45]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 5.8, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.58} />
      </mesh>
      <Label position={[0, 3.3, 0]} title="HVAC / FFU PLANT" detail="PRESSURE / TEMP / HUMIDITY" color="#10b981" />
    </group>
  );
}

function GasFarm() {
  return (
    <group position={[-6.5, 0.12, 6.5]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[7.0, 0.16, 6.4]} />
        <meshStandardMaterial color="#451a03" roughness={0.52} metalness={0.14} transparent opacity={0.55} />
      </mesh>
      {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x, index) => (
        <group key={x} position={[x, 0.95, -0.6]}>
          <mesh>
            <boxGeometry args={[0.68, 1.82, 0.58]} />
            <meshStandardMaterial color={index % 2 === 0 ? '#78350f' : '#334155'} emissive="#f59e0b" emissiveIntensity={0.1} roughness={0.32} metalness={0.36} />
          </mesh>
          <mesh position={[0, 0.92, 0.42]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color={index === 2 ? '#ef4444' : '#f59e0b'} />
          </mesh>
        </group>
      ))}
      {[-1.8, 0, 1.8].map((x) => (
        <mesh key={x} position={[x, 0.9, 1.35]}>
          <cylinderGeometry args={[0.38, 0.46, 1.8, 24]} />
          <meshStandardMaterial color="#64748b" emissive="#f59e0b" emissiveIntensity={0.08} roughness={0.3} metalness={0.54} />
        </mesh>
      ))}
      <Line points={[[-3.1, 1.92, -0.15], [3.1, 1.92, -0.15]]} color="#f59e0b" lineWidth={1.8} transparent opacity={0.82} />
      <Label position={[0, 3.1, 0]} title="GAS CABINET FARM" detail="TOXIC GAS / EXHAUST / SCRUBBER" color="#f59e0b" />
    </group>
  );
}

function FireSafetyPlant() {
  return (
    <group position={[6.5, 0.12, 6.5]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[7.0, 0.16, 6.3]} />
        <meshStandardMaterial color="#450a0a" roughness={0.54} metalness={0.16} transparent opacity={0.53} />
      </mesh>
      {[-1.45, 0, 1.45].map((x) => (
        <group key={x} position={[x, 0.7, -0.7]}>
          <mesh>
            <boxGeometry args={[1.0, 1.2, 0.7]} />
            <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={0.16} roughness={0.34} metalness={0.26} />
          </mesh>
          <mesh position={[0, 0.8, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.3, 28]} />
            <meshBasicMaterial color="#fecaca" transparent opacity={0.76} />
          </mesh>
        </group>
      ))}
      {[-2.6, -1.3, 0, 1.3, 2.6].map((x) => (
        <mesh key={x} position={[x, 2.2, 1.35]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.72} />
        </mesh>
      ))}
      <Line points={[[-2.9, 2.2, 1.35], [2.9, 2.2, 1.35]]} color="#ef4444" lineWidth={1.8} transparent opacity={0.82} />
      <Label position={[0, 3.1, 0]} title="FIRE PUMP ROOM" detail="VESDA / SPRINKLER / FM-200" color="#ef4444" />
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
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[3.2, 3.45, 0.34, 64]} />
        <meshStandardMaterial color="#0f172a" emissive="#22d3ee" emissiveIntensity={0.12} roughness={0.28} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[4.4, 1.3, 4.4]} />
        <meshStandardMaterial color="#111827" emissive="#22d3ee" emissiveIntensity={0.16} wireframe transparent opacity={0.82} />
      </mesh>
      <mesh ref={beaconRef} position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.3, 28, 28]} />
        <meshStandardMaterial color="#f8fafc" emissive="#22d3ee" emissiveIntensity={1.1} roughness={0.22} metalness={0.2} />
      </mesh>
      <Line points={[[0, 0.42, -3.3], [0, 0.42, 3.3]]} color="#22d3ee" lineWidth={1.6} transparent opacity={0.72} />
      <Line points={[[-3.3, 0.42, 0], [3.3, 0.42, 0]]} color="#22d3ee" lineWidth={1.6} transparent opacity={0.72} />
      <Label position={[0, 3.0, 0]} title="FACILITY COMMAND CORE" detail="LIVE BMS / EHS / POWER TELEMETRY" color="#22d3ee" />
    </group>
  );
}

function PipeRackNetwork() {
  return (
    <group>
      {[-11.5, 11.5].map((x) => (
        <group key={x} position={[x, 2.7, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 27, 16]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.28} metalness={0.62} />
          </mesh>
          <mesh position={[0.18, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 27, 12]} />
            <meshStandardMaterial color={x < 0 ? '#f59e0b' : '#10b981'} emissive={x < 0 ? '#f59e0b' : '#10b981'} emissiveIntensity={0.12} metalness={0.45} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {[-11.5, 11.5].map((x) => (
        <Line key={`truss-${x}`} points={[[x, 2.25, -13.5], [x, 3.15, -12.2], [x, 2.25, -10.9]]} color="#64748b" lineWidth={0.8} transparent opacity={0.55} />
      ))}
      {SUBSYSTEM_LINKS.map((link) => (
        <Line key={`${link.from.join('-')}-${link.to.join('-')}`} points={[link.from, link.to]} color={link.color} lineWidth={1.4} dashed dashSize={0.38} gapSize={0.22} transparent opacity={0.72} />
      ))}
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
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function TelemetryPulses() {
  return (
    <group>
      {SUBSYSTEM_LINKS.map((link, index) => (
        <DataPulse key={link.color} from={link.from} to={link.to} color={link.color} speed={1.6 + index * 0.28} />
      ))}
    </group>
  );
}

/**
 * War-room 3D factory district: realistic facility subsystems around a central
 * command core. Interactive zone meshes are still provided by SubsystemZone.
 */
export function FactoryScene() {
  return (
    <>
      <color attach="background" args={['#070b12']} />
      <fog attach="fog" args={['#0b1020', 16, 48]} />
      <ambientLight intensity={0.34} color="#f8fafc" />
      <directionalLight position={[15, 24, 12]} intensity={0.72} color="#dbeafe" />
      <directionalLight position={[-14, 12, -8]} intensity={0.26} color="#f59e0b" />
      <pointLight position={[0, 5, 0]} intensity={1.25} color="#22d3ee" distance={22} />

      <OrbitControls enableRotate enableZoom enablePan target={[0, 0.9, 0]} minDistance={12} maxDistance={46} maxPolarAngle={Math.PI / 2.12} />

      <FacilityShell />
      <PipeRackNetwork />
      <PowerYard />
      <HvacPlant />
      <GasFarm />
      <FireSafetyPlant />
      <CentralCommandCore />
      <TelemetryPulses />
    </>
  );
}
