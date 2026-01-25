import { type EquipmentStatus } from "./utils";

/**
 * Single data point for time-series trend charts
 */
export interface TrendDataPoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Parameter value */
  value: number;
  /** Optional status at this point */
  status?: EquipmentStatus;
}

/**
 * Specification limits for a parameter
 */
export interface SpecLimits {
  /** Upper Specification Limit */
  usl: number;
  /** Lower Specification Limit */
  lsl: number;
  /** Target value (optional, defaults to midpoint) */
  target?: number;
  /** Warning threshold as percentage of spec (0.8 = 80%) */
  warningThreshold?: number;
}

/**
 * Parse spec string into SpecLimits
 * @param spec Spec string (e.g., "±10", "<5")
 * @returns SpecLimits object
 */
export function parseSpec(spec: string): SpecLimits {
  const isSymmetric = spec.startsWith("±");
  const isLessThan = spec.startsWith("<");
  const limit = parseFloat(spec.replace(/[±<>]/g, ""));
  
  if (isNaN(limit)) {
    return { usl: 100, lsl: 0, target: 50 };
  }
  
  if (isSymmetric) {
    return { usl: limit, lsl: -limit, target: 0 };
  }
  
  if (isLessThan) {
    return { usl: limit, lsl: 0, target: limit / 2 };
  }
  
  // Greater than case
  return { usl: limit * 2, lsl: limit, target: limit * 1.5 };
}

/**
 * Time range options for chart display
 */
export type TimeRange = "1H" | "4H" | "24H";

/**
 * Get milliseconds for time range
 */
export function getTimeRangeMs(range: TimeRange): number {
  switch (range) {
    case "1H":
      return 60 * 60 * 1000;
    case "4H":
      return 4 * 60 * 60 * 1000;
    case "24H":
      return 24 * 60 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
  }
}

/**
 * Format timestamp for chart axis
 */
export function formatTimestamp(timestamp: number, range: TimeRange): string {
  const date = new Date(timestamp);
  
  if (range === "24H") {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  
  return date.toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit",
    second: "2-digit"
  });
}

/**
 * Format timestamp for tooltip (full datetime)
 */
export function formatTooltipTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * LTTB (Largest-Triangle-Three-Buckets) downsampling algorithm
 * Reduces data points while preserving visual characteristics
 * 
 * @param data Original data points
 * @param threshold Target number of points
 * @returns Downsampled data
 */
export function lttbDownsample(
  data: TrendDataPoint[],
  threshold: number
): TrendDataPoint[] {
  if (threshold >= data.length || threshold <= 2) {
    return data;
  }

  const sampled: TrendDataPoint[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);

  // Always keep first point
  sampled.push(data[0]);

  let a = 0; // Previous selected point index

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate bucket range
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1;
    const bucketEnd = Math.min(
      Math.floor((i + 2) * bucketSize) + 1,
      data.length - 1
    );

    // Calculate average of next bucket for comparison
    let avgX = 0;
    let avgY = 0;
    const nextBucketStart = bucketEnd;
    const nextBucketEnd = Math.min(
      Math.floor((i + 3) * bucketSize) + 1,
      data.length
    );
    const nextBucketSize = nextBucketEnd - nextBucketStart;

    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += data[j].timestamp;
      avgY += data[j].value;
    }

    if (nextBucketSize > 0) {
      avgX /= nextBucketSize;
      avgY /= nextBucketSize;
    }

    // Find point with largest triangle area in current bucket
    let maxArea = -1;
    let maxIndex = bucketStart;

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (data[a].timestamp - avgX) * (data[j].value - data[a].value) -
          (data[a].timestamp - data[j].timestamp) * (avgY - data[a].value)
      );

      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    sampled.push(data[maxIndex]);
    a = maxIndex;
  }

  // Always keep last point
  sampled.push(data[data.length - 1]);

  return sampled;
}

/**
 * Generate mock streaming data for demo purposes
 */
export function generateMockData(
  count: number,
  spec: SpecLimits,
  endTime: number = Date.now()
): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const intervalMs = 5000; // 5 seconds between points
  
  const range = spec.usl - spec.lsl;
  const center = (spec.usl + spec.lsl) / 2;
  
  let currentValue = center;
  
  for (let i = 0; i < count; i++) {
    const timestamp = endTime - (count - 1 - i) * intervalMs;
    
    // Random walk with mean reversion
    const noise = (Math.random() - 0.5) * range * 0.1;
    const meanReversion = (center - currentValue) * 0.05;
    currentValue += noise + meanReversion;
    
    // Clamp to reasonable range
    currentValue = Math.max(
      spec.lsl - range * 0.2,
      Math.min(spec.usl + range * 0.2, currentValue)
    );
    
    data.push({
      timestamp,
      value: parseFloat(currentValue.toFixed(2)),
    });
  }
  
  return data;
}

/**
 * Get status color as hex for Recharts
 */
export function getStatusHexColor(status: EquipmentStatus): string {
  switch (status) {
    case "normal":
      return "#10B981"; // emerald-500
    case "warning":
      return "#F59E0B"; // amber-500
    case "alarm":
      return "#EF4444"; // red-500
    case "idle":
      return "#60A5FA"; // blue-400
    case "offline":
      return "#64748B"; // slate-500
    default:
      return "#94A3B8"; // slate-400
  }
}

/**
 * Color constants for charts
 */
export const CHART_COLORS = {
  line: "#3B82F6", // blue-500
  fill: "#3B82F6", // blue-500
  fillOpacity: 0.2,
  grid: "#334155", // slate-700
  axis: "#94A3B8", // slate-400
  specBand: "#334155", // slate-700
  warningBand: "#F59E0B", // amber-500
  warningBandOpacity: 0.1,
  usl: "#EF4444", // red-500
  lsl: "#EF4444", // red-500
  target: "#10B981", // emerald-500
  tooltip: {
    background: "#1E293B", // slate-800
    border: "#334155", // slate-700
    text: "#F8FAFC", // slate-50
  },
} as const;
