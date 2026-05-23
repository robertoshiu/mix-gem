"use client";

import { useState, useRef, useMemo } from "react";
import { X, Wind, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialogFocusTrap } from "@/hooks/use-dialog-focus-trap";
import { useFacilitySimStore } from "@/stores/facility-sim-store";
import type { HistoryPoint } from "@/stores/facility-sim-store";
import { MiniSparkline } from "@/components/war-room/canvas/MiniSparkline";
import { TrendChart } from "@/components/war-room/canvas/TrendChart";
import { NetworkSchematic } from "@/components/war-room/canvas/NetworkSchematic";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GasChemicalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  highlightNodeId?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ALARMS = 5;
const SPARKLINE_COUNT = 30;

/** OSHA TWA for NH3: 25 ppm */
const NH3_USL = 25;

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
      return "SAFE";
    case "warning":
      return "WARNING";
    case "alarm":
      return "DANGER";
  }
}

function extractSparklineValues(
  history: HistoryPoint[],
  count: number,
): number[] {
  const slice =
    history.length > count ? history.slice(history.length - count) : history;
  return slice.map((p) => p.value);
}

function sensorStatusColor(status: "normal" | "alarm" | "fault"): string {
  switch (status) {
    case "normal":
      return "var(--sf-status-green)";
    case "alarm":
      return "var(--sf-status-red)";
    case "fault":
      return "var(--sf-status-amber)";
  }
}

function sensorStatusLabel(status: "normal" | "alarm" | "fault"): string {
  switch (status) {
    case "normal":
      return "Normal";
    case "alarm":
      return "Alarm";
    case "fault":
      return "Fault";
  }
}

function thresholdFraction(
  concentration: number,
  highAlarm: number,
): number {
  return Math.min(concentration / highAlarm, 1);
}

