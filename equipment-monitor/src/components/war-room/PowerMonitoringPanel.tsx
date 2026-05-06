"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Zap, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialogFocusTrap } from "@/hooks/use-dialog-focus-trap";
import { GaugeCard } from "@/components/charts/gauge-card";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type {
  PowerSubsystemData,
  TransformerStatus,
} from "@/lib/war-room-types";
import { generatePowerSubsystemData } from "@/lib/war-room-mock-data";
import type { ProcessParameter } from "@/types/equipment";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PowerMonitoringPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 3000;
const TREND_POINTS = 24;
const MAX_ALARMS = 5;

/** Spec limits used to build ProcessParameter objects from live data */
const SPECS = {
  voltage: { lsl: 216, usl: 254, nominal: 230, tolerance: 17 },
  current: { lsl: 0, usl: 100, nominal: 85, tolerance: 15 },
  powerFactor: { lsl: 0.8, usl: 1.0, nominal: 0.92, tolerance: 0.1 },
  loadPercentage: { lsl: 0, usl: 100, nominal: 62, tolerance: 38 },
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive a human-readable status from transformer state */
function transformerLabel(status: TransformerStatus): string {
  switch (status) {
    case "online":
      return "Online";
    case "offline":
      return "Offline";
    case "alarm":
      return "Alarm";
  }
}

function transformerColor(status: TransformerStatus): string {
  switch (status) {
    case "online":
      return "var(--sf-status-green)";
    case "offline":
      return "var(--sf-text-muted)";
    case "alarm":
      return "var(--sf-status-red)";
  }
}

function transformerBg(status: TransformerStatus): string {
  switch (status) {
    case "online":
      return "rgba(16,185,129,0.15)";
    case "offline":
      return "rgba(71,85,105,0.15)";
    case "alarm":
      return "rgba(239,68,68,0.15)";
  }
}

/** Overall system severity derived from transformer statuses + alarms */
type SystemSeverity = "normal" | "warning" | "alarm";
function systemSeverity(data: PowerSubsystemData): SystemSeverity {
  if (
    data.transformer1Status === "alarm" ||
    data.transformer2Status === "alarm"
  )
    return "alarm";
  if (data.alarms.some((a) => a.severity === "critical")) return "alarm";
  if (data.alarms.some((a) => a.severity === "warning")) return "warning";
  return "normal";
}

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

/** Format a short time for the trend chart */
function formatHour(index: number): string {
  const h = (index + 1) % 24;
  return `${h.toString().padStart(2, "0")}:00`;
}

// ---------------------------------------------------------------------------
// 24-hour trend mock generator
// ---------------------------------------------------------------------------

interface TrendPoint {
  time: string;
  value: number;
}

function generateTrend(baseValue: number, variance: number): TrendPoint[] {
  return Array.from({ length: TREND_POINTS }, (_, i) => {
    const oscillation = Math.sin((i / TREND_POINTS) * Math.PI * 2) * variance;
    const noise = (Math.random() - 0.5) * variance * 0.5;
    return {
      time: formatHour(i),
      value: Math.round((baseValue + oscillation + noise) * 10) / 10,
    };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PowerMonitoringPanel({
  isOpen,
  onClose,
}: PowerMonitoringPanelProps) {
  // Live subsystem data
  const [data, setData] = useState<PowerSubsystemData>(() =>
    generatePowerSubsystemData()
  );

  // Trend sparkline datasets (refresh every interval)
  const [trendVoltage, setTrendVoltage] = useState<TrendPoint[]>(() =>
    generateTrend(230, 8)
  );

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(panelRef, isOpen, onClose);

  // Refresh live data on interval
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => {
      const fresh = generatePowerSubsystemData();
      setData(fresh);
      setTrendVoltage(generateTrend(fresh.voltage, 8));
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isOpen]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Build ProcessParameter objects for the gauge cards
  const gaugeParams: ProcessParameter[] = [
    {
      name: "Voltage",
      value: data.voltage,
      unit: "V",
      nominal: SPECS.voltage.nominal,
      lsl: SPECS.voltage.lsl,
      usl: SPECS.voltage.usl,
      tolerance: SPECS.voltage.tolerance,
      timestamp: new Date(),
    },
    {
      name: "Current",
      value: data.current,
      unit: "A",
      nominal: SPECS.current.nominal,
      lsl: SPECS.current.lsl,
      usl: SPECS.current.usl,
      tolerance: SPECS.current.tolerance,
      timestamp: new Date(),
    },
    {
      name: "Power Factor",
      value: data.powerFactor,
      unit: "",
      nominal: SPECS.powerFactor.nominal,
      lsl: SPECS.powerFactor.lsl,
      usl: SPECS.powerFactor.usl,
      tolerance: SPECS.powerFactor.tolerance,
      timestamp: new Date(),
    },
    {
      name: "Load",
      value: data.loadPercentage,
      unit: "%",
      nominal: SPECS.loadPercentage.nominal,
      lsl: SPECS.loadPercentage.lsl,
      usl: SPECS.loadPercentage.usl,
      tolerance: SPECS.loadPercentage.tolerance,
      timestamp: new Date(),
    },
  ];

  const severity = systemSeverity(data);
  const visibleAlarms = data.alarms.slice(0, MAX_ALARMS);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        style={{ backgroundColor: "var(--sf-overlay-backdrop)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Power Monitoring Panel"
        aria-modal="true"
        className={cn(
          "fixed top-0 right-0 z-50 h-full overflow-y-auto transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          width: 'var(--sf-overlay-width)',
          minWidth: 'var(--sf-overlay-min-width, 360px)',
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
              Power Monitoring
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
          {/* ---- KPI Row ---- */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                { label: "Active Power", value: data.activePower, unit: "kW" },
                { label: "Voltage", value: data.voltage, unit: "V" },
                { label: "Current", value: data.current, unit: "A" },
                { label: "Power Factor", value: data.powerFactor, unit: "" },
              ] as const
            ).map((kpi) => (
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
              </div>
            ))}
          </div>

          {/* ---- Gauge Grid 2x2 ---- */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {gaugeParams.map((param) => (
              <GaugeCard key={param.name} parameter={param} />
            ))}
          </div>

          {/* ---- Trend Sparkline ---- */}
          <div
            className="rounded-lg p-4"
            style={{
              backgroundColor: "var(--sf-surface-card)",
              border: "1px solid var(--sf-border-default)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Activity
                size={14}
                style={{ color: "var(--sf-power-primary)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                24h Voltage Trend
              </span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendVoltage}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--sf-surface-elevated)",
                    border: "1px solid var(--sf-border-default)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--sf-text-secondary)" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--sf-power-primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: "var(--sf-power-primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ---- Transformer Status ---- */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { id: "T1", status: data.transformer1Status },
                { id: "T2", status: data.transformer2Status },
              ] as const
            ).map((x) => (
              <div
                key={x.id}
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{
                  backgroundColor: transformerBg(x.status),
                  border: "1px solid var(--sf-border-default)",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: `${transformerColor(x.status)}20`,
                  }}
                >
                  {x.status === "alarm" ? (
                    <AlertTriangle
                      size={16}
                      style={{ color: transformerColor(x.status) }}
                    />
                  ) : (
                    <CheckCircle
                      size={16}
                      style={{ color: transformerColor(x.status) }}
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--sf-text-primary)" }}
                  >
                    Transformer {x.id}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: transformerColor(x.status) }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: transformerColor(x.status) }}
                    >
                      {transformerLabel(x.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ---- Alarm List ---- */}
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
                style={{ color: "var(--sf-power-danger)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                Recent Alarms
              </span>
              <span
                className="ml-auto text-[10px]"
                style={{ color: "var(--sf-text-muted)" }}
              >
                {data.alarms.length > MAX_ALARMS
                  ? `Showing ${MAX_ALARMS} of ${data.alarms.length}`
                  : `${data.alarms.length} active`}
              </span>
            </div>

            {visibleAlarms.length === 0 ? (
              <div className="px-4 pb-4">
                <div
                  className="flex items-center justify-center gap-2 rounded-md py-6 text-xs"
                  style={{ color: "var(--sf-text-muted)" }}
                >
                  <CheckCircle size={14} style={{ color: "var(--sf-status-green)" }} />
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
                        {alarm.severity} &middot;{" "}
                        {alarm.timestamp.toLocaleTimeString()}
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
