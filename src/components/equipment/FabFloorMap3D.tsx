"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Line, OrbitControls, Text } from "@react-three/drei";
import { Layers, Maximize, RotateCw } from "lucide-react";
import * as THREE from "three";
import { MOCK_EQUIPMENT } from "@/lib/mes-mock-data";
import type { Equipment, EquipmentStatus, EquipmentType } from "@/lib/mes-types";
import { useReducedMotion } from "@/lib/animation";
import { useMesSpcStore } from "@/stores/mes-spc-store";

const COLS = 2;
const ROWS = 4;
const COL_SPACING = 3.3;
const ROW_SPACING = 2.35;
const GROUND_W = 10.8;
const GROUND_D = 13.6;

type Vec3 = [number, number, number];

const STATUS_THEME: Record<EquipmentStatus, { color: string; glow: string; label: string }> = {
  running: { color: "#22c55e", glow: "#86efac", label: "RUN" },
  idle: { color: "#f59e0b", glow: "#fbbf24", label: "IDLE" },
  down: { color: "#ef4444", glow: "#f87171", label: "DOWN" },
};

const TOOL_THEME: Record<EquipmentType, { color: string; label: string; family: string }> = {
  lithography: { color: "#38bdf8", label: "193i Scanner", family: "PHOTO" },
  coater: { color: "#a78bfa", label: "Coat Track", family: "TRACK" },
  developer: { color: "#c084fc", label: "Develop Track", family: "TRACK" },
  metrology: { color: "#22d3ee", label: "Overlay CD-SEM", family: "METRO" },
  cmp: { color: "#60a5fa", label: "CMP Polisher", family: "PLANAR" },
};

function gridPos(x: number, y: number): Vec3 {
  const px = (x - (COLS - 1) / 2) * COL_SPACING;
  const pz = (y - (ROWS - 1) / 2) * ROW_SPACING;
  return [px, 0, pz];
}

function createLineGeometry(points: Vec3[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
  return geometry;
}

function FloorGrid() {
  const geometry = useMemo(() => {
    const lines: Vec3[] = [];
    const halfW = GROUND_W / 2;
    const halfD = GROUND_D / 2;

    for (let x = -halfW; x <= halfW + 0.01; x += 0.75) {
      lines.push([x, 0.045, -halfD], [x, 0.045, halfD]);
    }
    for (let z = -halfD; z <= halfD + 0.01; z += 0.75) {
      lines.push([-halfW, 0.046, z], [halfW, 0.046, z]);
    }

    return createLineGeometry(lines);
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#28405f" transparent opacity={0.38} />
    </lineSegments>
  );
}

function PerforatedFloor() {
  const dots = useMemo(() => {
    const items: Vec3[] = [];
    for (let x = -4.8; x <= 4.8; x += 0.8) {
      for (let z = -6.0; z <= 6.0; z += 0.8) {
        if (Math.abs(x) < 1.15 && Math.abs(z) < 5.9) continue;
        items.push([x, 0.065, z]);
      }
    }
    return items;
  }, []);

  return (
    <group>
      {dots.map(([x, y, z]) => (
        <mesh key={`${x}-${z}`} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.035, 10]} />
          <meshBasicMaterial color="#57708e" transparent opacity={0.26} />
        </mesh>
      ))}
    </group>
  );
}

