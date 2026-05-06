"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Flame,
  Shield,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FireAlarmSubsystemData,
  Detector,
  SuppressionSystem,
  EvacuationZone,
  AlarmEntry,
} from "@/lib/war-room-types";
import { generateFireAlarmSubsystemData } from "@/lib/war-room-mock-data";
import { useDialogFocusTrap } from "@/hooks/use-dialog-focus-trap";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FireAlarmPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFRESH_INTERVAL_MS = 3000;
const MAX_ALARMS = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type EmergencyLevel = "normal" | "alert" | "evacuate";

function getEmergencyLevel(data: FireAlarmSubsystemData): EmergencyLevel {
  const hasCritical = data.alarms.some((a) => a.severity === "critical");
  const hasAlarmDetector = data.detectors.some((d) => d.status === "alarm");
  if (hasCritical || hasAlarmDetector) return "evacuate";
  if (data.alarms.some((a) => a.severity === "warning")) return "alert";
  return "normal";
}

function emergencyColor(level: EmergencyLevel): string {
  switch (level) {
    case "normal":
      return "var(--sf-status-green)";
    case "alert":
      return "var(--sf-status-amber)";
    case "evacuate":
      return "var(--sf-status-red)";
  }
}

function emergencyBg(level: EmergencyLevel): string {
  switch (level) {
    case "normal":
      return "rgba(16,185,129,0.12)";
    case "alert":
      return "rgba(245,158,11,0.12)";
    case "evacuate":
      return "rgba(239,68,68,0.15)";
  }
}

function emergencyLabel(level: EmergencyLevel): string {
  switch (level) {
    case "normal":
      return "NORMAL";
    case "alert":
      return "ALERT";
    case "evacuate":
      return "EVACUATE";
  }
}

function detectorStatusColor(status: Detector["status"]): string {
  switch (status) {
    case "normal":
      return "var(--sf-status-green)";
    case "alarm":
      return "var(--sf-status-red)";
    case "fault":
      return "var(--sf-status-amber)";
  }
}

function detectorTypeLabel(type: Detector["type"]): string {
  switch (type) {
    case "smoke":
      return "Smoke";
    case "heat":
      return "Heat";
    case "flame":
      return "Flame";
    case "manual":
      return "Manual";
  }
}

function suppressionStatusColor(status: SuppressionSystem["status"]): string {
  switch (status) {
    case "armed":
      return "var(--sf-status-green)";
    case "discharged":
      return "var(--sf-status-red)";
    case "fault":
      return "var(--sf-status-amber)";
  }
}

function suppressionStatusLabel(status: SuppressionSystem["status"]): string {
  switch (status) {
    case "armed":
      return "Armed";
    case "discharged":
      return "Discharged";
    case "fault":
      return "Fault";
  }
}

function suppressionTypeLabel(type: SuppressionSystem["type"]): string {
  switch (type) {
    case "sprinkler":
      return "Sprinkler";
    case "gas":
      return "Gas";
  }
}

function zoneStatusColor(status: EvacuationZone["status"]): string {
  switch (status) {
    case "normal":
      return "var(--sf-status-green)";
    case "evacuated":
      return "var(--sf-status-red)";
    case "partial":
      return "var(--sf-status-amber)";
  }
}

function zoneStatusLabel(status: EvacuationZone["status"]): string {
  switch (status) {
    case "normal":
      return "Clear";
    case "evacuated":
      return "Evacuated";
    case "partial":
      return "Partial";
  }
}

