"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useMesSpcStore } from "@/stores/mes-spc-store";
import { MOCK_EQUIPMENT } from "@/lib/mes-mock-data";
import { cn } from "@/lib/utils";
import { RotateCw, Layers, Maximize } from "lucide-react";
import { fadeIn, useReducedMotion } from "@/lib/animation";

const STATUS_STYLE: Record<
  string,
  { badge: string; glow: string }
> = {
  running: {
    badge:
      "bg-green-950/80 border border-[var(--smartfactory-status-green)] text-green-300",
    glow: "shadow-[0_0_12px_var(--smartfactory-status-green)]",
  },
  idle: {
    badge:
      "bg-amber-950/80 border border-[var(--smartfactory-status-amber)] text-amber-300",
    glow: "shadow-[0_0_12px_var(--smartfactory-status-amber)]",
  },
  down: {
    badge:
      "bg-red-950/80 border border-[var(--smartfactory-status-red)] text-red-300",
    glow: "shadow-[0_0_12px_var(--smartfactory-status-red)]",
  },
};

export function FabFloorMap() {
  const { equipments, selectedEquipmentId, setSelectedEquipment } =
    useMesSpcStore();
  const reduced = useReducedMotion();
  const fadeInProps = reduced ? {} : { variants: fadeIn, initial: 'initial' as const, animate: 'animate' as const };

  // Seed equipments from MOCK_EQUIPMENT on first load
  useEffect(() => {
    if (equipments.length === 0) {
      useMesSpcStore.setState({ equipments: MOCK_EQUIPMENT });
    }
  }, [equipments.length]);

  // Bottom strip stats
  const stats = useMemo(() => {
    const total = equipments.length;
    const running = equipments.filter((e) => e.status === "running").length;
    const idle = equipments.filter((e) => e.status === "idle").length;
    const down = equipments.filter((e) => e.status === "down").length;
    return { total, running, idle, down };
  }, [equipments]);

  const handleNodeClick = (id: string) => {
    setSelectedEquipment(selectedEquipmentId === id ? null : id);
  };

  const pct = (n: number) =>
    `${Math.round((n / Math.max(stats.total, 1)) * 100)}%`;

  return (
    <div
      data-testid="fab-floor-map"
      className="relative overflow-x-auto rounded-lg border border-[var(--smartfactory-border-default)] bg-[var(--smartfactory-bg-canvas)]"
    >
      <div className="flex min-w-[800px]">
        {/* ── Left Gradient Scale Bar ── */}
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

        {/* ── 3D Isometric Grid ── */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div style={{ perspective: "800px" }}>
            <div style={{ transformStyle: "preserve-3d" }}>
              <div
                className="relative"
                style={{
                  width: "500px",
                  height: "600px",
                  transform: "rotateX(60deg) rotateZ(-45deg)",
                  background: "var(--smartfactory-bg-canvas)",
                  backgroundImage: [
                    "linear-gradient(to right, var(--smartfactory-border-default) 1px, transparent 1px)",
                    "linear-gradient(to bottom, var(--smartfactory-border-default) 1px, transparent 1px)",
                  ].join(","),
                  backgroundSize: "180px 130px",
                }}
              >
                {[...equipments]
                  .sort((a, b) => (b.x + b.y) - (a.x + a.y))
                  .map((eq) => {
                  const isSelected = eq.id === selectedEquipmentId;
                  const s = STATUS_STYLE[eq.status] ?? STATUS_STYLE.idle;
                  return (
                    <motion.div key={eq.id} {...fadeInProps}>
                    <button
                      data-testid={`fab-equipment-node-${eq.id}`}
                      onClick={() => handleNodeClick(eq.id)}
                      className={cn(
                        "absolute min-w-[110px] cursor-pointer rounded-md px-3 py-1.5 text-left transition-all duration-200",
                        "hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-[var(--smartfactory-accent-blue)]",
                        s.badge,
                        isSelected &&
                          `ring-2 ring-[var(--smartfactory-accent-blue)] ${s.glow}`,
                      )}
                      style={{
                        left: `${eq.x * 180}px`,
                        top: `${eq.y * 130}px`,
                      }}
                    >
                      <div className="text-xs font-bold leading-tight">
                        {eq.name}
                      </div>
                      <div className="text-[10px] leading-tight opacity-80">
                        {eq.powerKw} kW
                      </div>
                    </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Toolbar ── */}
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

      {/* ── Bottom Info Strip ── */}
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
    </div>
  );
}
