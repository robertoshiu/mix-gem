// ---------------------------------------------------------------------------
// Shared deterministic PRNG + hashing utilities
// ---------------------------------------------------------------------------
// Consolidated from per-module copies so numeric output stays byte-identical
// across the dashboard facility engine, the SECS/GEM sim engine, and the
// analytics engines. Do NOT alter these algorithms — they are relied upon for
// deterministic, reproducible data generation and are covered by tests.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// PRNG — Mulberry32
// ---------------------------------------------------------------------------

/**
 * Mulberry32 PRNG. Returns a function that produces deterministic floats
 * in [0, 1) for a given seed.
 */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Hash — FNV-1a
// ---------------------------------------------------------------------------

/**
 * FNV-1a hash combining tick number and string id into a 32-bit seed.
 */
export function hashSeed(tick: number, id: string): number {
  let hash = 0x811c9dc5;
  // Mix in tick bytes (4 bytes, little-endian)
  for (let i = 0; i < 4; i++) {
    hash ^= (tick >> (i * 8)) & 0xff;
    hash = Math.imul(hash, 0x01000193);
  }
  // Mix in id string
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // unsigned 32-bit
}
