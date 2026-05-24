// ---------------------------------------------------------------------------
// Dashboard Facility Engine — Tests
// ---------------------------------------------------------------------------
import {
  mulberry32,
  hashSeed,
  generateMetricValue,
  formatMetricValue,
  generateSubsystemSnapshot,
  generateEvents,
} from '../dashboard-facility-engine';
import { SUBSYSTEM_IDS, SUBSYSTEM_DEFS } from '../dashboard-facility-types';
import type { SubsystemId } from '../dashboard-facility-types';

describe('mulberry32', () => {
  it('produces deterministic output for same seed', () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('produces values in [0, 1)', () => {
    const rng = mulberry32(99999);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = mulberry32(111);
    const rng2 = mulberry32(222);
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });
});

describe('hashSeed', () => {
  it('same tick and id produce same seed', () => {
    expect(hashSeed(42, 'ems')).toBe(hashSeed(42, 'ems'));
    expect(hashSeed(100, 'power')).toBe(hashSeed(100, 'power'));
  });

  it('different tick or id produce different seeds', () => {
    expect(hashSeed(1, 'ems')).not.toBe(hashSeed(2, 'ems'));
    expect(hashSeed(1, 'ems')).not.toBe(hashSeed(1, 'bas'));
    expect(hashSeed(10, 'gas')).not.toBe(hashSeed(10, 'fire'));
  });
});

describe('generateMetricValue', () => {
  it('produces value near baseline (within 1.5x amplitude)', () => {
    const def = SUBSYSTEM_DEFS.ems.metrics[0]; // temp: baseline 22, amplitude 1.2
    for (let tick = 0; tick < 180; tick++) {
      const val = generateMetricValue(tick, def, 0);
      expect(val).toBeGreaterThanOrEqual(def.baseline - 1.5 * def.amplitude);
      expect(val).toBeLessThanOrEqual(def.baseline + 1.5 * def.amplitude);
    }
  });

  it('is deterministic for same tick', () => {
    const def = SUBSYSTEM_DEFS.bas.metrics[2]; // AHU Fan
    for (let tick = 0; tick < 50; tick++) {
      const v1 = generateMetricValue(tick, def, 2);
      const v2 = generateMetricValue(tick, def, 2);
      expect(v1).toBe(v2);
    }
  });

  it('varies across 180 ticks (>100 unique values)', () => {
    // Use particles metric (baseline 800, amplitude 600, precision 0) — wide range
    const def = SUBSYSTEM_DEFS.ems.metrics[2]; // particles
    const values = new Set<number>();
    for (let tick = 0; tick < 180; tick++) {
      values.add(generateMetricValue(tick, def, 2));
    }
    expect(values.size).toBeGreaterThan(100);
  });
});

describe('generateSubsystemSnapshot', () => {
  it('produces valid snapshot for each subsystem (4 metrics, valid status)', () => {
    for (const id of SUBSYSTEM_IDS) {
      const snap = generateSubsystemSnapshot(50, id);
      expect(snap.id).toBe(id);
      expect(snap.metrics).toHaveLength(4);
      for (const m of snap.metrics) {
        expect(m).toHaveProperty('key');
        expect(m).toHaveProperty('value');
        expect(m).toHaveProperty('status');
        expect(['normal', 'warning', 'critical']).toContain(m.status);
      }
      expect(['normal', 'warning', 'critical']).toContain(snap.status);
    }
  });

  it('is deterministic', () => {
    for (const id of SUBSYSTEM_IDS) {
      const s1 = generateSubsystemSnapshot(77, id);
      const s2 = generateSubsystemSnapshot(77, id);
      expect(s1).toEqual(s2);
    }
  });
});

describe('generateEvents', () => {
  it('produces 0-3 events per tick', () => {
    for (let tick = 0; tick < 180; tick++) {
      const events = generateEvents(tick);
      expect(events.length).toBeGreaterThanOrEqual(0);
      expect(events.length).toBeLessThanOrEqual(3);
    }
  });

  it('all events have required fields (tick, timestamp, subsystem, severity, message)', () => {
    for (let tick = 0; tick < 180; tick++) {
      const events = generateEvents(tick);
      for (const ev of events) {
        expect(ev).toHaveProperty('id');
        expect(ev).toHaveProperty('tick', tick);
        expect(ev).toHaveProperty('timestamp');
        expect(ev).toHaveProperty('subsystem');
        expect(ev).toHaveProperty('severity');
        expect(ev).toHaveProperty('message');
        expect(SUBSYSTEM_IDS).toContain(ev.subsystem);
        expect(['info', 'warning', 'critical']).toContain(ev.severity);
        expect(typeof ev.message).toBe('string');
        expect(ev.message.length).toBeGreaterThan(0);
      }
    }
  });

  it('produces ~80-140 events over 180 ticks (allowing some tolerance)', () => {
    let total = 0;
    for (let tick = 0; tick < 180; tick++) {
      total += generateEvents(tick).length;
    }
    expect(total).toBeGreaterThanOrEqual(80);
    expect(total).toBeLessThanOrEqual(140);
  });

  it('all 5 subsystems are represented', () => {
    const seen = new Set<SubsystemId>();
    for (let tick = 0; tick < 180; tick++) {
      for (const ev of generateEvents(tick)) {
        seen.add(ev.subsystem);
      }
    }
    for (const id of SUBSYSTEM_IDS) {
      expect(seen.has(id)).toBe(true);
    }
  });

  it('is deterministic — same tick produces same events', () => {
    for (let tick = 0; tick < 180; tick++) {
      const e1 = generateEvents(tick);
      const e2 = generateEvents(tick);
      expect(e1).toEqual(e2);
    }
  });

  it('no duplicate messages within a 10-tick window', () => {
    const windowSize = 10;
    for (let start = 0; start <= 170; start++) {
      const messages: string[] = [];
      for (let t = start; t < start + windowSize; t++) {
        for (const ev of generateEvents(t)) {
          messages.push(ev.message);
        }
      }
      const unique = new Set(messages);
      expect(unique.size).toBe(messages.length);
    }
  });
});

describe('formatMetricValue', () => {
  it('respects precision', () => {
    expect(formatMetricValue(22.153, 1)).toBe('22.2');
    expect(formatMetricValue(0.9634, 3)).toBe('0.963');
    expect(formatMetricValue(1200.7, 0)).toBe('1201');
  });
});
