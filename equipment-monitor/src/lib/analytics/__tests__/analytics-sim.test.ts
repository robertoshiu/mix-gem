import {
  ANALYTICS_CYCLE_TICKS,
  ANALYTICS_EVENT_CATEGORIES,
  ANALYTICS_MODULE_IDS,
  generateAnalyticsTick,
  generateAnalyticsEvents,
  generateModuleSnapshots,
  type AnalyticsEventCategory,
} from '../analytics-sim';
import { PROCESS_STEPS, FAB_IDS } from '../constants';

describe('generateAnalyticsTick — determinism', () => {
  it('same tick produces deeply-equal output', () => {
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      expect(generateAnalyticsTick(tick)).toEqual(generateAnalyticsTick(tick));
    }
  });

  it('module snapshots are deterministic per tick', () => {
    for (let tick = 0; tick < 60; tick++) {
      expect(generateModuleSnapshots(tick)).toEqual(generateModuleSnapshots(tick));
    }
  });

  it('events are deterministic per tick', () => {
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      expect(generateAnalyticsEvents(tick)).toEqual(generateAnalyticsEvents(tick));
    }
  });
});

describe('generateAnalyticsTick — seamless 180-tick loop', () => {
  it('tick 180 === tick 0 (wrap)', () => {
    expect(generateAnalyticsTick(ANALYTICS_CYCLE_TICKS)).toEqual(generateAnalyticsTick(0));
  });

  it('every wrapped tick equals its base across multiple cycles', () => {
    for (let base = 0; base < ANALYTICS_CYCLE_TICKS; base++) {
      expect(generateAnalyticsTick(base + ANALYTICS_CYCLE_TICKS)).toEqual(generateAnalyticsTick(base));
      expect(generateAnalyticsTick(base + 2 * ANALYTICS_CYCLE_TICKS)).toEqual(generateAnalyticsTick(base));
    }
  });

  it('reports wrapped tick index in [0,179]', () => {
    for (let tick = 0; tick < 400; tick++) {
      const out = generateAnalyticsTick(tick);
      expect(out.tick).toBe(tick % ANALYTICS_CYCLE_TICKS);
      expect(out.tick).toBeGreaterThanOrEqual(0);
      expect(out.tick).toBeLessThan(ANALYTICS_CYCLE_TICKS);
    }
  });

  it('handles negative ticks by wrapping into range', () => {
    expect(generateAnalyticsTick(-1)).toEqual(generateAnalyticsTick(ANALYTICS_CYCLE_TICKS - 1));
  });
});

describe('generateAnalyticsTick — non-repeating within the window', () => {
  it('VPP cumulative yield has many distinct values over 180 ticks', () => {
    const values = new Set<number>();
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      values.add(generateAnalyticsTick(tick).modules.vpp.cumulativeYield);
    }
    expect(values.size).toBeGreaterThan(150);
  });

  it('APC raw measurement varies across the window', () => {
    const values = new Set<number>();
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      values.add(generateAnalyticsTick(tick).modules.apc.rawMeasurement);
    }
    expect(values.size).toBeGreaterThan(120);
  });
});

