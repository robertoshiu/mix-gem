"use client";

import { useRef, useMemo, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMesSpcStore } from "@/stores/mes-spc-store";
import { MOCK_EQUIPMENT } from "@/lib/mes-mock-data";
import { cn } from "@/lib/utils";
import { RotateCw, Layers, Maximize } from "lucide-react";
import * as THREE from "three";

// ── Status colour → box base colour ──
const STATUS_COLORS: Record<string, string> = {
  running: "#22c55e",
  idle: "#f59e0b",
  down: "#ef4444",
};

const STATUS_GLOW: Record<string, string> = {
  running: "#4ade80",
  idle: "#fbbf24",
  down: "#f87171",
};

// ── Layout constants (maps the 2×4 grid into 3D world space) ──
const COLS = 2;
const ROWS = 4;
const COL_SPACING = 1.8;
const ROW_SPACING = 1.4;
const BOX_W = 1.3;
const BOX_H = 0.22;
const BOX_D = 0.85;
const GROUND_W = (COLS + 1) * COL_SPACING;
const GROUND_D = (ROWS + 1) * ROW_SPACING;

function gridPos(x: number, y: number): [number, number, number] {
  const px = (x - (COLS - 1) / 2) * COL_SPACING;
  const pz = (y - (ROWS - 1) / 2) * ROW_SPACING;
  return [px, BOX_H / 2, pz];
}

// ── Single equipment box ──
function EquipmentBox3D({
  equipment,
  isSelected,
  hoveredId,
  onHover,
  onSelect,
}: {
  equipment: { id: string; name: string; type: string; status: string; x: number; y: number; powerKw: number };
  isSelected: boolean;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const emissiveTarget = useRef(0);
  const emissiveCurrent = useRef(0);
  const { invalidate } = useThree();
  const isHovered = hoveredId === equipment.id;

  const color = STATUS_COLORS[equipment.status] ?? STATUS_COLORS.idle;
  const glowColor = STATUS_GLOW[equipment.status] ?? STATUS_GLOW.idle;

  // Smooth emissive lerp — keeps invalidating while animating
  useFrame((_, delta) => {
    const target = isHovered || isSelected ? 0.55 : 0;
    emissiveTarget.current = target;
    emissiveCurrent.current +=
      (emissiveTarget.current - emissiveCurrent.current) * Math.min(delta * 10, 1);
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissive.set(glowColor);
      mat.emissiveIntensity = emissiveCurrent.current;
    }
    if (Math.abs(emissiveTarget.current - emissiveCurrent.current) > 0.002) {
      invalidate();
    }
  });

  const [px, py, pz] = gridPos(equipment.x, equipment.y);

  // Scale pulse when selected
  const scale = isSelected ? 1.08 : 1;

  return (
    <group scale={[scale, scale, scale]}>
      <mesh
        ref={meshRef}
        position={[px, py, pz]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(equipment.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(equipment.id);
        }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[BOX_W, BOX_H, BOX_D]} />
        <meshStandardMaterial
          color={color}
          roughness={0.45}
          metalness={0.25}
          emissive={new THREE.Color(glowColor)}
          emissiveIntensity={0}
        />
      </mesh>
      {/* Name label above box */}
      <Text
        position={[px, BOX_H + 0.18, pz]}
        fontSize={0.16}
        color="#94a3b8"
        anchorX="center"
        anchorY="bottom"
        font={undefined}
      >
        {equipment.name}
      </Text>
    </group>
  );
}

// ── Grid lines on ground plane ──
function FloorGrid() {
  const lines: number[] = [];
  const halfW = GROUND_W / 2;
  const halfD = GROUND_D / 2;

  for (let i = 0; i <= COLS; i++) {
    const x = -halfW + i * COL_SPACING;
    lines.push(x, 0, -halfD, x, 0, halfD);
  }
  for (let i = 0; i <= ROWS; i++) {
    const z = -halfD + i * ROW_SPACING;
    lines.push(-halfW, 0, z, halfW, 0, z);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#1e293b" transparent opacity={0.5} />
    </lineSegments>
  );
}

