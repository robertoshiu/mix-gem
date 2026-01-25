import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for conditionally joining and merging Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Equipment status types for the monitoring dashboard
 */
export type EquipmentStatus = "normal" | "warning" | "alarm" | "idle" | "offline";

/**
 * Get status-specific Tailwind color class
 */
export function getStatusColorClass(status: EquipmentStatus): string {
  switch (status) {
    case "normal":
      return "text-emerald-500";
    case "warning":
      return "text-amber-500";
    case "alarm":
      return "text-red-500";
    case "idle":
      return "text-blue-400";
    case "offline":
      return "text-slate-500";
    default:
      return "text-slate-400";
  }
}

/**
 * Get status-specific background tint class (5% opacity for card backgrounds)
 */
export function getStatusBgClass(status: EquipmentStatus): string {
  switch (status) {
    case "normal":
      return "bg-emerald-500/5";
    case "warning":
      return "bg-amber-500/5";
    case "alarm":
      return "bg-red-500/5";
    case "idle":
      return "bg-blue-400/5";
    case "offline":
      return "bg-slate-500/5";
    default:
      return "";
  }
}

/**
 * Get status-specific border accent class
 */
export function getStatusBorderClass(status: EquipmentStatus): string {
  switch (status) {
    case "normal":
      return "border-l-emerald-500";
    case "warning":
      return "border-l-amber-500";
    case "alarm":
      return "border-l-red-500";
    case "idle":
      return "border-l-blue-400";
    case "offline":
      return "border-l-slate-500";
    default:
      return "border-l-slate-700";
  }
}

/**
 * Determine status based on value against spec limits
 * @param value Current value
 * @param spec Specification string (e.g., "±10", "<5", ">2")
 * @param warningThreshold Percentage of spec limit for warning (default 80%)
 */
export function calculateStatus(
  value: number,
  spec: string,
  warningThreshold: number = 0.8
): EquipmentStatus {
  // Parse spec string
  const biDirectional = spec.startsWith("±");
  const lessThan = spec.startsWith("<");
  const greaterThan = spec.startsWith(">");
  
  const limit = parseFloat(spec.replace(/[±<>]/g, ""));
  
  if (isNaN(limit)) return "offline";
  
  if (biDirectional) {
    // ±10 means -10 to +10
    const absValue = Math.abs(value);
    if (absValue > limit) return "alarm";
    if (absValue > limit * warningThreshold) return "warning";
    return "normal";
  }
  
  if (lessThan) {
    // <5 means value should be less than 5
    if (value >= limit) return "alarm";
    if (value >= limit * warningThreshold) return "warning";
    return "normal";
  }
  
  if (greaterThan) {
    // >2 means value should be greater than 2
    if (value <= limit) return "alarm";
    if (value <= limit * (1 + (1 - warningThreshold))) return "warning";
    return "normal";
  }
  
  return "normal";
}

/**
 * Format a number for display with appropriate precision
 */
export function formatValue(value: number, decimals: number = 1): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}`;
}

/**
 * Calculate gauge arc path for SVG
 * @param percentage Value from 0 to 100
 * @param radius Radius of the arc
 * @param strokeWidth Width of the arc stroke
 */
export function calculateGaugeArc(
  percentage: number,
  radius: number,
  strokeWidth: number
): { path: string; circumference: number; offset: number } {
  // Semi-circle: 180 degrees = π radians
  const circumference = Math.PI * radius;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const offset = circumference * (1 - clampedPercentage / 100);
  
  // SVG arc path for semi-circle (bottom half, oriented like a speedometer)
  const centerX = radius + strokeWidth / 2;
  const centerY = radius + strokeWidth / 2;
  
  const startX = centerX - radius;
  const startY = centerY;
  const endX = centerX + radius;
  const endY = centerY;
  
  // Arc: A rx ry x-axis-rotation large-arc-flag sweep-flag x y
  const path = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  
  return { path, circumference, offset };
}
