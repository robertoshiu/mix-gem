import {
  GAUGE_VIEWBOX,
  GAUGE_ARC,
  GAUGE_TEXT,
  polarToCartesian,
  describeGaugeArc,
  clampPercentage,
  safeRange,
  computeGaugeValueFontSize,
  formatGaugeValue,
  sanitizeSvgId,
} from './gauge-geometry';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('GAUGE_VIEWBOX', () => {
  it('has width 240 and height 160', () => {
    expect(GAUGE_VIEWBOX).toEqual({ width: 240, height: 160 });
  });
});

describe('GAUGE_ARC', () => {
  it('has expected geometry values', () => {
    expect(GAUGE_ARC).toEqual({
      centerX: 120,
      centerY: 130,
      radius: 88,
      startAngle: -180,
      endAngle: 0,
    });
  });
});

describe('GAUGE_TEXT', () => {
  it('has expected text width values', () => {
    expect(GAUGE_TEXT).toEqual({ valueWidth: 160, labelWidth: 72, unitWidth: 100 });
  });
});

// ---------------------------------------------------------------------------
// polarToCartesian
// ---------------------------------------------------------------------------

describe('polarToCartesian', () => {
  it('maps -180° to the leftmost point (centerX - radius, centerY)', () => {
    const pt = polarToCartesian(-180);
    expect(pt.x).toBeCloseTo(GAUGE_ARC.centerX - GAUGE_ARC.radius, 10);
    expect(pt.y).toBeCloseTo(GAUGE_ARC.centerY, 10);
  });

  it('maps -90° to the topmost point (centerX, centerY - radius)', () => {
    const pt = polarToCartesian(-90);
    expect(pt.x).toBeCloseTo(GAUGE_ARC.centerX, 10);
    expect(pt.y).toBeCloseTo(GAUGE_ARC.centerY - GAUGE_ARC.radius, 10);
  });

  it('maps 0° to the rightmost point (centerX + radius, centerY)', () => {
    const pt = polarToCartesian(0);
    expect(pt.x).toBeCloseTo(GAUGE_ARC.centerX + GAUGE_ARC.radius, 10);
    expect(pt.y).toBeCloseTo(GAUGE_ARC.centerY, 10);
  });

  it('accepts a custom radius', () => {
    const customRadius = 50;
    const pt = polarToCartesian(0, customRadius);
    expect(pt.x).toBeCloseTo(GAUGE_ARC.centerX + customRadius, 10);
    expect(pt.y).toBeCloseTo(GAUGE_ARC.centerY, 10);
  });
});

// ---------------------------------------------------------------------------
// describeGaugeArc
// ---------------------------------------------------------------------------

describe('describeGaugeArc', () => {
  it('returns a string starting with M (move-to)', () => {
    const path = describeGaugeArc(-180, 0);
    expect(path.startsWith('M ')).toBe(true);
  });

  it('contains an arc command (A)', () => {
    const path = describeGaugeArc(-180, 0);
    expect(path).toMatch(/A \d+/);
  });

  it('is not empty for a semicircle arc', () => {
    const path = describeGaugeArc(-180, 0);
    expect(path.length).toBeGreaterThan(0);
  });

  it('uses large-arc flag for sweeps > 180°', () => {
    const path = describeGaugeArc(-180, 90);
    // Sweep of 270° should use largeArcFlag = 1
    expect(path).toMatch(/A \d+ \d+ 0 1 1/);
  });

  it('does not use large-arc flag for sweeps ≤ 180°', () => {
    const path = describeGaugeArc(-180, 0);
    // Sweep of 180° should use largeArcFlag = 0
    expect(path).toMatch(/A \d+ \d+ 0 0 1/);
  });
});

// ---------------------------------------------------------------------------
// clampPercentage
// ---------------------------------------------------------------------------

