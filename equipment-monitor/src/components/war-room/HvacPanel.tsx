"use client";

import { useState, useRef, useMemo } from "react";
import { X, Building, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialogFocusTrap } from "@/hooks/use-dialog-focus-trap";
import { useFacilitySimStore } from "@/stores/facility-sim-store";
import type { HistoryPoint } from "@/stores/facility-sim-store";
import type { HvacNodeId } from "@/lib/engines/facility-types";
import { MiniSparkline } from "@/components/war-room/canvas/MiniSparkline";
import { TrendChart } from "@/components/war-room/canvas/TrendChart";
import { NetworkSchematic } from "@/components/war-room/canvas/NetworkSchematic";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HvacPanelProps {
  isOpen: boolean;
  onClose: () => void;
  highlightNodeId?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ALARMS = 5;
const SPARKLINE_COUNT = 30;

/** ISO 14644-1 Class 5 limit: 3,520 particles/m3 at >= 0.5 um */
const ISO5_PARTICLE_LIMIT = 3520;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SystemSeverity = "normal" | "warning" | "alarm";

function severityColor(severity: SystemSeverity): string {
  switch (severity) {
    case "normal":
      return "var(--sf-status-green)";
    case "warning":
      return "var(--sf-status-amber)";
    case "alarm":
      return "var(--sf-status-red)";
  }
}

function severityLabel(severity: SystemSeverity): string {
  switch (severity) {
    case "normal":
      return "Normal";
    case "warning":
      return "Warning";
    case "alarm":
      return "Critical";
  }
}

function deriveNodeHealth(
  nodeId: HvacNodeId,
  T: number,
  particleCount: number,
): "normal" | "warning" | "alarm" {
  if (nodeId === "zone-cr" || nodeId === "zone-prod") {
    if (T > 30 || particleCount > ISO5_PARTICLE_LIMIT) return "alarm";
    if (T > 26 || particleCount > ISO5_PARTICLE_LIMIT * 0.8) return "warning";
    return "normal";
  }
  if (nodeId === "chiller") {
    if (T > 12) return "alarm";
    if (T > 9) return "warning";
    return "normal";
  }
  // ahu-supply, duct-main, ffu-array, return-plenum: base on temperature drift
  if (T > 28) return "alarm";
  if (T > 24) return "warning";
  return "normal";
}

function extractSparklineValues(
  history: HistoryPoint[],
  count: number,
): number[] {
  const slice =
    history.length > count ? history.slice(history.length - count) : history;
  return slice.map((p) => p.value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HvacPanel({
  isOpen,
  onClose,
  highlightNodeId,
}: HvacPanelProps) {
  // --- Store selectors ---
  const sim = useFacilitySimStore((s) => s.sim);
  const allAlarms = useFacilitySimStore((s) => s.alarms);
  const tempHistory = useFacilitySimStore((s) => s.hvacTempHistory);
  const particleHistory = useFacilitySimStore((s) => s.hvacParticleHistory);
  const markers = useFacilitySimStore((s) => s.scenarioMarkers);

  const hvacAlarms = useMemo(
    () => allAlarms.filter((a) => a.subsystem === "hvac"),
    [allAlarms],
  );

  // --- Trend chart expand state ---
  const [tempExpanded, setTempExpanded] = useState(false);
  const [particleExpanded, setParticleExpanded] = useState(false);

  // --- Focus trap ---
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(panelRef, isOpen, onClose);

  // --- Derived values ---
  const hvac = sim.hvac;
  const zoneCr = hvac.nodes["zone-cr"];
  const ahuSupply = hvac.nodes["ahu-supply"];
  const chiller = hvac.nodes["chiller"];

  // Compute overall severity
  const severity: SystemSeverity = useMemo(() => {
    if (hvacAlarms.some((a) => a.severity === "critical")) return "alarm";
    if (hvacAlarms.some((a) => a.severity === "warning")) return "warning";
    if (zoneCr.T > 30 || zoneCr.particleCount > ISO5_PARTICLE_LIMIT)
      return "alarm";
    if (zoneCr.T > 26) return "warning";
    return "normal";
  }, [hvacAlarms, zoneCr.T, zoneCr.particleCount]);

  // --- KPI data ---
  const tempHistoryArr = tempHistory.toArray();
  const particleHistoryArr = particleHistory.toArray();

  const kpis = [
    {
      label: "Temp",
      value: zoneCr.T.toFixed(1),
      unit: "\u00B0C",
      sparkline: extractSparklineValues(tempHistoryArr, SPARKLINE_COUNT),
      color: "#22D3EE",
    },
    {
      label: "RH",
      value: zoneCr.RH.toFixed(1),
      unit: "%",
      sparkline: extractSparklineValues(tempHistoryArr, SPARKLINE_COUNT), // RH correlated with temp history
      color: "#818CF8",
    },
    {
      label: "\u0394P",
      value: zoneCr.P.toFixed(1),
      unit: "Pa",
      sparkline: extractSparklineValues(
        useFacilitySimStore.getState().hvacPressureHistory.toArray(),
        SPARKLINE_COUNT,
      ),
      color: "#34D399",
    },
    {
      label: "Particles",
      value: zoneCr.particleCount.toFixed(0),
      unit: "/m\u00B3",
      sparkline: extractSparklineValues(particleHistoryArr, SPARKLINE_COUNT),
      color: "#F59E0B",
    },
    {
      label: "AHU Flow",
      value: ahuSupply.flow.toFixed(2),
      unit: "kg/s",
      sparkline: extractSparklineValues(tempHistoryArr, SPARKLINE_COUNT), // correlated
      color: "#60A5FA",
    },
    {
      label: "Chiller",
      value: chiller.T.toFixed(1),
      unit: "\u00B0C",
      sparkline: extractSparklineValues(tempHistoryArr, SPARKLINE_COUNT),
      color: "#A78BFA",
    },
  ];

  // --- Network Schematic ---
  const nodeIds: HvacNodeId[] = [
    "chiller",
    "ahu-supply",
    "duct-main",
    "zone-cr",
    "zone-prod",
    "ffu-array",
    "return-plenum",
  ];

  const schematicNodes = nodeIds.map((id) => {
    const n = hvac.nodes[id];
    const positions: Record<HvacNodeId, { x: number; y: number }> = {
      chiller: { x: 10, y: 10 },
      "ahu-supply": { x: 110, y: 10 },
      "duct-main": { x: 210, y: 10 },
      "zone-cr": { x: 260, y: 80 },
      "zone-prod": { x: 160, y: 80 },
      "ffu-array": { x: 260, y: 150 },
      "return-plenum": { x: 60, y: 80 },
    };
    const labels: Record<HvacNodeId, string> = {
      chiller: "CHILLER",
      "ahu-supply": "AHU",
      "duct-main": "DUCT",
      "zone-cr": "CR",
      "zone-prod": "PROD",
      "ffu-array": "FFU",
      "return-plenum": "RETURN",
    };

    const values: { label: string; value: string }[] = [];
    values.push({ label: "T", value: `${n.T.toFixed(1)}\u00B0C` });
    if (id === "zone-cr" || id === "zone-prod") {
      values.push({ label: "RH", value: `${n.RH.toFixed(0)}%` });
      values.push({
        label: "Part",
        value: `${n.particleCount.toFixed(0)}`,
      });
    } else if (id === "ahu-supply") {
      values.push({ label: "Flow", value: `${n.flow.toFixed(1)}` });
    } else if (id === "ffu-array") {
      values.push({ label: "Flow", value: `${n.flow.toFixed(1)}` });
    } else if (id === "return-plenum") {
      values.push({ label: "P", value: `${n.P.toFixed(0)}Pa` });
    }

    return {
      id,
      label: labels[id],
      x: positions[id].x,
      y: positions[id].y,
      values,
      health: deriveNodeHealth(id, n.T, n.particleCount),
      highlighted: highlightNodeId === id,
    };
  });

  const ahuOnline = hvac.ahuFanOnline;
  const schematicEdges = [
    { from: "chiller", to: "ahu-supply", animated: ahuOnline },
    { from: "ahu-supply", to: "duct-main", animated: ahuOnline },
    { from: "duct-main", to: "zone-cr", animated: ahuOnline },
    { from: "duct-main", to: "zone-prod", animated: ahuOnline },
    { from: "zone-cr", to: "ffu-array", animated: ahuOnline },
    { from: "ffu-array", to: "return-plenum", animated: ahuOnline },
    { from: "zone-prod", to: "return-plenum", animated: ahuOnline },
    { from: "return-plenum", to: "chiller", animated: ahuOnline },
  ];

  // --- Equipment status ---
  const equipment = [
    {
      id: "chiller",
      label: "Chiller",
      online: hvac.chillerOnline,
      detail: `${chiller.T.toFixed(1)}\u00B0C`,
    },
    {
      id: "ahu",
      label: "AHU Fan",
      online: hvac.ahuFanOnline,
      detail: `${ahuSupply.flow.toFixed(2)} kg/s`,
    },
  ];

  // --- Visible alarms ---
  const visibleAlarms = hvacAlarms.slice(0, MAX_ALARMS);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        style={{ backgroundColor: "var(--sf-overlay-backdrop)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="HVAC / Cleanroom Panel"
        aria-modal="true"
        className={cn(
          "fixed top-0 right-0 z-50 h-full overflow-y-auto transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        style={{
          width: "var(--sf-overlay-width)",
          minWidth: "var(--sf-overlay-min-width, 360px)",
          backgroundColor: "var(--sf-bg-base)",
          borderLeft: "1px solid var(--sf-border-default)",
        }}
      >
        {/* ---- Header ---- */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: "1px solid var(--sf-border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <Building size={20} style={{ color: "var(--sf-ba-primary)" }} />
            <span
              className="text-base font-semibold"
              style={{ color: "var(--sf-text-primary)" }}
            >
              HVAC / Cleanroom
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${severityColor(severity)}20`,
                color: severityColor(severity),
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: severityColor(severity) }}
              />
              {severityLabel(severity)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-md p-1.5 transition-colors hover:opacity-80"
            style={{ color: "var(--sf-text-secondary)" }}
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-5">
          {/* ---- KPI Strip (3x2) ---- */}
          <div className="grid grid-cols-3 gap-3">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="flex flex-col items-center rounded-lg px-2 py-3 text-center"
                style={{
                  backgroundColor: "var(--sf-surface-card)",
                  border: "1px solid var(--sf-border-default)",
                }}
              >
                <span
                  className="text-[10px] font-medium uppercase tracking-wider mb-1"
                  style={{ color: "var(--sf-text-muted)" }}
                >
                  {kpi.label}
                </span>
                <span
                  className="text-lg font-semibold leading-tight"
                  style={{ color: "var(--kpi-value-color)" }}
                >
                  {kpi.value}
                  <span
                    className="text-xs font-normal ml-0.5"
                    style={{ color: "var(--sf-text-muted)" }}
                  >
                    {kpi.unit}
                  </span>
                </span>
                {kpi.sparkline.length >= 2 && (
                  <MiniSparkline
                    data={kpi.sparkline}
                    width={64}
                    height={20}
                    color={kpi.color}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>

          {/* ---- Network Schematic ---- */}
          <div
            className="rounded-lg p-2"
            style={{
              backgroundColor: "var(--sf-surface-card)",
              border: "1px solid var(--sf-border-default)",
            }}
          >
            <div className="flex items-center gap-2 mb-2 px-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                HVAC Network
              </span>
            </div>
            <NetworkSchematic
              nodes={schematicNodes}
              edges={schematicEdges}
              width={380}
              height={220}
            />
          </div>

          {/* ---- Trend Charts ---- */}
          <div className="flex flex-col gap-3">
            <TrendChart
              data={tempHistoryArr}
              markers={markers}
              label="Zone-CR Temperature"
              unit={"\u00B0C"}
              usl={26}
              color="#22D3EE"
              expanded={tempExpanded}
              onToggleExpand={() => setTempExpanded((v) => !v)}
            />
            <TrendChart
              data={particleHistoryArr}
              markers={markers}
              label="Particle Count"
              unit="/m³"
              usl={ISO5_PARTICLE_LIMIT}
              color="#F59E0B"
              expanded={particleExpanded}
              onToggleExpand={() => setParticleExpanded((v) => !v)}
            />
          </div>

          {/* ---- Equipment Status ---- */}
          <div className="grid grid-cols-2 gap-3">
            {equipment.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{
                  backgroundColor: eq.online
                    ? "rgba(16,185,129,0.15)"
                    : "rgba(71,85,105,0.15)",
                  border: "1px solid var(--sf-border-default)",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: eq.online
                      ? "rgba(16,185,129,0.2)"
                      : "rgba(71,85,105,0.2)",
                  }}
                >
                  {eq.online ? (
                    <CheckCircle
                      size={16}
                      style={{
                        color: "var(--sf-status-green)",
                      }}
                    />
                  ) : (
                    <AlertTriangle
                      size={16}
                      style={{
                        color: "var(--sf-status-red)",
                      }}
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--sf-text-primary)" }}
                  >
                    {eq.label}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: eq.online
                          ? "var(--sf-status-green)"
                          : "var(--sf-status-red)",
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{
                        color: eq.online
                          ? "var(--sf-status-green)"
                          : "var(--sf-text-muted)",
                      }}
                    >
                      {eq.online ? "Online" : "Offline"}
                    </span>
                    <span
                      className="text-[10px] ml-1"
                      style={{ color: "var(--sf-text-muted)" }}
                    >
                      {eq.detail}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ---- Alarm Feed ---- */}
          <div
            className="rounded-lg"
            style={{
              backgroundColor: "var(--sf-surface-card)",
              border: "1px solid var(--sf-border-default)",
            }}
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <AlertTriangle
                size={14}
                style={{ color: "var(--sf-ba-danger)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                HVAC Alarms
              </span>
              <span
                className="ml-auto text-[10px]"
                style={{ color: "var(--sf-text-muted)" }}
              >
                {hvacAlarms.length > MAX_ALARMS
                  ? `Showing ${MAX_ALARMS} of ${hvacAlarms.length}`
                  : `${hvacAlarms.length} active`}
              </span>
            </div>

            {visibleAlarms.length === 0 ? (
              <div className="px-4 pb-4">
                <div
                  className="flex items-center justify-center gap-2 rounded-md py-6 text-xs"
                  style={{ color: "var(--sf-text-muted)" }}
                >
                  <CheckCircle
                    size={14}
                    style={{ color: "var(--sf-status-green)" }}
                  />
                  No active alarms
                </div>
              </div>
            ) : (
              <div
                className="max-h-[200px] overflow-y-auto px-4 pb-4 space-y-2"
                role="list"
                aria-label="HVAC alarms"
              >
                {visibleAlarms.map((alarm, idx) => (
                  <div
                    key={idx}
                    role="listitem"
                    className="flex items-start gap-2.5 rounded-md px-3 py-2 text-xs"
                    style={{
                      backgroundColor:
                        alarm.severity === "critical"
                          ? "rgba(239,68,68,0.08)"
                          : alarm.severity === "warning"
                            ? "rgba(245,158,11,0.08)"
                            : "transparent",
                      border:
                        alarm.severity === "info"
                          ? "1px solid var(--sf-border-default)"
                          : "1px solid transparent",
                    }}
                  >
                    <AlertTriangle
                      size={12}
                      className="mt-0.5 shrink-0"
                      style={{
                        color:
                          alarm.severity === "critical"
                            ? "var(--sf-status-red)"
                            : alarm.severity === "warning"
                              ? "var(--sf-status-amber)"
                              : "var(--sf-text-muted)",
                      }}
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span
                        className="font-medium leading-snug"
                        style={{ color: "var(--sf-text-primary)" }}
                      >
                        {alarm.message}
                      </span>
                      <span
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: "var(--sf-text-muted)" }}
                      >
                        {alarm.severity} &middot; tick {alarm.tick}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