function CleanroomEnvelope() {
  const ceilingPanels = useMemo(() => {
    const panels: Vec3[] = [];
    for (let x = -4.5; x <= 4.5; x += 1.5) {
      for (let z = -5.8; z <= 5.8; z += 1.45) {
        panels.push([x, 4.25, z]);
      }
    }
    return panels;
  }, []);

  return (
    <group>
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GROUND_W, GROUND_D]} />
        <meshStandardMaterial color="#101827" roughness={0.82} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.25, GROUND_D - 1]} />
        <meshStandardMaterial color="#263142" roughness={0.7} metalness={0.2} transparent opacity={0.72} />
      </mesh>
      <FloorGrid />
      <PerforatedFloor />

      <mesh position={[0, 2.1, -GROUND_D / 2]}>
        <boxGeometry args={[GROUND_W, 4.2, 0.12]} />
        <meshStandardMaterial color="#94a3b8" wireframe transparent opacity={0.18} />
      </mesh>
      <mesh position={[-GROUND_W / 2, 2.1, 0]}>
        <boxGeometry args={[0.12, 4.2, GROUND_D]} />
        <meshStandardMaterial color="#94a3b8" wireframe transparent opacity={0.14} />
      </mesh>
      <mesh position={[GROUND_W / 2, 2.1, 0]}>
        <boxGeometry args={[0.12, 4.2, GROUND_D]} />
        <meshStandardMaterial color="#94a3b8" wireframe transparent opacity={0.14} />
      </mesh>

      {ceilingPanels.map(([x, y, z], index) => (
        <group key={`${x}-${z}`} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[1.22, 0.05, 1.05]} />
            <meshStandardMaterial color={index % 3 === 0 ? "#fef3c7" : "#cbd5e1"} emissive={index % 3 === 0 ? "#f59e0b" : "#38bdf8"} emissiveIntensity={index % 3 === 0 ? 0.1 : 0.035} roughness={0.4} />
          </mesh>
          <Line points={[[-0.48, -0.04, 0], [0.48, -0.04, 0]]} color="#64748b" lineWidth={0.4} transparent opacity={0.35} />
          <Line points={[[0, -0.04, -0.42], [0, -0.04, 0.42]]} color="#64748b" lineWidth={0.4} transparent opacity={0.35} />
        </group>
      ))}
    </group>
  );
}