describe('clampPercentage', () => {
  it('returns the value when within [0, 100]', () => {
    expect(clampPercentage(50)).toBe(50);
    expect(clampPercentage(0)).toBe(0);
    expect(clampPercentage(100)).toBe(100);
  });

  it('clamps negative values to 0', () => {
    expect(clampPercentage(-10)).toBe(0);
  });

  it('clamps values above 100 to 100', () => {
    expect(clampPercentage(110)).toBe(100);
  });

  it('maps NaN to 0', () => {
    expect(clampPercentage(NaN)).toBe(0);
  });

  it('maps Infinity to 100', () => {
    expect(clampPercentage(Infinity)).toBe(100);
  });

  it('maps -Infinity to 0', () => {
    expect(clampPercentage(-Infinity)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// safeRange
// ---------------------------------------------------------------------------

describe('safeRange', () => {
  it('returns the absolute difference for normal values', () => {
    expect(safeRange(10, 50)).toBe(40);
    expect(safeRange(50, 10)).toBe(40);
  });

  it('returns EPSILON when min equals max (prevents division by zero)', () => {
    expect(safeRange(0, 0)).toBe(Number.EPSILON);
    expect(safeRange(5, 5)).toBe(Number.EPSILON);
  });

  it('handles negative values correctly', () => {
    expect(safeRange(-10, 10)).toBe(20);
    expect(safeRange(-20, -5)).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// computeGaugeValueFontSize
// ---------------------------------------------------------------------------

describe('computeGaugeValueFontSize', () => {
  it('returns a larger font size for short text', () => {
    const short = computeGaugeValueFontSize('5.1', 80, 8, 40);
    const long = computeGaugeValueFontSize('12345.678', 80, 8, 40);
    expect(short).toBeGreaterThan(long);
  });

  it('returns a smaller font size for long text', () => {
    const fontSize = computeGaugeValueFontSize('12345.678', 80, 8, 40);
    // 9 chars * 0.58 = 5.22; 80 / 5.22 ≈ 15.33 — well below max 40
    expect(fontSize).toBeLessThan(40);
    expect(fontSize).toBeGreaterThan(8);
  });

  it('clamps to minimum font size', () => {
    // Very long text should hit the minimum
    const fontSize = computeGaugeValueFontSize('x'.repeat(100));
    expect(fontSize).toBe(14);
  });

  it('clamps to maximum font size', () => {
    // Very short text should hit the maximum
    const fontSize = computeGaugeValueFontSize('1');
    expect(fontSize).toBe(30);
  });

  it('handles whitespace-only text by clamping to max', () => {
    const fontSize = computeGaugeValueFontSize('   ');
    // 3 spaces * 0.58 = 1.74, availableWidth / 1.74 ≈ 91.95, clamped to max 30
    expect(fontSize).toBe(30);
  });

  it('respects custom available width', () => {
    const narrow = computeGaugeValueFontSize('50.12', 80);
    const wide = computeGaugeValueFontSize('50.12', 200);
    expect(wide).toBeGreaterThan(narrow);
  });
});

// ---------------------------------------------------------------------------
// formatGaugeValue
// ---------------------------------------------------------------------------

describe('formatGaugeValue', () => {
  it('formats values >= 100 with 1 decimal place', () => {
    expect(formatGaugeValue(150.123)).toBe('150.1');
    expect(formatGaugeValue(100)).toBe('100.0');
    expect(formatGaugeValue(-200.456)).toBe('-200.5');
  });

  it('formats values >= 10 with 2 decimal places', () => {
    expect(formatGaugeValue(50.123)).toBe('50.12');
    expect(formatGaugeValue(10)).toBe('10.00');
    expect(formatGaugeValue(-99.9)).toBe('-99.90');
  });

  it('formats values < 10 with 3 decimal places', () => {
    expect(formatGaugeValue(5.123)).toBe('5.123');
    expect(formatGaugeValue(0)).toBe('0.000');
    expect(formatGaugeValue(-0.5)).toBe('-0.500');
  });
});

// ---------------------------------------------------------------------------
// sanitizeSvgId
// ---------------------------------------------------------------------------

describe('sanitizeSvgId', () => {
  it('replaces spaces with hyphens', () => {
    expect(sanitizeSvgId('Power Factor')).toBe('Power-Factor');
  });

  it('strips leading and trailing hyphens', () => {
    expect(sanitizeSvgId('---hello---')).toBe('hello');
  });

  it('replaces special characters with hyphens', () => {
    expect(sanitizeSvgId('temp@home#1')).toBe('temp-home-1');
  });

  it('returns a fallback for empty or all-special input', () => {
    const result = sanitizeSvgId('@@@');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('preserves alphanumeric and underscore characters', () => {
    expect(sanitizeSvgId('my_id-123')).toBe('my_id-123');
  });
});