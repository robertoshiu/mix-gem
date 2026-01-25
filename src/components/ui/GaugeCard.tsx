"use client";

import { useMemo } from "react";
import {
  cn,
  type EquipmentStatus,
  getStatusColorClass,
  getStatusBgClass,
  formatValue,
} from "@/lib/utils";

export interface GaugeCardProps {
  /** Parameter name (e.g., "Focus Offset") */
  label: string;
  /** Current value */
  value: number;
  /** Unit of measurement (e.g., "nm", "°C") */
  unit: string;
  /** Specification string (e.g., "±10", "<5", ">2") */
  spec: string;
  /** Current status - determines color and animations */
  status: EquipmentStatus;
  /** Optional decimal places for value display */
  decimals?: number;
  /** Optional className for the card */
  className?: string;
}

/**
 * GaugeCard - Semi-circular gauge display for equipment parameters
 * 
 * Features:
 * - SVG semi-circular gauge with smooth animations
 * - Status-aware coloring (normal/warning/alarm/idle/offline)
 * - Spec limit visualization
 * - Alarm pulse animation
 * - Accessible with proper ARIA labels
 */
export function GaugeCard({
  label,
  value,
  unit,
  spec,
  status,
  decimals = 1,
  className,
}: GaugeCardProps) {
  // Calculate gauge percentage based on spec limits
  const { percentage, isSymmetric, limit } = useMemo(() => {
    const isSymmetric = spec.startsWith("±");
    const isLessThan = spec.startsWith("<");
    const limit = parseFloat(spec.replace(/[±<>]/g, ""));
    
    if (isNaN(limit) || limit === 0) {
      return { percentage: 50, isSymmetric: false, limit: 100 };
    }
    
    let pct: number;
    if (isSymmetric) {
      // For ±10: map -10 to 0%, 0 to 50%, +10 to 100%
      pct = ((value + limit) / (2 * limit)) * 100;
    } else if (isLessThan) {
      // For <5: map 0 to 0%, 5 to 100%
      pct = (value / limit) * 100;
    } else {
      // For >X: inverse mapping
      pct = (1 - value / (limit * 2)) * 100;
    }
    
    return {
      percentage: Math.max(0, Math.min(100, pct)),
      isSymmetric,
      limit,
    };
  }, [value, spec]);

  // SVG gauge dimensions
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  
  // Calculate the stroke offset for the filled portion
  const strokeOffset = circumference * (1 - percentage / 100);
  
  // Center coordinates
  const cx = size / 2;
  const cy = size / 2;

  // Get status-specific colors
  const statusColor = getStatusColorClass(status);
  const statusBg = getStatusBgClass(status);
  
  // Determine if pulsing animation should be active
  const shouldPulse = status === "alarm";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-4 rounded-lg",
        "bg-slate-900 border border-slate-700",
        "transition-all duration-200",
        statusBg,
        shouldPulse && "animate-pulse-slow",
        className
      )}
      role="meter"
      aria-label={`${label}: ${formatValue(value, decimals)} ${unit}`}
      aria-valuenow={value}
      aria-valuetext={`${formatValue(value, decimals)} ${unit}, Status: ${status}`}
    >
      {/* Label */}
      <span className="text-sm font-medium text-slate-300 mb-2">
        {label}
      </span>

      {/* Gauge SVG */}
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg
          width={size}
          height={size / 2 + strokeWidth}
          viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
          className="overflow-visible"
        >
          {/* Background arc (track) */}
          <path
            d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-slate-700"
          />
          
          {/* Warning zone markers (80% of spec on each side for symmetric) */}
          {isSymmetric && (
            <>
              {/* Left warning zone */}
              <path
                d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${cx - radius * 0.6} ${cy - radius * 0.8}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="text-amber-500/20"
              />
              {/* Right warning zone */}
              <path
                d={`M ${cx + radius * 0.6} ${cy - radius * 0.8} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="text-amber-500/20"
              />
            </>
          )}
          
          {/* Filled arc (current value) */}
          <path
            d={`M ${strokeWidth / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className={cn(statusColor, "transition-all duration-500 ease-out")}
            style={{
              filter: shouldPulse ? "drop-shadow(0 0 6px currentColor)" : undefined,
            }}
          />
          
          {/* Center indicator dot */}
          <circle
            cx={cx}
            cy={cy}
            r={4}
            fill="currentColor"
            className={statusColor}
          />
        </svg>

        {/* Value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={cn(
            "font-mono text-2xl font-medium tabular-nums",
            statusColor
          )}>
            {formatValue(value, decimals)}
          </span>
          <span className="text-xs text-slate-400 mt-0.5">
            {unit}
          </span>
        </div>
      </div>

      {/* Spec display */}
      <div className="mt-2 text-xs text-slate-500">
        Spec: {spec}
      </div>
      
      {/* Status indicator dot */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span
          className={cn(
            "w-3 h-3 rounded-full",
            status === "normal" && "bg-emerald-500",
            status === "warning" && "bg-amber-500",
            status === "alarm" && "bg-red-500",
            status === "idle" && "bg-blue-400",
            status === "offline" && "bg-slate-500",
            shouldPulse && "animate-pulse"
          )}
          style={{
            boxShadow: shouldPulse ? "0 0 8px currentColor" : undefined,
          }}
        />
      </div>
    </div>
  );
}
