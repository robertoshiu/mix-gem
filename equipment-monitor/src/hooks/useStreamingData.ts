"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePageVisibility } from "./usePageVisibility";
import {
  type TrendDataPoint,
  type SpecLimits,
  type TimeRange,
  getTimeRangeMs,
  generateMockData,
  lttbDownsample,
} from "@/lib/chart-types";

interface UseStreamingDataOptions {
  /** Specification limits for data generation */
  spec: SpecLimits;
  /** Update interval in milliseconds (default: 5000) */
  updateInterval?: number;
  /** Maximum points to display (for performance) */
  maxDisplayPoints?: number;
  /** Current time range selection */
  timeRange?: TimeRange;
  /** Whether to respect prefers-reduced-motion */
  respectReducedMotion?: boolean;
  /** Start time for data filtering */
  startTime?: Date;
}

interface UseStreamingDataReturn {
  /** Current data points */
  data: TrendDataPoint[];
  /** Whether streaming is currently paused */
  isPaused: boolean;
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean;
  /** Manually pause streaming */
  pause: () => void;
  /** Resume streaming */
  resume: () => void;
  /** Toggle pause state */
  togglePause: () => void;
  /** Refresh data manually */
  refresh: () => void;
  /** Current value (latest data point) */
  currentValue: number | null;
}

/**
 * Hook for managing streaming time-series data
 * 
 * Features:
 * - Auto-pauses when tab is not visible (Page Visibility API)
 * - Respects prefers-reduced-motion media query
 * - LTTB downsampling for performance
 * - Generates mock data for demo purposes
 */
export function useStreamingData(
  options: UseStreamingDataOptions
): UseStreamingDataReturn {
  const {
    spec,
    updateInterval = 5000,
    maxDisplayPoints = 200,
    timeRange = "1H",
    respectReducedMotion = true,
    startTime,
  } = options;

  const [data, setData] = useState<TrendDataPoint[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isVisible = usePageVisibility();
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    if (!respectReducedMotion) return;
    
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [respectReducedMotion]);

  // Generate initial data
  const generateInitialData = useCallback(() => {
    const timeRangeMs = getTimeRangeMs(timeRange);
    const pointCount = Math.floor(timeRangeMs / updateInterval);
    const initialData = generateMockData(pointCount, spec);
    
    // Downsample if needed
    if (initialData.length > maxDisplayPoints) {
      return lttbDownsample(initialData, maxDisplayPoints);
    }
    
    return initialData;
  }, [spec, timeRange, updateInterval, maxDisplayPoints]);

  // Initialize data on mount and when time range changes
  useEffect(() => {
    setData(generateInitialData());
  }, [generateInitialData]);

  const addDataPoint = useCallback(() => {
    setData((prevData) => {
      if (prevData.length === 0) return prevData;
      
      const lastPoint = prevData[prevData.length - 1];
      const range = spec.usl - spec.lsl;
      const center = (spec.usl + spec.lsl) / 2;
      
      // Random walk with mean reversion
      const noise = (Math.random() - 0.5) * range * 0.1;
      const meanReversion = (center - lastPoint.value) * 0.05;
      let newValue = lastPoint.value + noise + meanReversion;
      
      // Clamp to reasonable range
      newValue = Math.max(
        spec.lsl - range * 0.2,
        Math.min(spec.usl + range * 0.2, newValue)
      );
      
      const newPoint: TrendDataPoint = {
        timestamp: Date.now(),
        value: parseFloat(newValue.toFixed(2)),
      };
      
      // Remove oldest point and add new one
      const timeRangeMs = getTimeRangeMs(timeRange);
      const cutoffTime = Date.now() - timeRangeMs;
      
      const filteredData = prevData.filter((p) => p.timestamp > cutoffTime);
      const updatedData = [...filteredData, newPoint];
      
      // Use LTTB downsampling for historical data retention
      // If data grows beyond maxDisplayPoints * 2, downsample it to maxDisplayPoints
      if (updatedData.length > maxDisplayPoints * 2) {
        return lttbDownsample(updatedData, maxDisplayPoints);
      }
      
      return updatedData;
    });
  }, [spec, timeRange, maxDisplayPoints]);

  // Streaming interval
  useEffect(() => {
    // Don't stream if paused, not visible, or reduced motion preferred
    const shouldStream = !isPaused && isVisible && !prefersReducedMotion;
    
    if (shouldStream) {
      intervalRef.current = setInterval(addDataPoint, updateInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isVisible, prefersReducedMotion, updateInterval, addDataPoint]);

  // Control functions
  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);
  const togglePause = useCallback(() => setIsPaused((p) => !p), []);
  const refresh = useCallback(() => {
    setData(generateInitialData());
  }, [generateInitialData]);

  // Current value
  const currentValue = data.length > 0 ? data[data.length - 1].value : null;

  // Filter data by time range if provided
  const filteredData = useMemo(() => {
    if (!startTime) return data;
    return data.filter((point) => point.timestamp >= startTime.getTime());
  }, [data, startTime]);

  return {
    data: filteredData,
    isPaused: isPaused || !isVisible || prefersReducedMotion,
    prefersReducedMotion,
    pause,
    resume,
    togglePause,
    refresh,
    currentValue,
  };
}