function ServiceChase() {
  return (
    <group>
      {[-2.85, 2.85].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.5, 0.5, GROUND_D - 1.6]} />
            <meshStandardMaterial color="#111827" roughness={0.6} metalness={0.28} transparent opacity={0.78} />
          </mesh>
          {[0.85, 1.15, 1.45].map((y, index) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.055, GROUND_D - 1.25, 12]} />
              <meshStandardMaterial color={["#64748b", "#f59e0b", "#38bdf8"][index]} emissive={["#000000", "#f59e0b", "#22d3ee"][index]} emissiveIntensity={index === 0 ? 0 : 0.12} roughness={0.36} metalness={0.62} />
            </mesh>
          ))}
          {[-5.2, -3.0, -0.8, 1.4, 3.6, 5.8].map((z) => (
            <mesh key={z} position={[0, 0.75, z]}>
              <boxGeometry args={[0.58, 1.0, 0.12]} />
              <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.32} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function StatusTower({ status }: { status: EquipmentStatus }) {
  const theme = STATUS_THEME[status];
  const redOn = status === "down";
  const amberOn = status === "idle";
  const greenOn = status === "running";

  return (
    <group position={[0.62, 1.45, -0.38]}>
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.55, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.28} />
      </mesh>
      {[
        { y: 0.08, color: "#ef4444", on: redOn },
        { y: 0.24, color: "#f59e0b", on: amberOn },
        { y: 0.4, color: "#22c55e", on: greenOn },
      ].map((light) => (
        <mesh key={light.color} position={[0, light.y, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={light.color} emissive={light.color} emissiveIntensity={light.on ? 1.2 : 0.04} transparent opacity={light.on ? 1 : 0.38} />
        </mesh>
      ))}
      <pointLight color={theme.glow} intensity={status === "down" ? 0.7 : 0.35} distance={2.4} />
    </group>
  );
}

function ToolLabel({ equipment, isSelected }: { equipment: Equipment; isSelected: boolean }) {
  const status = STATUS_THEME[equipment.status];
  const tool = TOOL_THEME[equipment.type];

  return (
    <Billboard position={[0, 2.42, 0]}>
      <Text fontSize={0.15} color="#e2e8f0" anchorX="center" anchorY="middle" outlineWidth={0.015} outlineColor="#020617">
        {`${equipment.name}\n${tool.label} | ${status.label}\n${equipment.currentWafer}/${equipment.totalWafers} WAFERS`}
      </Text>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[1.62, 0.58]} />
        <meshBasicMaterial color={isSelected ? tool.color : "#0f172a"} transparent opacity={isSelected ? 0.28 : 0.2} />
      </mesh>
    </Billboard>
  );
}

function LithographyTool({ color, selected }: { color: string; selected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[1.65, 1.28, 1.2]} />
        <meshStandardMaterial color="#dbeafe" emissive={color} emissiveIntensity={selected ? 0.18 : 0.08} roughness={0.34} metalness={0.32} />
      </mesh>
      <mesh position={[-0.32, 1.42, 0]}>
        <boxGeometry args={[0.82, 0.78, 1.02]} />
        <meshStandardMaterial color="#1e293b" emissive={color} emissiveIntensity={selected ? 0.32 : 0.16} roughness={0.28} metalness={0.45} />
      </mesh>
      <mesh position={[0.48, 1.2, 0.04]}>
        <boxGeometry args={[0.56, 0.34, 0.78]} />
        <meshStandardMaterial color="#fef3c7" emissive="#f59e0b" emissiveIntensity={0.18} roughness={0.2} metalness={0.12} transparent opacity={0.86} />
      </mesh>
      <mesh position={[-0.32, 1.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.34, 0.42, 32]} />
        <meshStandardMaterial color="#cbd5e1" emissive={color} emissiveIntensity={0.12} roughness={0.24} metalness={0.55} />
      </mesh>
      <Line points={[[-0.8, 0.08, 0.76], [0.78, 0.08, 0.76]]} color={color} lineWidth={1.6} transparent opacity={0.75} />
    </group>
  );
}

function TrackTool({ color, selected, developer }: { color: string; selected: boolean; developer: boolean }) {
  return (
    <group>
      {[-0.74, -0.25, 0.24, 0.73].map((x, index) => (
        <mesh key={x} position={[x, 0.6, 0]}>
          <boxGeometry args={[0.42, 1.08, 1.18]} />
          <meshStandardMaterial color={developer ? "#3b1d56" : "#2d244d"} emissive={color} emissiveIntensity={selected ? 0.22 : 0.08 + index * 0.015} roughness={0.42} metalness={0.24} />
        </mesh>
      ))}
      <mesh position={[0, 1.22, -0.63]}>
        <boxGeometry args={[1.95, 0.18, 0.16]} />
        <meshStandardMaterial color="#e2e8f0" emissive={color} emissiveIntensity={0.12} roughness={0.34} metalness={0.35} />
      </mesh>
      {[-0.48, 0.48].map((x) => (
        <mesh key={x} position={[x, 1.36, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.05, 24]} />
          <meshStandardMaterial color={developer ? "#bae6fd" : "#fde68a"} emissive={color} emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function MetrologyToolBody({ color, selected }: { color: string; selected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[1.16, 1.24, 1.1]} />
        <meshStandardMaterial color="#0f172a" emissive={color} emissiveIntensity={selected ? 0.28 : 0.14} roughness={0.26} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.38, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.36, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 0.25, 0.62]}>
        <boxGeometry args={[0.72, 0.2, 0.08]} />
        <meshBasicMaterial color="#f8fafc" transparent opacity={0.32} />
      </mesh>
    </group>
  );
}

function CmpTool({ color, selected }: { color: string; selected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[1.82, 0.92, 1.28]} />
        <meshStandardMaterial color="#1f2937" emissive={color} emissiveIntensity={selected ? 0.24 : 0.1} roughness={0.35} metalness={0.35} />
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.08, 36]} />
          <meshStandardMaterial color="#cbd5e1" emissive={color} emissiveIntensity={0.1} roughness={0.22} metalness={0.54} />
        </mesh>
      ))}
      <Line points={[[-0.8, 1.16, -0.55], [0.8, 1.16, -0.55]]} color={color} lineWidth={1.5} transparent opacity={0.8} />
    </group>
  );
}