describe('generateAnalyticsTick — module snapshot shape', () => {
  it('exposes all six modules', () => {
    const { modules } = generateAnalyticsTick(0);
    for (const id of ANALYTICS_MODULE_IDS) {
      expect(modules).toHaveProperty(id);
    }
  });

  it('yield snapshot has one entry per process step with positive D0', () => {
    const snap = generateAnalyticsTick(33).modules.yield;
    expect(snap.steps).toHaveLength(PROCESS_STEPS.length);
    for (const s of snap.steps) {
      expect(PROCESS_STEPS).toContain(s.stepId);
      expect(s.d0).toBeGreaterThan(0);
    }
    expect(snap.area).toBeGreaterThan(0);
    expect(snap.alpha).toBeGreaterThan(0);
  });

  it('apc snapshot has a valid drift regime and clamped params', () => {
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      const apc = generateAnalyticsTick(tick).modules.apc;
      expect(['none', 'linear', 'sinusoidal', 'step-shift', 'mixed']).toContain(apc.driftType);
      expect(apc.lambda).toBeGreaterThanOrEqual(0.05);
      expect(apc.lambda).toBeLessThanOrEqual(0.6);
      expect(apc.noise).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('reliability availabilities are fractions in [0.85,0.999]', () => {
    const rel = generateAnalyticsTick(72).modules.reliability;
    expect(rel.availabilities).toHaveLength(PROCESS_STEPS.length);
    for (const a of rel.availabilities) {
      expect(a.availability).toBeGreaterThanOrEqual(0.85);
      expect(a.availability).toBeLessThanOrEqual(0.999);
    }
    expect(rel.accelerationFactor).toBeGreaterThan(0);
  });

  it('optimization objectives stay within clamped bounds', () => {
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      const opt = generateAnalyticsTick(tick).modules.optimization;
      expect(opt.objectives.yield).toBeGreaterThanOrEqual(70);
      expect(opt.objectives.yield).toBeLessThanOrEqual(99.5);
      expect(opt.rSquared).toBeGreaterThanOrEqual(0.7);
      expect(opt.rSquared).toBeLessThanOrEqual(0.999);
    }
  });

  it('replication has one entry per fab', () => {
    const repl = generateAnalyticsTick(120).modules.replication;
    expect(repl.fabs).toHaveLength(FAB_IDS.length);
    for (const f of repl.fabs) {
      expect(FAB_IDS).toContain(f.id);
      expect(f.spread).toBeGreaterThan(0);
    }
    expect(repl.transferRSquared).toBeGreaterThanOrEqual(0.65);
  });

  it('vpp cumulative yield is a probability in (0,1]', () => {
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      const vpp = generateAnalyticsTick(tick).modules.vpp;
      expect(vpp.cumulativeYield).toBeGreaterThan(0);
      expect(vpp.cumulativeYield).toBeLessThanOrEqual(1);
    }
  });
});

describe('generateAnalyticsEvents — multi-category coverage', () => {
  it('all event categories appear over a 180-tick window', () => {
    const seen = new Set<AnalyticsEventCategory>();
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      for (const ev of generateAnalyticsEvents(tick)) {
        seen.add(ev.category);
      }
    }
    for (const cat of ANALYTICS_EVENT_CATEGORIES) {
      expect(seen.has(cat)).toBe(true);
    }
  });

  it('every event has required fields and a valid module/severity', () => {
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      for (const ev of generateAnalyticsEvents(tick)) {
        expect(ev).toHaveProperty('id');
        expect(ev).toHaveProperty('tick', tick);
        expect(ev).toHaveProperty('timestamp');
        expect(ANALYTICS_EVENT_CATEGORIES).toContain(ev.category);
        expect(ANALYTICS_MODULE_IDS).toContain(ev.module);
        expect(['info', 'warning', 'critical']).toContain(ev.severity);
        expect(typeof ev.message).toBe('string');
        expect(ev.message.length).toBeGreaterThan(0);
        // Placeholders must all be filled — no leftover {tokens}.
        expect(ev.message).not.toMatch(/\{[a-z0-9]+\}/i);
      }
    }
  });

  it('produces a healthy but bounded event stream over the window', () => {
    let total = 0;
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      const n = generateAnalyticsEvents(tick).length;
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(ANALYTICS_EVENT_CATEGORIES.length);
      total += n;
    }
    // At least one event on average every couple of ticks, but never explosive.
    expect(total).toBeGreaterThanOrEqual(60);
    expect(total).toBeLessThanOrEqual(ANALYTICS_CYCLE_TICKS * ANALYTICS_EVENT_CATEGORIES.length);
  });

  it('event ids are unique within a tick', () => {
    for (let tick = 0; tick < ANALYTICS_CYCLE_TICKS; tick++) {
      const ids = generateAnalyticsEvents(tick).map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