// ── Inner 3D scene (rendered inside Canvas) ──
function FabFloorScene() {
  const { equipments, selectedEquipmentId, setSelectedEquipment } =
    useMesSpcStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Seed equipments on first load (same pattern as FabFloorMap)
  useEffect(() => {
    if (equipments.length === 0) {
      useMesSpcStore.setState({ equipments: MOCK_EQUIPMENT });
    }
  }, [equipments.length]);

  const sorted = useMemo(
    () => [...equipments].sort((a, b) => b.x + b.y - (a.x + a.y)),
    [equipments],
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedEquipment(selectedEquipmentId === id ? null : id);
    },
    [selectedEquipmentId, setSelectedEquipment],
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={0.7}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[GROUND_W, GROUND_D]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      <FloorGrid />

      {/* Equipment boxes */}
      {sorted.map((eq) => (
        <EquipmentBox3D
          key={eq.id}
          equipment={eq}
          isSelected={eq.id === selectedEquipmentId}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />
      ))}

      {/* OrbitControls with restricted angles */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 2.3}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
        minDistance={3.5}
        maxDistance={9}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ── Bottom stats strip (identical to FabFloorMap) ──
function StatsStrip() {
  const equipments = useMesSpcStore((s) => s.equipments);

  const stats = useMemo(() => {
    const total = equipments.length;
    const running = equipments.filter((e) => e.status === "running").length;
    const idle = equipments.filter((e) => e.status === "idle").length;
    const down = equipments.filter((e) => e.status === "down").length;
    return { total, running, idle, down };
  }, [equipments]);

  const pct = (n: number) =>
    `${Math.round((n / Math.max(stats.total, 1)) * 100)}%`;

  return (
    <div className="flex items-center gap-4 border-t border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-surface-card)] px-4 py-2 text-xs text-[var(--smartfactory-text-secondary)]">
      <span className="font-medium text-[var(--smartfactory-text-primary)]">
        Equipment {stats.total}
      </span>
      <span className="text-[var(--smartfactory-status-green)]">
        Running {stats.running} ({pct(stats.running)})
      </span>
      <span className="text-[var(--smartfactory-status-amber)]">
        Idle {stats.idle} ({pct(stats.idle)})
      </span>
      <span className="text-[var(--smartfactory-status-red)]">
        Down {stats.down} ({pct(stats.down)})
      </span>
    </div>
  );
}

// ── Public export ──
export function FabFloorMap3D() {
  return (
    <div
      data-testid="fab-floor-map-3d"
      className="relative overflow-hidden rounded-lg border border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-bg-canvas)]"
    >
      <div className="flex min-w-[800px]">
        {/* Left gradient scale bar */}
        <div className="flex shrink-0 flex-col items-center gap-2 px-3 py-4">
          <span className="text-[10px] font-medium text-[var(--smartfactory-text-muted)]">
            High
          </span>
          <div
            className="w-2 flex-1 rounded-full"
            style={{
              background:
                "linear-gradient(to top, var(--smartfactory-accent-blue), var(--smartfactory-status-red))",
            }}
          />
          <span className="text-[10px] font-medium text-[var(--smartfactory-text-muted)]">
            Low
          </span>
          <span className="mt-1 text-[10px] font-medium text-[var(--smartfactory-text-secondary)] [writing-mode:vertical-lr] rotate-180">
            Power Intensity
          </span>
        </div>

        {/* 3D Canvas replacing the CSS isometric grid */}
        <div className="flex-1" style={{ height: "600px" }}>
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-[var(--smartfactory-text-muted)]">
                Loading 3D view…
              </div>
            }
          >
            <Canvas
              camera={{ position: [5.5, 4.5, 5.5], fov: 45, near: 0.1, far: 50 }}
              frameloop="demand"
              style={{ background: "var(--smartfactory-bg-canvas)" }}
            >
              <FabFloorScene />
            </Canvas>
          </Suspense>
        </div>

        {/* Right toolbar */}
        <div className="flex shrink-0 flex-col items-center gap-3 px-3 py-4">
          <button
            className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--smartfactory-surface-card)] transition-colors hover:bg-[var(--smartfactory-surface-elevated)]"
            aria-label="Refresh"
          >
            <RotateCw className="h-2.5 w-2.5 text-[var(--smartfactory-text-secondary)]" />
          </button>
          <button
            className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--smartfactory-surface-card)] transition-colors hover:bg-[var(--smartfactory-surface-elevated)]"
            aria-label="Layers"
          >
            <Layers className="h-2.5 w-2.5 text-[var(--smartfactory-text-secondary)]" />
          </button>
          <button
            className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--smartfactory-surface-card)] transition-colors hover:bg-[var(--smartfactory-surface-elevated)]"
            aria-label="Fullscreen"
          >
            <Maximize className="h-2.5 w-2.5 text-[var(--smartfactory-text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Bottom info strip */}
      <StatsStrip />
    </div>
  );
}
