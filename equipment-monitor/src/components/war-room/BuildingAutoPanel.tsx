"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Building,
  Thermometer,
  Lightbulb,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BuildingAutoSubsystemData,
} from "@/lib/war-room-types";
import { generateBuildingAutoSubsystemData } from "@/lib/war-room-mock-data";
import { useDialogFocusTrap } from "@/hooks/use-dialog-focus-trap";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BuildingAutoPanelProps {
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

type SystemSeverity = "normal" | "warning" | "alarm";

function systemSeverity(data: BuildingAutoSubsystemData): SystemSeverity {
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

function modeLabel(mode: string): string {
  switch (mode) {
    case "heating":
      return "Heating";
    case "cooling":
      return "Cooling";
    case "auto":
      return "Auto";
    default:
      return mode;
  }
}

function modeColor(mode: string): string {
  switch (mode) {
    case "heating":
      return "#ef4444";
    case "cooling":
      return "#3b82f6";
    case "auto":
      return "var(--sf-ba-primary, #14b8a6)";
    default:
      return "var(--sf-text-muted)";
  }
}

function elevatorStatusColor(status: string): string {
  switch (status) {
    case "operational":
      return "var(--sf-status-green)";
    case "maintenance":
      return "var(--sf-status-amber)";
    case "out_of_service":
      return "var(--sf-status-red)";
    default:
      return "var(--sf-text-muted)";
  }
}

function elevatorStatusLabel(status: string): string {
  switch (status) {
    case "operational":
      return "Operational";
    case "maintenance":
      return "Maintenance";
    case "out_of_service":
      return "Out of Service";
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BuildingAutoPanel({
  isOpen,
  onClose,
}: BuildingAutoPanelProps) {
  const [data, setData] = useState<BuildingAutoSubsystemData>(() =>
    generateBuildingAutoSubsystemData()
  );

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(panelRef, isOpen, onClose);

  // Refresh on interval
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => {
      setData(generateBuildingAutoSubsystemData());
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
        aria-label="Building Automation Panel"
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
            <Building size={20} style={{ color: "var(--sf-ba-primary)" }} />
            <span
              className="text-base font-semibold"
              style={{ color: "var(--sf-text-primary)" }}
            >
              Building Automation
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
          {/* ---- HVAC Zones Grid ---- */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Thermometer
                size={14}
                style={{ color: "var(--sf-ba-primary)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                HVAC Zones
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.hvacZones.map((zone) => (
                <div
                  key={zone.id}
                  className="rounded-lg px-3 py-3"
                  style={{
                    backgroundColor: "var(--sf-surface-card)",
                    border: "1px solid var(--sf-border-default)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: "var(--sf-text-primary)" }}
                    >
                      {zone.name}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ml-2"
                      style={{
                        color: modeColor(zone.mode),
                        backgroundColor: `${modeColor(zone.mode)}18`,
                      }}
                    >
                      {modeLabel(zone.mode)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: "var(--sf-text-muted)" }}
                      >
                        Temp
                      </div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "var(--sf-text-primary)" }}
                      >
                        {zone.temperature}°C
                      </div>
                    </div>
                    <div>
                      <div
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: "var(--sf-text-muted)" }}
                      >
                        Humidity
                      </div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "var(--sf-text-primary)" }}
                      >
                        {zone.humidity}%
                      </div>
                    </div>
                    <div>
                      <div
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: "var(--sf-text-muted)" }}
                      >
                        Setpoint
                      </div>
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "var(--sf-ba-primary)" }}
                      >
                        {zone.setpoint}°C
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Lighting Status ---- */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb
                size={14}
                style={{ color: "var(--sf-ba-primary)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                Lighting
              </span>
            </div>
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: "var(--sf-surface-card)",
                border: "1px solid var(--sf-border-default)",
              }}
            >
              {data.lightingGroups.map((lg, idx) => (
                <div
                  key={lg.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderBottom:
                      idx < data.lightingGroups.length - 1
                        ? "1px solid var(--sf-border-default)"
                        : undefined,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-xs font-medium"
                      style={{ color: "var(--sf-text-primary)" }}
                    >
                      {lg.area}
                    </span>
                    <span
                      className="ml-2 text-[10px]"
                      style={{ color: "var(--sf-text-muted)" }}
                    >
                      {lg.schedule}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: 60,
                        backgroundColor: "var(--sf-border-default)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${lg.brightnessPercent}%`,
                          backgroundColor: "var(--sf-ba-primary)",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold w-8 text-right"
                      style={{ color: "var(--sf-text-primary)" }}
                    >
                      {lg.brightnessPercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Elevator Status ---- */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpDown
                size={14}
                style={{ color: "var(--sf-ba-primary)" }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--sf-text-secondary)" }}
              >
                Elevators
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {data.elevators.map((elev) => (
                <div
                  key={elev.id}
                  className="flex flex-col items-center rounded-lg px-3 py-3 text-center"
                  style={{
                    backgroundColor: "var(--sf-surface-card)",
                    border: "1px solid var(--sf-border-default)",
                  }}
                >
                  <span
                    className="text-xs font-semibold mb-1"
                    style={{ color: "var(--sf-text-primary)" }}
                  >
                    {elev.id.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: elevatorStatusColor(elev.status),
                      }}
                    />
                    <span
                      className="text-[10px]"
                      style={{ color: elevatorStatusColor(elev.status) }}
                    >
                      {elevatorStatusLabel(elev.status)}
                    </span>
                  </div>
                  <span
                    className="text-lg font-semibold"
                    style={{ color: "var(--sf-ba-primary)" }}
                  >
                    {elev.currentFloor}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: "var(--sf-text-muted)" }}
                  >
                    Floor
                  </span>
                </div>
              ))}
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
                style={{ color: "var(--sf-ba-danger)" }}
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
                aria-label="Building automation alarms"
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
