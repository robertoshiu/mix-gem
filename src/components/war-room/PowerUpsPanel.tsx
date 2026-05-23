"use client";

import { useState, useRef, useMemo } from "react";
import { X, Zap, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialogFocusTrap } from "@/hooks/use-dialog-focus-trap";
import { useFacilitySimStore } from "@/stores/facility-sim-store";
import type { HistoryPoint } from "@/stores/facility-sim-store";
import type { PowerNodeId } from "@/lib/engines/facility-types";
import { MiniSparkline } from "@/components/war-room/canvas/MiniSparkline";
import { TrendChart } from "@/components/war-room/canvas/TrendChart";
import { NetworkSchematic } from "@/components/war-room/canvas/NetworkSchematic";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PowerUpsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  highlightNodeId?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ALARMS = 5;
const SPARKLINE_COUNT = 30;

/** Voltage sag threshold (V) */
const VOLTAGE_SAG_LSL = 210;

/** Critical battery SOC threshold */
const SOC_CRITICAL_LSL = 20;

/** Transformer rated capacity (kVA) */
const TRANSFORMER_CAPACITY = 500;

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
  nodeId: PowerNodeId | "ups",
  state: {
    theta?: number;
    online?: boolean;
    soc?: number;
    V?: number;
    PF?: number;
  },
): "normal" | "warning" | "alarm" {
  if (nodeId === "transformer-t1" || nodeId === "transformer-t2") {
    if (!state.online) return "alarm";
    if (state.theta !== undefined) {
      if (state.theta > 85) return "alarm";
      if (state.theta > 70) return "warning";
    }
    return "normal";
  }
  if (nodeId === "ups") {
    if (!state.online) return "normal"; // UPS offline = standby, not alarming
    if (state.soc !== undefined && state.soc < 0.2) return "alarm";
    if (state.soc !== undefined && state.soc < 0.5) return "warning";
    return "normal";
  }
  if (nodeId === "load-bus") {
    if (state.V !== undefined && state.V < VOLTAGE_SAG_LSL) return "alarm";
    if (state.PF !== undefined && state.PF < 0.85) return "warning";
    return "normal";
  }
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

export function PowerUpsPanel({
  isOpen,
  onClose,
  highlightNodeId,
}: PowerUpsPanelProps) {
  // --- Store selectors ---
  const sim = useFacilitySimStore((s) => s.sim);
  const allAlarms = useFacilitySimStore((s) => s.alarms);
  const voltageHistory = useFacilitySimStore((s) => s.powerVoltageHistory);
  const loadHistory = useFacilitySimStore((s) => s.powerLoadHistory);
  const socHistory = useFacilitySimStore((s) => s.powerSocHistory);
  const markers = useFacilitySimStore((s) => s.scenarioMarkers);

  const powerAlarms = useMemo(
    () => allAlarms.filter((a) => a.subsystem === "power"),
    [allAlarms],
  );

  // --- Trend chart expand state ---
  const [voltageExpanded, setVoltageExpanded] = useState(false);
  const [loadExpanded, setLoadExpanded] = useState(false);
  const [socExpanded, setSocExpanded] = useState(false);

  // --- Focus trap ---
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(panelRef, isOpen, onClose);

  // --- Derived values ---
  const power = sim.power;
  const loadBus = power.nodes["load-bus"];
  const t1 = power.nodes["transformer-t1"];
  const t2 = power.nodes["transformer-t2"];
  const ups = power.ups;

  // Compute overall severity
  const severity: SystemSeverity = useMemo(() => {
    if (powerAlarms.some((a) => a.severity === "critical")) return "alarm";
    if (powerAlarms.some((a) => a.severity === "warning")) return "warning";
    if (loadBus.V < 210 || (ups.online && ups.soc < 0.2)) return "alarm";
    if (loadBus.PF < 0.85) return "warning";
    return "normal";
  }, [powerAlarms, loadBus.V, loadBus.PF, ups.online, ups.soc]);

  // --- KPI data ---
  const voltageHistoryArr = voltageHistory.toArray();
  const loadHistoryArr = loadHistory.toArray();
  const socHistoryArr = socHistory.toArray();

  const kpis = [
    {
      label: "Voltage",
      value: loadBus.V.toFixed(1),
      unit: "V",
      sparkline: extractSparklineValues(voltageHistoryArr, SPARKLINE_COUNT),
      color: "#22D3EE",
    },
    {
      label: "Current",
      value: loadBus.I.toFixed(1),
      unit: "A",
      sparkline: extractSparklineValues(loadHistoryArr, SPARKLINE_COUNT),
      color: "#60A5FA",
    },
    {
      label: "PF",
      value: loadBus.PF.toFixed(2),
      unit: "",
      sparkline: [] as number[],
      color: "#818CF8",
    },
    {
      label: "Load%",
      value: ((power.totalLoad / TRANSFORMER_CAPACITY) * 100).toFixed(1),
      unit: "%",
      sparkline: extractSparklineValues(loadHistoryArr, SPARKLINE_COUNT),
      color: "#F59E0B",
    },
    {
      label: "UPS SOC",
      value: (ups.soc * 100).toFixed(1),
      unit: "%",
      sparkline: extractSparklineValues(socHistoryArr, SPARKLINE_COUNT),
      color: "#34D399",
    },
    {
      label: "Energy",
      value: power.totalLoad.toFixed(1),
      unit: "kW",
      sparkline: [] as number[],
      color: "#A78BFA",
    },
  ];

  // --- Network Schematic ---
  const nodeIds: PowerNodeId[] = [
    "utility",
    "transformer-t1",
    "transformer-t2",
    "switchgear",
    "pdu-a",
    "load-bus",
  ];

  const positions: Record<PowerNodeId | "ups", { x: number; y: number }> = {
    utility: { x: 10, y: 60 },
    "transformer-t1": { x: 110, y: 10 },
    "transformer-t2": { x: 110, y: 110 },
    switchgear: { x: 210, y: 60 },
    "pdu-a": { x: 310, y: 60 },
    "load-bus": { x: 310, y: 130 },
    ups: { x: 210, y: 130 },
  };

  const labels: Record<PowerNodeId | "ups", string> = {
    utility: "UTILITY",
    "transformer-t1": "T1",
    "transformer-t2": "T2",
    switchgear: "SWGR",
    "pdu-a": "PDU-A",
    "load-bus": "LOAD",
    ups: "UPS",
  };

  const schematicNodes = [
    ...nodeIds.map((id) => {
      const n = power.nodes[id];
      const values: { label: string; value: string }[] = [];

      if (id === "utility") {
        values.push({ label: "V", value: `${n.V.toFixed(0)}V` });
      } else if (id === "transformer-t1") {
        values.push({ label: "V", value: `${n.V.toFixed(0)}V` });
        values.push({ label: "\u03B8", value: `${n.theta.toFixed(0)}\u00B0C` });
      } else if (id === "transformer-t2") {
        values.push({ label: "V", value: `${n.V.toFixed(0)}V` });
        values.push({ label: "\u03B8", value: `${n.theta.toFixed(0)}\u00B0C` });
      } else if (id === "switchgear") {
        values.push({ label: "V", value: `${n.V.toFixed(0)}V` });
        values.push({ label: "PF", value: `${n.PF.toFixed(2)}` });
      } else if (id === "pdu-a") {
        values.push({ label: "V", value: `${n.V.toFixed(0)}V` });
        values.push({ label: "I", value: `${n.I.toFixed(1)}A` });
      } else if (id === "load-bus") {
        values.push({ label: "P", value: `${n.P_active.toFixed(0)}kW` });
        values.push({ label: "PF", value: `${n.PF.toFixed(2)}` });
      }

      const healthState: Record<string, unknown> = { theta: n.theta, V: n.V, PF: n.PF };
      if (id === "transformer-t1") {
        healthState.online = power.t1Online;
      } else if (id === "transformer-t2") {
        healthState.online = power.t2Online;
      }

      return {
        id,
        label: labels[id],
        x: positions[id].x,
        y: positions[id].y,
        values,
        health: deriveNodeHealth(id, healthState as Parameters<typeof deriveNodeHealth>[1]),
        highlighted: highlightNodeId === id,
      };
    }),
    // UPS node (not in PowerNodeId, handled separately)
    {
      id: "ups",
      label: labels.ups,
      x: positions.ups.x,
      y: positions.ups.y,
      values: [
        { label: "SOC", value: `${(ups.soc * 100).toFixed(0)}%` },
        { label: "V", value: `${ups.outputV.toFixed(0)}V` },
      ],
      health: deriveNodeHealth("ups", {
        online: ups.online,
        soc: ups.soc,
      }),
      highlighted: highlightNodeId === "ups",
    },
  ];

  const schematicEdges = [
    { from: "utility", to: "transformer-t1", animated: power.t1Online },
    {
      from: "utility",
      to: "transformer-t2",
      animated: power.t2Online && !power.t1Online,
    },
    { from: "transformer-t1", to: "switchgear", animated: power.t1Online },
    {
      from: "transformer-t2",
      to: "switchgear",
      animated: !power.t1Online && power.t2Online,
    },
    { from: "switchgear", to: "pdu-a", animated: true },
    { from: "pdu-a", to: "load-bus", animated: true },
    { from: "ups", to: "pdu-a", animated: ups.online },
  ];

  // --- Equipment status ---
  const equipment = [
    {
      id: "t1",
      label: "Transformer T1",
      online: power.t1Online,
      detail: `${t1.theta.toFixed(0)}\u00B0C / ${t1.V.toFixed(0)}V`,
    },
    {
      id: "t2",
      label: "Transformer T2",
      online: power.t2Online,
      detail: `${t2.theta.toFixed(0)}\u00B0C / ${t2.V.toFixed(0)}V`,
    },
    {
      id: "ups",
      label: "UPS Battery",
      online: ups.online,
      detail: `SOC ${(ups.soc * 100).toFixed(0)}% / ${ups.outputV.toFixed(0)}V`,
    },
  ];

  // --- Visible alarms ---
  const visibleAlarms = powerAlarms.slice(0, MAX_ALARMS);

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
        aria-label="Power & UPS Panel"
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
            <Zap size={20} style={{ color: "var(--sf-power-primary)" }} />
            <span
              className="text-base font-semibold"
              style={{ color: "var(--sf-text-primary)" }}
            >
              Power & UPS
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
                Electrical Distribution
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
              data={voltageHistoryArr}
              markers={markers}
              label="Load Bus Voltage"
              unit="V"
              lsl={VOLTAGE_SAG_LSL}
              color="#22D3EE"
              expanded={voltageExpanded}
              onToggleExpand={() => setVoltageExpanded((v) => !v)}
            />
            <TrendChart
              data={loadHistoryArr}
              markers={markers}
              label="Load %"
              unit="%"
              color="#F59E0B"
              expanded={loadExpanded}
              onToggleExpand={() => setLoadExpanded((v) => !v)}
            />
            <TrendChart
              data={socHistoryArr}
              markers={markers}
              label="Battery SOC"
              unit="%"
              lsl={SOC_CRITICAL_LSL}
              color="#34D399"
              expanded={socExpanded}
              onToggleExpand={() => setSocExpanded((v) => !v)}
            />
          </div>

          {/* ---- Equipment Status ---- */}
          <div className="grid grid-cols-3 gap-3">
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
                Power Alarms
              </span>
              <span
                className="ml-auto text-[10px]"
                style={{ color: "var(--sf-text-muted)" }}
              >
                {powerAlarms.length > MAX_ALARMS
                  ? `Showing ${MAX_ALARMS} of ${powerAlarms.length}`
                  : `${powerAlarms.length} active`}
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
                aria-label="Power alarms"
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
