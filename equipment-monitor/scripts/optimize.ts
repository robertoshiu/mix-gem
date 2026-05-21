/**
 * GLB optimization pipeline using @gltf-transform/cli operations.
 * Steps: dedup → prune → resize textures → KTX2 (UASTC) → Draco compression
 * Target: each model under 5 MB
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const GLTF_TRANSFORM_BIN = path.resolve('node_modules/.bin/gltf-transform');
const MAX_TEXTURE_SIZE = 2048;

interface OptimizeResult {
  inputSize: number;
  outputSize: number;
  savings: string;
}

export function optimizeGlb(inputPath: string, outputPath?: string): OptimizeResult {
  const finalOutput = outputPath || inputPath;
  const inputSize = fs.statSync(inputPath).size;

  // Work in a temp chain
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, '.glb');
  const tmp1 = path.join(dir, `${base}.tmp1.glb`);
  const tmp2 = path.join(dir, `${base}.tmp2.glb`);
  const tmp3 = path.join(dir, `${base}.tmp3.glb`);
  const tmp4 = path.join(dir, `${base}.tmp4.glb`);

  const cleanup = () => {
    for (const f of [tmp1, tmp2, tmp3, tmp4]) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  };

  try {
    // Step 1: Dedup — remove duplicate accessors and textures
    run(GLTF_TRANSFORM_BIN, ['dedup', inputPath, tmp1]);

    // Step 2: Prune — remove unused nodes, materials, textures
    run(GLTF_TRANSFORM_BIN, ['prune', tmp1, tmp2]);

    // Step 3: Resize — cap texture resolution
    run(GLTF_TRANSFORM_BIN, ['resize', tmp2, tmp3, '--width', String(MAX_TEXTURE_SIZE), '--height', String(MAX_TEXTURE_SIZE)]);

    // Step 4: KTX2 texture compression (UASTC for quality)
    try {
      run(GLTF_TRANSFORM_BIN, ['uastc', tmp3, tmp4]);
    } catch (e) {
      // KTX2 may fail if no textures — continue without
      console.warn(`  [optimize] KTX2 skipped (no textures or tool unavailable): ${(e as Error).message}`);
      fs.copyFileSync(tmp3, tmp4);
    }

    // Step 5: Draco geometry compression
    run(GLTF_TRANSFORM_BIN, ['draco', tmp4, finalOutput]);

    const outputSize = fs.statSync(finalOutput).size;
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

    return { inputSize, outputSize, savings: `${savings}%` };
  } finally {
    cleanup();
  }
}

function run(cmd: string, args: string[]): void {
  try {
    execFileSync(cmd, args, {
      stdio: 'pipe',
      timeout: 120_000,
    });
  } catch (e) {
    const err = e as { stderr?: Buffer; message: string };
    const stderr = err.stderr?.toString() || err.message;
    throw new Error(`gltf-transform failed: ${args[0]} — ${stderr.slice(0, 200)}`);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