function EquipmentTool3D({
  equipment,
  isSelected,
  hoveredId,
  onHover,
  onSelect,
}: {
  equipment: Equipment;
  isSelected: boolean;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const groupRef = useRef<THREE.Group>(null);
  const isHovered = hoveredId === equipment.id;
  const [x, , z] = gridPos(equipment.x, equipment.y);
  const tool = TOOL_THEME[equipment.type];
  const status = STATUS_THEME[equipment.status];

  useFrame((state) => {
    if (!groupRef.current) return;
    const lift = isSelected ? 0.08 : isHovered ? 0.04 : 0;
    const pulse = reduced || equipment.status !== "down" ? 0 : Math.sin(state.clock.elapsedTime * 5) * 0.035;
    groupRef.current.position.y = lift + pulse;
  });

  return (
    <group
      ref={groupRef}
      position={[x, 0.08, z]}
      scale={isSelected ? 1.06 : 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(equipment.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(equipment.id);
      }}
      onPointerOut={() => onHover(null)}
    >
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[2.25, 0.08, 1.7]} />
        <meshStandardMaterial color={isSelected ? tool.color : "#1e293b"} emissive={tool.color} emissiveIntensity={isSelected ? 0.18 : 0.04} roughness={0.6} metalness={0.18} transparent opacity={0.86} />
      </mesh>

      {equipment.type === "lithography" && <LithographyTool color={tool.color} selected={isSelected || isHovered} />}
      {equipment.type === "coater" && <TrackTool color={tool.color} selected={isSelected || isHovered} developer={false} />}
      {equipment.type === "developer" && <TrackTool color={tool.color} selected={isSelected || isHovered} developer />}
      {equipment.type === "metrology" && <MetrologyToolBody color={tool.color} selected={isSelected || isHovered} />}
      {equipment.type === "cmp" && <CmpTool color={tool.color} selected={isSelected || isHovered} />}

      <StatusTower status={equipment.status} />
      <ToolLabel equipment={equipment} isSelected={isSelected || isHovered} />
      <pointLight color={status.glow} intensity={isSelected || equipment.status === "down" ? 0.75 : 0.18} distance={2.2} />
    </group>
  );
}

function ProcessPath({ equipments }: { equipments: Equipment[] }) {
  const points = useMemo<Vec3[]>(
    () => [...equipments].sort((a, b) => a.y - b.y || a.x - b.x).map((equipment) => {
      const [x, , z] = gridPos(equipment.x, equipment.y);
      return [x, 0.24, z];
    }),
    [equipments],
  );

  return (
    <group>
      <Line points={points} color="#f59e0b" lineWidth={2.8} transparent opacity={0.54} dashed dashSize={0.24} gapSize={0.16} />
      <Line points={points.map(([x, y, z]) => [x, y + 0.035, z] as Vec3)} color="#22d3ee" lineWidth={1.1} transparent opacity={0.55} />
    </group>
  );
}

function WaferCarrier({ path }: { path: Vec3[] }) {
  const ref = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();

  useFrame((state) => {
    if (!ref.current || path.length < 2 || reduced) return;
    const t = (state.clock.elapsedTime * 0.18) % path.length;
    const index = Math.floor(t);
    const next = (index + 1) % path.length;
    const local = t - index;
    const from = path[index];
    const to = path[next];
    ref.current.position.set(
      from[0] + (to[0] - from[0]) * local,
      from[1] + (to[1] - from[1]) * local,
      from[2] + (to[2] - from[2]) * local,
    );
  });

  return (
    <group ref={ref} position={path[0]}>
      <mesh>
        <boxGeometry args={[0.32, 0.22, 0.32]} />
        <meshStandardMaterial color="#fef3c7" emissive="#f59e0b" emissiveIntensity={0.36} roughness={0.24} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.5} transparent opacity={0.86} />
      </mesh>
    </group>
  );
}

