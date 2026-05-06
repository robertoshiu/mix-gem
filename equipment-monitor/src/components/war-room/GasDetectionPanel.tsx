"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Wind, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  GasDetectionSubsystemData,
  GasSensor,
  AlarmEntry,
} from "@/lib/war-room-types";
import { generateGasDetectionSubsystemData } from "@/lib/war-room-mock-data";
import { useDialogFocusTrap } from "@/hooks/use-dialog-focus-trap";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GasDetectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 3000;
const MAX_ALARMS = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AlarmLevel = "safe" | "warning" | "danger";

function getAlarmLevel(data: GasDetectionSubsystemData): AlarmLevel {
  const hasCritical = data.alarms.some((a) => a.severity === "critical");
  const hasAlarmSensor = data.sensors.some((s) => s.status === "alarm");
  const hasWarningAlarm = data.alarms.some((a) => a.severity === "warning");
  const hasFault = data.sensors.some((s) => s.status === "fault");
  if (hasCritical || hasAlarmSensor) return "danger";
  if (hasWarningAlarm || hasFault) return "warning";
  return "safe";
}

function levelColor(level: AlarmLevel): string {
  switch (level) {
    case "safe":
      return "var(--sf-status-green)";
    case "warning":
      return "var(--sf-status-amber)";
    case "danger":
      return "var(--sf-status-red)";
  }
}

function levelBg(level: AlarmLevel): string {
  switch (level) {
    case "safe":
      return "rgba(16,185,129,0.12)";
    case "warning":
      return "rgba(245,158,11,0.12)";
    case "danger":
      return "rgba(239,68,68,0.12)";
  }
}

function levelLabel(level: AlarmLevel): string {
  switch (level) {
    case "safe":
      return "SAFE";
    case "warning":
      return "WARNING";
    case "danger":
      return "DANGER";
  }
}

function sensorStatusColor(status: GasSensor["status"]): string {
  switch (status) {
    case "normal":
      return "var(--sf-status-green)";
    case "alarm":
      return "var(--sf-status-red)";
    case "fault":
      return "var(--sf-status-amber)";
  }
}

function sensorStatusLabel(status: GasSensor["status"]): string {
  switch (status) {
    case "normal":
      return "Normal";
    case "alarm":
      return "Alarm";
    case "fault":
      return "Fault";
  }
}

/** Calculate what fraction of the way to highAlarm the current concentration is (0-1) */
function thresholdFraction(
  concentration: number,
  highAlarm: number
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

export function GasDetectionPanel({
  isOpen,
  onClose,
}: GasDetectionPanelProps) {
  const [data, setData] = useState<GasDetectionSubsystemData>(() =>
    generateGasDetectionSubsystemData()
  );

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(panelRef, isOpen, onClose);

  // Refresh on interval
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => {
      setData(generateGasDetectionSubsystemData());
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

  const alarmLevel = getAlarmLevel(data);
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
        aria-label="Gas Detection Panel"
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
            <Wind size={20} style={{ color: "var(--sf-gas-primary)" }} />
            <span
              className="text-base font-semibold"
              style={{ color: "var(--sf-text-primary)" }}
            >
              Gas Detection
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${levelColor(alarmLevel)}20`,
                color: levelColor(alarmLevel),
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: levelColor(alarmLevel) }}
              />
              {levelLabel(alarmLevel)}
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
          {/* ---- Overall Status Banner ---- */}
          <div
            className="flex items-center justify-between rounded-lg px-4 py-3"
            style={{
              backgroundColor: levelBg(alarmLevel),
              border: `1px solid ${levelColor(alarmLevel)}40`,
            }}
          >
            <div className="flex items-center gap-2">
              {alarmLevel === "safe" ? (
                <CheckCircle
                  size={18}
                  style={{ color: levelColor(alarmLevel) }}
                />
              ) : (
                <AlertTriangle
                  size={18}
                  style={{ color: levelColor(alarmLevel) }}
                />
              )}
              <span
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: levelColor(alarmLevel) }}
              >
                {levelLabel(alarmLevel)}
              </span>
            </div>
            <span
              className="text-[10px]"
              style={{ color: "var(--sf-text-muted)" }}
            >
              {data.sensors.length} sensors monitored
            </span>
          </div>

          {/* ---- Sensor Grid ---- */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity
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
              {data.sensors.map((sensor) => {
                const frac = thresholdFraction(
                  sensor.concentration,
                  sensor.highAlarm
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
                          {sensor.gasType}
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
                          {sensor.concentration}{" "}
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

          {/* ---- Threshold Reference ---- */}
          <div
            className="rounded-lg"
            style={{
              backgroundColor: "var(--sf-surface-card)",
              border: "1px solid var(--sf-border-default)",
            }}
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                Threshold Reference
              </span>
            </div>
            <div className="px-4 pb-4">
              {/* Deduplicate by gas type, keep the first occurrence */}
              {(() => {
                const seen = new Set<string>();
                const unique = data.sensors.filter((s) => {
                  if (seen.has(s.gasType)) return false;
                  seen.add(s.gasType);
                  return true;
                });
                return (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {unique.map((s) => (
                      <div
                        key={s.gasType}
                        className="flex items-center justify-between text-[10px]"
                      >
                        <span
                          className="font-medium"
                          style={{ color: "var(--sf-text-primary)" }}
                        >
                          {s.gasType}
                        </span>
                        <span style={{ color: "var(--sf-text-muted)" }}>
                          {s.lowAlarm} / {s.highAlarm} {s.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
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
                style={{ color: "var(--sf-gas-danger)" }}
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
                aria-label="Gas detection alarms"
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
