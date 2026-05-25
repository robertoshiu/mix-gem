// ── PRNG ──────────────────────────────────────────────

/** Mulberry32 — fast 32-bit PRNG from a single integer seed. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick element from array using a PRNG value in [0, 1). */
export function pick<T>(arr: readonly T[], rand: number): T {
  return arr[Math.floor(rand * arr.length)];
}

/** Gaussian approximation via Box-Muller transform. r1, r2 are uniform [0, 1). */
export function gaussian(mean: number, stddev: number, r1: number, r2: number): number {
  const u = r1 < 0.0001 ? 0.0001 : r1;
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r2);
  return mean + stddev * z;
}

// ── Category Selection ────────────────────────────────

export type MessageCategory = 'collection' | 'status' | 'remote' | 'recipe' | 'alarm' | 'heartbeat' | 'terminal';

export const CATEGORY_WEIGHTS: { category: MessageCategory; weight: number }[] = [
  { category: 'collection', weight: 0.35 },
  { category: 'status',     weight: 0.15 },
  { category: 'remote',     weight: 0.12 },
  { category: 'recipe',     weight: 0.10 },
  { category: 'alarm',      weight: 0.10 },
  { category: 'heartbeat',  weight: 0.08 },
  { category: 'terminal',   weight: 0.10 },
];

export function selectCategory(rand: number): MessageCategory {
  let cumulative = 0;
  for (const entry of CATEGORY_WEIGHTS) {
    cumulative += entry.weight;
    if (rand < cumulative) return entry.category;
  }
  return 'collection';
}
