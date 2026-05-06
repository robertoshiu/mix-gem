/**
 * Shared gauge geometry helpers — pure math, no DOM or React dependencies.
 * Consolidates polar/arc math from GaugeCard and KpiGaugeCard into one module.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const GAUGE_VIEWBOX = { width: 240, height: 160 } as const;

export const GAUGE_ARC = {
  centerX: 120,
  centerY: 130,
  radius: 88,
  startAngle: -180,
  endAngle: 0,
} as const;

export const GAUGE_TEXT = {
  valueWidth: 160,
  labelWidth: 72,
  unitWidth: 100,
} as const;

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/**
 * Convert a polar angle (degrees) to a cartesian point relative to
 * (GAUGE_ARC.centerX, GAUGE_ARC.centerY).
 */
export function polarToCartesian(
  angle: number,
  radius: number = GAUGE_ARC.radius,
): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  return {
    x: GAUGE_ARC.centerX + radius * Math.cos(radians),
    y: GAUGE_ARC.centerY + radius * Math.sin(radians),
  };
}

/**
 * Return an SVG path `d` string for a semicircular arc from `startAngle` to
 * `endAngle` (degrees). Uses the large-arc flag when the sweep exceeds 180°.
 */
export function describeGaugeArc(
  startAngle: number,
  endAngle: number,
  radius: number = GAUGE_ARC.radius,
): string {
  const start = polarToCartesian(startAngle, radius);
  const end = polarToCartesian(endAngle, radius);
  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

/**
 * Clamp a numeric value to the [0, 100] range.
 * NaN maps to 0; Infinity maps to 100.
 */
export function clampPercentage(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (!Number.isFinite(value)) return value > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Return a safe non-zero range magnitude, preventing division by zero.
 */
export function safeRange(min: number, max: number): number {
  return Math.max(Math.abs(max - min), Number.EPSILON);
}

/**
 * Compute a font size that fits `text` within `availableWidth` SVG units.
 * Uses a character-width factor of 0.58 and clamps the result to [min, max].
 */
export function computeGaugeValueFontSize(
  text: string,
  availableWidth: number = GAUGE_TEXT.valueWidth,
  min: number = 14,
  max: number = 30,
): number {
  const measured = availableWidth / Math.max(text.length * 0.58, 1);
  return Math.max(min, Math.min(max, measured));
}

/**
 * Format a numeric gauge value for display.
 *   |value| >= 100 → 1 decimal place
 *   |value| >= 10  → 2 decimal places
 *   otherwise      → 3 decimal places
 */
export function formatGaugeValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100) return value.toFixed(1);
  if (abs >= 10) return value.toFixed(2);
  return value.toFixed(3);
}

/**
 * Replace non-word characters with hyphens to produce a safe SVG `id`.
 * Appends a short hash-like suffix for uniqueness when the input is empty or
 * entirely special characters.
 */
export function sanitizeSvgId(input: string): string {
  const sanitized = input.replace(/\W+/g, '-').replace(/^-+|-+$/g, '');
  return sanitized || `id-${input.length}`;
}