// Count detectors by status
function countByStatus(
  detectors: Detector[],
  status: Detector["status"]
): number {
  return detectors.filter((d) => d.status === status).length;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FireAlarmPanel({
  isOpen,
  onClose,
}: FireAlarmPanelProps) {
  const [data, setData] = useState<FireAlarmSubsystemData>(() =>
    generateFireAlarmSubsystemData()
  );

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(panelRef, isOpen, onClose);

  // Refresh on interval
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => {
      setData(generateFireAlarmSubsystemData());
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

  const emergency = getEmergencyLevel(data);
  const isEvacuate = emergency === "evacuate";
  const visibleAlarms = data.alarms.slice(0, MAX_ALARMS);

  // Detector status summary counts
  const alarmCount = countByStatus(data.detectors, "alarm");
  const faultCount = countByStatus(data.detectors, "fault");

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
        aria-label="Fire Alarm Panel"
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
            <Flame size={20} style={{ color: "var(--sf-fire-primary)" }} />
            <span
              className="text-base font-semibold"
              style={{ color: "var(--sf-text-primary)" }}
            >
              Fire Alarm
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                isEvacuate && "animate-pulse"
              )}
              style={{
                backgroundColor: `${emergencyColor(emergency)}20`,
                color: emergencyColor(emergency),
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: emergencyColor(emergency) }}
              />
              {emergencyLabel(emergency)}
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
          {/* ---- Emergency Status Banner ---- */}
          <div
            className={cn(
              "flex items-center justify-between rounded-lg px-4 py-4",
              isEvacuate && "animate-pulse"
            )}
            style={{
              backgroundColor: emergencyBg(emergency),
              border: `2px solid ${emergencyColor(emergency)}`,
            }}
          >
            <div className="flex items-center gap-3">
              {isEvacuate ? (
                <Bell size={22} style={{ color: emergencyColor(emergency) }} />
              ) : emergency === "alert" ? (
                <AlertTriangle
                  size={22}
                  style={{ color: emergencyColor(emergency) }}
                />
              ) : (
                <CheckCircle
                  size={22}
                  style={{ color: emergencyColor(emergency) }}
                />
              )}
              <div>
                <div
                  className="text-base font-bold uppercase tracking-wider"
                  style={{ color: emergencyColor(emergency) }}
                >
                  {emergencyLabel(emergency)}
                </div>
                <div
                  className="text-[10px] mt-0.5"
                  style={{ color: "var(--sf-text-muted)" }}
                >
                  {data.detectors.length} detectors &middot;{" "}
                  {data.suppressionSystems.length} suppression systems
                </div>
              </div>
            </div>
            {(alarmCount > 0 || faultCount > 0) && (
              <div className="flex gap-2 text-[10px] font-semibold">
                {alarmCount > 0 && (
                  <span style={{ color: "var(--sf-status-red)" }}>
                    {alarmCount} alarm{alarmCount > 1 ? "s" : ""}
                  </span>
                )}
                {faultCount > 0 && (
                  <span style={{ color: "var(--sf-status-amber)" }}>
                    {faultCount} fault{faultCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ---- Detector Grid ---- */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Flame size={14} style={{ color: "var(--sf-fire-primary)" }} />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                Detectors
              </span>
            </div>
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: "var(--sf-surface-card)",
                border: "1px solid var(--sf-border-default)",
              }}
            >
              {/* Compact header row */}
              <div
                className="flex items-center px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  color: "var(--sf-text-muted)",
                  borderBottom: "1px solid var(--sf-border-default)",
                }}
              >
                <span className="w-16">Type</span>
                <span className="w-20">Zone</span>
                <span className="flex-1">Status</span>
                <span className="w-16 text-right">Test</span>
              </div>
              <div className="max-h-[180px] overflow-y-auto">
                {data.detectors.map((det) => (
                  <div
                    key={det.id}
                    className="flex items-center px-4 py-1.5 text-xs"
                    style={{
                      borderBottom:
                        "1px solid var(--sf-border-default)",
                      backgroundColor:
                        det.status === "alarm"
                          ? "rgba(239,68,68,0.06)"
                          : det.status === "fault"
                            ? "rgba(245,158,11,0.06)"
                            : undefined,
                    }}
                  >
                    <span
                      className="w-16 font-medium"
                      style={{ color: "var(--sf-text-primary)" }}
                    >
                      {detectorTypeLabel(det.type)}
                    </span>
                    <span
                      className="w-20"
                      style={{ color: "var(--sf-text-secondary)" }}
                    >
                      {det.zone}
                    </span>
                    <div className="flex-1 flex items-center gap-1.5">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: detectorStatusColor(det.status),
                        }}
                      />
                      <span style={{ color: detectorStatusColor(det.status) }}>
                        {det.status === "normal" ? "OK" : det.status.charAt(0).toUpperCase() + det.status.slice(1)}
                      </span>
                    </div>
                    <span
                      className="w-16 text-right text-[9px]"
                      style={{ color: "var(--sf-text-muted)" }}
                    >
                      {det.lastTestDate.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---- Suppression Systems + Evacuation Zones row ---- */}
          <div className="grid grid-cols-2 gap-3">
            {/* Suppression Systems */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield
                  size={14}
                  style={{ color: "var(--sf-fire-primary)" }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--sf-text-secondary)" }}
                >
                  Suppression
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {data.suppressionSystems.map((sys) => (
                  <div
                    key={sys.id}
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      backgroundColor: "var(--sf-surface-card)",
                      border: "1px solid var(--sf-border-default)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--sf-text-primary)" }}
                      >
                        {sys.id.toUpperCase()}
                      </span>
                      <span
                        className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          color: suppressionStatusColor(sys.status),
                          backgroundColor: `${suppressionStatusColor(sys.status)}18`,
                        }}
                      >
                        {suppressionStatusLabel(sys.status)}
                      </span>
                    </div>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--sf-text-muted)" }}
                    >
                      {suppressionTypeLabel(sys.type)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evacuation Zones */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight
                  size={14}
                  style={{ color: "var(--sf-fire-primary)" }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--sf-text-secondary)" }}
                >
                  Evac Zones
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {data.evacuationZones.map ((zone) => (
                  <div
                    key={zone.zone}
                    className="rounded-lg px-3 py-2.5"
                    style={{
                      backgroundColor:
                        zone.status === "evacuated"
                          ? "rgba(239,68,68,0.08)"
                          : "var(--sf-surface-card)",
                      border: "1px solid var(--sf-border-default)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--sf-text-primary)" }}
                      >
                        {zone.zone}
                      </span>
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: zoneStatusColor(zone.status),
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--sf-text-muted)" }}
                      >
                        {zone.occupancy} occupants
                      </span>
                      <span
                        className="text-[9px] uppercase font-semibold"
                        style={{ color: zoneStatusColor(zone.status) }}
                      >
                        {zoneStatusLabel(zone.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---- Alarm Timeline ---- */}
          <div
            className="rounded-lg"
            style={{
              backgroundColor: "var(--sf-surface-card)",
              border: "1px solid var(--sf-border-default)",
            }}
          >
            <div className="flex items-center gap-2 px-4 py-3">
              <Clock size={14} style={{ color: "var(--sf-fire-danger)" }} />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                Alarm Timeline
              </span>
              <span
                className="ml-auto text-[10px]"
                style={{ color: "var(--sf-text-muted)" }}
              >
                {data.alarms.length > MAX_ALARMS
                  ? `Showing ${MAX_ALARMS} of ${data.alarms.length}`
                  : `${data.alarms.length} event${data.alarms.length !== 1 ? "s" : ""}`}
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
                  No events recorded
                </div>
              </div>
            ) : (
              <div
                className="max-h-[220px] overflow-y-auto px-4 pb-4 space-y-2"
                role="list"
                aria-label="Fire alarm timeline"
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