function AmhsRail({ equipments }: { equipments: Equipment[] }) {
  const railPath = useMemo<Vec3[]>(() => {
    const positions = [...equipments].sort((a, b) => a.y - b.y || a.x - b.x).map((equipment) => {
      const [x, , z] = gridPos(equipment.x, equipment.y);
      return [x, 3.35, z] as Vec3;
    });
    return [[-4.2, 3.35, -5.6], ...positions, [4.2, 3.35, 5.6], [-4.2, 3.35, 5.6]];
  }, [equipments]);

  return (
    <group>
      <Line points={[...railPath, railPath[0]]} color="#dbeafe" lineWidth={2.2} transparent opacity={0.58} />
      <Line points={[...railPath, railPath[0]].map(([x, y, z]) => [x, y - 0.16, z] as Vec3)} color="#22d3ee" lineWidth={1.2} transparent opacity={0.82} />
      <WaferCarrier path={railPath} />
    </group>
  );
}

function ZoneMarkings() {
  return (
    <group>
      {[
        { label: "PHOTO BAY", z: -3.55, color: "#38bdf8" },
        { label: "COAT / DEVELOP", z: -1.2, color: "#a78bfa" },
        { label: "METROLOGY", z: 3.5, color: "#22d3ee" },
        { label: "CMP SERVICE", z: 5.85, color: "#60a5fa" },
      ].map((zone) => (
        <group key={zone.label} position={[-4.82, 0.09, zone.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.12, 1.38]} />
            <meshBasicMaterial color={zone.color} transparent opacity={0.68} />
          </mesh>
          <Text position={[0.18, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} fontSize={0.18} color={zone.color} anchorX="left" anchorY="middle">
            {zone.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

function FabFloorScene() {
  const { equipments, selectedEquipmentId, setSelectedEquipment } = useMesSpcStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (equipments.length === 0) {
      useMesSpcStore.setState({ equipments: MOCK_EQUIPMENT });
    }
  }, [equipments.length]);

  const sceneEquipment = equipments.length > 0 ? equipments : MOCK_EQUIPMENT;
  const sorted = useMemo(
    () => [...sceneEquipment].sort((a, b) => b.x + b.y - (a.x + a.y)),
    [sceneEquipment],
  );

  const processPath = useMemo<Vec3[]>(
    () => [...sceneEquipment].sort((a, b) => a.y - b.y || a.x - b.x).map((equipment) => {
      const [x, , z] = gridPos(equipment.x, equipment.y);
      return [x, 0.42, z];
    }),
    [sceneEquipment],
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedEquipment(selectedEquipmentId === id ? null : id);
    },
    [selectedEquipmentId, setSelectedEquipment],
  );

  return (
    <>
      <color attach="background" args={["#070b12"]} />
      <fog attach="fog" args={["#0b1020", 9, 24]} />
      <ambientLight intensity={0.38} color="#fbbf24" />
      <directionalLight position={[7, 12, 6]} intensity={0.64} color="#fff7ed" castShadow />
      <directionalLight position={[-8, 7, -5]} intensity={0.22} color="#38bdf8" />
      <pointLight position={[0, 3.3, -2]} intensity={1.4} color="#f59e0b" distance={9} />

      <CleanroomEnvelope />
      <ServiceChase />
      <ZoneMarkings />
      <ProcessPath equipments={sceneEquipment} />
      <WaferCarrier path={processPath} />
      <AmhsRail equipments={sceneEquipment} />

      {sorted.map((equipment) => (
        <EquipmentTool3D
          key={equipment.id}
          equipment={equipment}
          isSelected={equipment.id === selectedEquipmentId}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI / 5.2}
        maxPolarAngle={Math.PI / 2.18}
        minAzimuthAngle={-Math.PI / 2.4}
        maxAzimuthAngle={Math.PI / 2.4}
        minDistance={5.4}
        maxDistance={14.5}
        target={[0, 0.85, 0]}
      />
    </>
  );
}

function StatsStrip() {
  const equipments = useMesSpcStore((state) => state.equipments);
  const sceneEquipment = equipments.length > 0 ? equipments : MOCK_EQUIPMENT;

  const stats = useMemo(() => {
    const total = sceneEquipment.length;
    const running = sceneEquipment.filter((equipment) => equipment.status === "running").length;
    const idle = sceneEquipment.filter((equipment) => equipment.status === "idle").length;
    const down = sceneEquipment.filter((equipment) => equipment.status === "down").length;
    const wafers = sceneEquipment.reduce((sum, equipment) => sum + equipment.currentWafer, 0);
    return { total, running, idle, down, wafers };
  }, [sceneEquipment]);

  const pct = (n: number) => `${Math.round((n / Math.max(stats.total, 1)) * 100)}%`;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--smartfactory-border-default)] bg-[rgba(15,23,42,0.92)] px-4 py-2 text-xs text-[var(--smartfactory-text-secondary)] backdrop-blur">
      <span className="font-medium text-[var(--smartfactory-text-primary)]">Bay-and-chase fab twin</span>
      <span className="text-[var(--smartfactory-status-green)]">Running {stats.running} ({pct(stats.running)})</span>
      <span className="text-[var(--smartfactory-status-amber)]">Idle {stats.idle} ({pct(stats.idle)})</span>
      <span className="text-[var(--smartfactory-status-red)]">Down {stats.down} ({pct(stats.down)})</span>
      <span className="font-mono text-[var(--smartfactory-accent-cyan)]">WIP {stats.wafers} wafers</span>
    </div>
  );
}

export function FabFloorMap3D() {
  return (
    <div
      data-testid="fab-floor-map-3d"
      className="relative overflow-hidden rounded-lg border border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-bg-canvas)] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
    >
      <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-sm rounded-2xl border border-amber-300/20 bg-slate-950/55 px-4 py-3 text-xs text-slate-200 backdrop-blur-md">
        <div className="font-semibold uppercase tracking-[0.18em] text-amber-200">Semiconductor Fab Digital Twin</div>
        <div className="mt-1 text-slate-400">AMHS rail, FOUP flow, service chases, FFU ceiling, and tool-specific silhouettes.</div>
      </div>

      <div className="flex min-w-[860px]">
        <div className="flex shrink-0 flex-col items-center gap-2 px-3 py-4">
          <span className="text-[10px] font-medium text-[var(--smartfactory-text-muted)]">High</span>
          <div
            className="w-2 flex-1 rounded-full shadow-[0_0_18px_rgba(245,158,11,0.35)]"
            style={{
              background:
                "linear-gradient(to top, var(--smartfactory-accent-blue), #f59e0b, var(--smartfactory-status-red))",
            }}
          />
          <span className="text-[10px] font-medium text-[var(--smartfactory-text-muted)]">Low</span>
          <span className="mt-1 rotate-180 text-[10px] font-medium text-[var(--smartfactory-text-secondary)] [writing-mode:vertical-lr]">Power / WIP Intensity</span>
        </div>

        <div className="flex-1" style={{ height: "640px" }}>
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-[var(--smartfactory-text-muted)]">
                Loading cleanroom digital twin...
              </div>
            }
          >
            <Canvas
              camera={{ position: [6.8, 5.4, 8.2], fov: 43, near: 0.1, far: 80 }}
              frameloop="always"
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
              style={{ background: "radial-gradient(circle at 50% 20%, #182033 0%, #070b12 70%)" }}
            >
              <FabFloorScene />
            </Canvas>
          </Suspense>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-3 px-3 py-4">
          <button className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--smartfactory-surface-card)] transition-colors hover:bg-[var(--smartfactory-surface-elevated)]" aria-label="Refresh">
            <RotateCw className="h-2.5 w-2.5 text-[var(--smartfactory-text-secondary)]" />
          </button>
          <button className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--smartfactory-surface-card)] transition-colors hover:bg-[var(--smartfactory-surface-elevated)]" aria-label="Layers">
            <Layers className="h-2.5 w-2.5 text-[var(--smartfactory-text-secondary)]" />
          </button>
          <button className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--smartfactory-surface-card)] transition-colors hover:bg-[var(--smartfactory-surface-elevated)]" aria-label="Fullscreen">
            <Maximize className="h-2.5 w-2.5 text-[var(--smartfactory-text-secondary)]" />
          </button>
        </div>
      </div>

      <StatsStrip />
    </div>
  );
}
