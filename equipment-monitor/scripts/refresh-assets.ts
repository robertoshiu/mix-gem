#!/usr/bin/env tsx
/**
 * Main asset pipeline orchestrator.
 * Reads assets.manifest.yaml, fetches from multiple sources,
 * optimizes GLBs, and generates license credits.
 *
 * Usage: npx tsx scripts/refresh-assets.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { polyhaven, sketchfab, grabcad, meshy, tripo, readyplayerme } from './fetchers/index.js';
import { optimizeGlb, formatBytes } from './optimize.js';
import { validateLicenses, generateCredits } from './credits.js';
import type { AssetSpec, Fetcher, FetchResult } from './fetchers/types.js';

// Registry of all fetchers
const FETCHERS: Record<string, Fetcher> = {
  polyhaven,
  sketchfab,
  grabcad,
  meshy,
  tripo,
  readyplayerme,
};

interface Manifest {
  settings: {
    output_root: string;
    max_file_size_mb: number;
    texture_max_resolution: number;
    draco_compression: boolean;
    ktx2_compression: boolean;
    license_whitelist: string[];
    fail_on_missing_license: boolean;
  };
  assets: AssetSpec[];
}

async function main(): Promise<void> {
  const rootDir = process.cwd();

  // Load manifest
  const manifestPath = path.join(rootDir, 'assets.manifest.yaml');
  if (!fs.existsSync(manifestPath)) {
    console.error('[pipeline] assets.manifest.yaml not found in cwd');
    process.exit(1);
  }

  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = parseYaml(manifestContent) as Manifest;

  console.log(`\n[pipeline] Loaded manifest: ${manifest.assets.length} assets\n`);

  // Check available fetchers
  const available: string[] = [];
  const unavailable: string[] = [];
  for (const [name, fetcher] of Object.entries(FETCHERS)) {
    if (fetcher.isAvailable()) {
      available.push(name);
    } else {
      unavailable.push(name);
    }
  }
  console.log(`[pipeline] Available sources: ${available.join(', ')}`);
  if (unavailable.length > 0) {
    console.warn(`[pipeline] Unavailable (missing API keys): ${unavailable.join(', ')}\n`);
  }

  // Process each asset
  const results = new Map<string, FetchResult>();
  const failures: Array<{ id: string; error: string }> = [];

  for (const asset of manifest.assets) {
    console.log(`\n--- ${asset.id} (${asset.category}) ---`);

    try {
      const result = await fetchAsset(asset);
      results.set(asset.id, result);

      // Optimize GLBs (skip HDRIs and non-glb files)
      if (asset.target_path.endsWith('.glb')) {
        console.log(`  [optimize] Processing ${asset.target_path}...`);
        try {
          const optResult = optimizeGlb(asset.target_path);
          console.log(`  [optimize] ${formatBytes(optResult.inputSize)} → ${formatBytes(optResult.outputSize)} (${optResult.savings} saved)`);

          // Check file size limit
          const maxBytes = manifest.settings.max_file_size_mb * 1024 * 1024;
          if (optResult.outputSize > maxBytes) {
            console.warn(`  [optimize] WARNING: ${asset.id} is ${formatBytes(optResult.outputSize)} (exceeds ${manifest.settings.max_file_size_mb} MB limit)`);
          }
        } catch (optErr) {
          console.warn(`  [optimize] Skipped (gltf-transform unavailable): ${(optErr as Error).message}`);
        }
      }
    } catch (err) {
      const errMsg = (err as Error).message;
      console.error(`  FAILED: ${errMsg}`);
      failures.push({ id: asset.id, error: errMsg });
    }
  }

  // Summary
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`[pipeline] Results: ${results.size} succeeded, ${failures.length} failed`);

  if (failures.length > 0) {
    console.log('\nFailed assets:');
    for (const f of failures) {
      console.log(`  - ${f.id}: ${f.error}`);
    }
  }

  // License validation (only on successful results)
  if (results.size > 0) {
    if (manifest.settings.fail_on_missing_license) {
      validateLicenses(results);
    }

    // Generate credits
    generateCredits(results, rootDir);
  }

  // Exit with error if any mandatory assets failed
  if (failures.length > 0) {
    console.error(`\n[pipeline] ${failures.length} asset(s) failed. Check logs above.`);
    process.exit(1);
  }

  console.log('\n[pipeline] All assets refreshed successfully!');
}

async function fetchAsset(asset: AssetSpec): Promise<FetchResult> {
  // Single source
  if (asset.source && !asset.source_priority) {
    const fetcher = FETCHERS[asset.source];
    if (!fetcher) {
      throw new Error(`Unknown source: ${asset.source}`);
    }
    if (!fetcher.isAvailable()) {
      throw new Error(`Source "${asset.source}" unavailable (missing API key) — skipping ${asset.id}`);
    }
    return fetcher.fetch(asset);
  }

  // Priority list — try in order, stop on first success
  if (asset.source_priority) {
    const errors: string[] = [];

    for (const entry of asset.source_priority) {
      const fetcher = FETCHERS[entry.source];
      if (!fetcher) {
        errors.push(`Unknown source: ${entry.source}`);
        continue;
      }
      if (!fetcher.isAvailable()) {
        errors.push(`${entry.source}: unavailable (missing API key)`);
        continue;
      }

      try {
        // Merge source entry config into asset spec for the fetcher
        const mergedSpec: AssetSpec = { ...asset, ...entry };
        return await fetcher.fetch(mergedSpec, entry);
      } catch (err) {
        errors.push(`${entry.source}: ${(err as Error).message}`);
        console.log(`  [${entry.source}] Failed, trying next source...`);
      }
    }

    throw new Error(`All sources exhausted for ${asset.id}:\n    ${errors.join('\n    ')}`);
  }

  throw new Error(`Asset ${asset.id} has no source or source_priority defined`);
}

main().catch((err) => {
  console.error('[pipeline] Unhandled error:', err);
  process.exit(1);
});