function thresholdBarColor(fraction: number): string {
  if (fraction >= 0.9) return "var(--sf-status-red)";
  if (fraction >= 0.6) return "var(--sf-status-amber)";
  return "var(--sf-gas-primary)";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GasChemicalPanel({
  isOpen,
  onClose,
  highlightNodeId,
}: GasChemicalPanelProps) {
  // --- Store selectors ---
  const sim = useFacilitySimStore((s) => s.sim);
  const allAlarms = useFacilitySimStore((s) => s.alarms);
  const nh3History = useFacilitySimStore((s) => s.gasNh3History);
  const o2History = useFacilitySimStore((s) => s.gasO2History);
  const scrubberHistory = useFacilitySimStore((s) => s.gasScrubberHistory);
  const markers = useFacilitySimStore((s) => s.scenarioMarkers);

  const gasAlarms = useMemo(
    () => allAlarms.filter((a) => a.subsystem === "gas"),
    [allAlarms],
  );

  // --- Trend chart expand state ---
  const [nh3Expanded, setNh3Expanded] = useState(false);
  const [scrubberExpanded, setScrubberExpanded] = useState(false);

  // --- Focus trap ---
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(panelRef, isOpen, onClose);

  // --- Derived values ---
  const gas = sim.gas;
  const sensors = gas.sensors;
  const scrubber = gas.scrubber;

  // Find first O2 sensor
  const o2Sensor = sensors.find((s) => s.species === "O2");
  const o2Value = o2Sensor?.concentration ?? 20.9;

  // Worst non-O2 sensor by fraction of highAlarm
  const worstGas = useMemo(() => {
    const nonO2 = sensors.filter((s) => s.species !== "O2");
    if (nonO2.length === 0) return { value: 0, unit: "ppm" as const };
    let worst = nonO2[0];
    let worstRatio = worst.concentration / worst.highAlarm;
    for (let i = 1; i < nonO2.length; i++) {
      const ratio = nonO2[i].concentration / nonO2[i].highAlarm;
      if (ratio > worstRatio) {
        worst = nonO2[i];
        worstRatio = ratio;
      }
    }
    return { value: worst.concentration, unit: worst.unit };
  }, [sensors]);

  // Scrubber load: inletFlow / 0.5 * 100
  const scrubberLoadPct = (scrubber.inletFlow / 0.5) * 100;
  const scrubberEffPct = scrubber.efficiency * 100;

  // Sensor health count
  const sensorsOk = sensors.filter((s) => s.status === "normal").length;

  // Compute overall severity
  const severity: SystemSeverity = useMemo(() => {
    if (gasAlarms.some((a) => a.severity === "critical")) return "alarm";
    if (gasAlarms.some((a) => a.severity === "warning")) return "warning";
    if (sensors.some((s) => s.status === "alarm")) return "alarm";
    if (sensors.some((s) => s.status === "fault")) return "warning";
    return "normal";
  }, [gasAlarms, sensors]);

  // --- KPI data ---
  const o2HistoryArr = o2History.toArray();
  const nh3HistoryArr = nh3History.toArray();
  const scrubberHistoryArr = scrubberHistory.toArray();

  const kpis = [
    {
      label: "O2%",
      value: o2Value.toFixed(1),
      unit: "%",
      sparkline: extractSparklineValues(o2HistoryArr, SPARKLINE_COUNT),
      color: "#34D399",
    },
    {
      label: "Worst Gas",
      value: worstGas.value.toFixed(1),
      unit: worstGas.unit,
      sparkline: extractSparklineValues(nh3HistoryArr, SPARKLINE_COUNT),
      color: "#EF4444",
    },
    {
      label: "Scrub Load",
      value: scrubberLoadPct.toFixed(0),
      unit: "%",
      sparkline: extractSparklineValues(scrubberHistoryArr, SPARKLINE_COUNT),
      color: "#60A5FA",
    },
    {
      label: "Efficiency",
      value: scrubberEffPct.toFixed(1),
      unit: "%",
      sparkline: extractSparklineValues(scrubberHistoryArr, SPARKLINE_COUNT),
      color: "#22D3EE",
    },
    {
      label: "Sensors OK",
      value: `${sensorsOk}/8`,
      unit: "",
      sparkline: [] as number[],
      color: "#10B981",
    },
    {
      label: "Leak x",
      value: `${gas.leakRateMultiplier.toFixed(1)}x`,
      unit: "",
      sparkline: [] as number[],
      color: "#F59E0B",
    },
  ];

  // --- Network Schematic ---
  const schematicNodes = useMemo(() => {
    const nodes: {
      id: string;
      label: string;
      x: number;
      y: number;
      values: { label: string; value: string }[];
      health: "normal" | "warning" | "alarm";
      highlighted?: boolean;
    }[] = [];

    // GAS-CAB node
    nodes.push({
      id: "gas-cab",
      label: "GAS-CAB",
      x: 10,
      y: 10,
      values: [
        { label: "P", value: `${gas.cabinetPressure.toFixed(1)}Pa` },
        { label: "Leak", value: `${gas.leakRateMultiplier.toFixed(1)}x` },
      ],
      health: gas.leakRateMultiplier > 5 ? "alarm" : gas.leakRateMultiplier > 2 ? "warning" : "normal",
      highlighted: highlightNodeId === "gas-cab",
    });

    // Sensor nodes arranged in two rows
    const sensorPositions: Record<string, { x: number; y: number }> = {};
    // Row 1: first 4 sensors
    const row1 = sensors.slice(0, 4);
    const row2 = sensors.slice(4, 8);
    row1.forEach((s, i) => {
      sensorPositions[s.id] = { x: 120 + i * 60, y: 10 };
    });
    row2.forEach((s, i) => {
      sensorPositions[s.id] = { x: 120 + i * 60, y: 80 };
    });

    sensors.forEach((s) => {
      const pos = sensorPositions[s.id] ?? { x: 120, y: 45 };
      nodes.push({
        id: s.id,
        label: s.species,
        x: pos.x,
        y: pos.y,
        values: [
          {
            label: s.unit,
            value: s.concentration.toFixed(s.unit === "%" ? 1 : 0),
          },
        ],
        health: s.status === "alarm" ? "alarm" : s.status === "fault" ? "warning" : "normal",
        highlighted: highlightNodeId === s.id,
      });
    });

    // SCRUBBER node
    nodes.push({
      id: "scrubber",
      label: "SCRUBBER",
      x: 160,
      y: 150,
      values: [
        { label: "Eff", value: `${scrubberEffPct.toFixed(0)}%` },
        { label: "", value: scrubber.online ? "ON" : "OFF" },
      ],
      health: !scrubber.online ? "alarm" : scrubber.efficiency < 0.8 ? "warning" : "normal",
      highlighted: highlightNodeId === "scrubber",
    });

    return nodes;
  }, [sensors, gas.cabinetPressure, gas.leakRateMultiplier, scrubber, scrubberEffPct, highlightNodeId]);

  const schematicEdges = useMemo(() => {
    const edges: { from: string; to: string; animated: boolean }[] = [];
    // GAS-CAB → each sensor
    sensors.forEach((s) => {
      edges.push({ from: "gas-cab", to: s.id, animated: scrubber.online });
    });
    // GAS-CAB → SCRUBBER
    edges.push({ from: "gas-cab", to: "scrubber", animated: scrubber.online });
    return edges;
  }, [sensors, scrubber.online]);

  // --- Equipment status ---
  const equipment = [
    {
      id: "scrubber",
      label: "Scrubber",
      online: scrubber.online,
      detail: `${scrubberEffPct.toFixed(0)}% eff · ${scrubber.powerDraw.toFixed(1)} kW`,
    },
  ];

  // --- Visible alarms ---
  const visibleAlarms = gasAlarms.slice(0, MAX_ALARMS);

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
        aria-label="Gas & Chemical Panel"
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
            <Wind size={20} style={{ color: "var(--sf-gas-primary)" }} />
            <span
              className="text-base font-semibold"
              style={{ color: "var(--sf-text-primary)" }}
            >
              Gas & Chemical
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
                  {kpi.unit && (
                    <span
                      className="text-xs font-normal ml-0.5"
                      style={{ color: "var(--sf-text-muted)" }}
                    >
                      {kpi.unit}
                    </span>
                  )}
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
                Gas Network
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
              data={nh3HistoryArr}
              markers={markers}
              label="NH3 Concentration"
              unit="ppm"
              usl={NH3_USL}
              color="#22D3EE"
              expanded={nh3Expanded}
              onToggleExpand={() => setNh3Expanded((v) => !v)}
            />
            <TrendChart
              data={scrubberHistoryArr}
              markers={markers}
              label="Scrubber Efficiency"
              unit="%"
              color="#34D399"
              expanded={scrubberExpanded}
              onToggleExpand={() => setScrubberExpanded((v) => !v)}
            />
          </div>

          {/* ---- Sensor Grid ---- */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wind
                size={14}
                style={{ color: "var(--sf-gas-primary)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                Gas Sensors
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {sensors.map((sensor) => {
                const frac = thresholdFraction(
                  sensor.concentration,
                  sensor.highAlarm,
                );
                return (
                  <div
                    key={sensor.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                    style={{
                      backgroundColor: "var(--sf-surface-card)",
                      border: "1px solid var(--sf-border-default)",
                    }}
                  >
                    {/* Status indicator */}
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        backgroundColor: `${sensorStatusColor(sensor.status)}20`,
                      }}
                    >
                      {sensor.status === "normal" ? (
                        <CheckCircle
                          size={14}
                          style={{ color: sensorStatusColor(sensor.status) }}
                        />
                      ) : (
                        <AlertTriangle
                          size={14}
                          style={{ color: sensorStatusColor(sensor.status) }}
                        />
                      )}
                    </div>

                    {/* Gas type + value */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--sf-text-primary)" }}
                        >
                          {sensor.species}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color:
                              sensor.status === "alarm"
                                ? "var(--sf-status-red)"
                                : "var(--sf-text-primary)",
                          }}
                        >
                          {sensor.concentration.toFixed(sensor.unit === "%" ? 1 : 1)}{" "}
                          <span
                            className="text-[10px] font-normal"
                            style={{ color: "var(--sf-text-muted)" }}
                          >
                            {sensor.unit}
                          </span>
                        </span>
                      </div>

                      {/* Threshold bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div
                          className="flex-1 h-1.5 rounded-full"
                          style={{
                            backgroundColor: "var(--sf-border-default)",
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${frac * 100}%`,
                              backgroundColor: thresholdBarColor(frac),
                            }}
                          />
                        </div>
                        <span
                          className="text-[9px] uppercase tracking-wider shrink-0"
                          style={{ color: "var(--sf-text-muted)" }}
                        >
                          {sensorStatusLabel(sensor.status)}
                        </span>
                      </div>

                      {/* Threshold labels */}
                      <div className="flex justify-between mt-0.5">
                        <span
                          className="text-[9px]"
                          style={{ color: "var(--sf-text-muted)" }}
                        >
                          L: {sensor.lowAlarm}
                        </span>
                        <span
                          className="text-[9px]"
                          style={{ color: "var(--sf-text-muted)" }}
                        >
                          H: {sensor.highAlarm}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---- Equipment Status ---- */}
          <div className="grid grid-cols-1 gap-3">
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
                Gas Alarms
              </span>
              <span
                className="ml-auto text-[10px]"
                style={{ color: "var(--sf-text-muted)" }}
              >
                {gasAlarms.length > MAX_ALARMS
                  ? `Showing ${MAX_ALARMS} of ${gasAlarms.length}`
                  : `${gasAlarms.length} active`}
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
                aria-label="Gas alarms"
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
