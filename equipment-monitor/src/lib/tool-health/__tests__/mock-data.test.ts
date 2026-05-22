import { generateToolPerformance, generatePmSchedule } from '../mock-data';

describe('generateToolPerformance', () => {
  test('deterministic — same ID produces same output', () => {
    const a = generateToolPerformance('NXE-3800-01', 95);
    const b = generateToolPerformance('NXE-3800-01', 95);
    expect(a).toEqual(b);
  });

  test('different IDs produce different output', () => {
    const a = generateToolPerformance('NXE-3800-01', 95);
    const b = generateToolPerformance('ETCH-ICP-01', 90);
    expect(a.oee).not.toEqual(b.oee);
  });

  test('OEE, availability, utilization are in 0-100', () => {
    const p = generateToolPerformance('FUR-OX-01', 93);
    expect(p.oee).toBeGreaterThanOrEqual(0);
    expect(p.oee).toBeLessThanOrEqual(100);
    expect(p.availability).toBeGreaterThanOrEqual(0);
    expect(p.availability).toBeLessThanOrEqual(100);
    expect(p.utilization).toBeGreaterThanOrEqual(0);
    expect(p.utilization).toBeLessThanOrEqual(100);
  });

  test('trend24h has 24 points', () => {
    const p = generateToolPerformance('CMP-OX-01', 92);
    expect(p.trend24h).toHaveLength(24);
    for (const t of p.trend24h) {
      expect(t.hour).toBeGreaterThanOrEqual(0);
      expect(t.hour).toBeLessThan(24);
    }
  });

  test('trend has at least one dip event (>5% drop from baseOee)', () => {
    const baseOee = 95;
    const p = generateToolPerformance('NXE-3800-01', baseOee);
    const minOee = Math.min(...p.trend24h.map(t => t.oee));
    expect(minOee).toBeLessThan(baseOee - 5);
  });
});

describe('generatePmSchedule', () => {
  test('returns 6 history events', () => {
    const s = generatePmSchedule('NXE-3800-01');
    expect(s.history).toHaveLength(6);
  });

  test('nextPmDate > lastPmDate', () => {
    const s = generatePmSchedule('FUR-OX-01');
    expect(new Date(s.nextPmDate).getTime()).toBeGreaterThan(new Date(s.lastPmDate).getTime());
  });

  test('interval matches equipment type prefix', () => {
    const s = generatePmSchedule('CMP-OX-01');
    expect(s.pmIntervalDays).toBe(21);
  });

  test('deterministic — same ID produces same output', () => {
    const a = generatePmSchedule('ETCH-ICP-01');
    const b = generatePmSchedule('ETCH-ICP-01');
    expect(a).toEqual(b);
  });
});
