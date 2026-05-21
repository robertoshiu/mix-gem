/**
 * Meshy AI fetcher — text-to-3D API at https://api.meshy.ai/v2
 * Requires MESHY_API_KEY env var.
 * Caches results by prompt hash to avoid re-generating identical assets.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { AssetSpec, FetchResult, Fetcher, SourceEntry } from './types.js';

const API_BASE = 'https://api.meshy.ai/v2';
const CACHE_DIR = 'node_modules/.cache/meshy';
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 180; // 15 minutes max per step

function getApiKey(): string {
  const key = process.env.MESHY_API_KEY;
  if (!key) throw new Error('[meshy] MESHY_API_KEY env var not set');
  return key;
}

function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

function getCachePath(prompt: string): string {
  return path.join(CACHE_DIR, `${hashPrompt(prompt)}.glb`);
}

/** Search Meshy community library for free downloadable models matching keywords */
async function searchCommunityLibrary(prompt: string, apiKey: string): Promise<{ url: string; title: string } | null> {
  try {
    // Extract keywords from prompt for search
    const keywords = prompt
      .replace(/[,]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 5)
      .join(' ');

    const searchUrl = `${API_BASE}/community?page_size=10&sort_by=-liked_count&search=${encodeURIComponent(keywords)}`;
    const resp = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!resp.ok) return null;

    const data = await resp.json() as {
      results?: Array<{
        id: string;
        name: string;
        model_urls?: { glb?: string };
        thumbnail_url?: string;
      }>;
    };

    const match = data.results?.find(r => r.model_urls?.glb);
    if (match) {
      console.log(`  [meshy] Community library match: "${match.name}"`);
      return { url: match.model_urls!.glb!, title: match.name };
    }
    return null;
  } catch {
    return null;
  }
}

/** Search user's own Meshy task history for a completed generation matching this prompt */
async function searchExistingTask(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const resp = await fetch(`${API_BASE}/text-to-3d?page_size=50&sort_by=-created_at`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!resp.ok) return null;

    const data = await resp.json() as {
      results: Array<{
        id: string;
        prompt: string;
        status: string;
        model_urls?: { glb?: string };
      }>;
    };

    const match = data.results.find(
      t => t.status === 'SUCCEEDED' && t.prompt === prompt && t.model_urls?.glb
    );

    if (match) {
      console.log(`  [meshy] Reusing own task ${match.id}`);
      return match.model_urls!.glb!;
    }
    return null;
  } catch {
    return null;
  }
}

async function pollJob(taskId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    const resp = await fetch(`${API_BASE}/text-to-3d/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!resp.ok) {
      throw new Error(`[meshy] Poll failed (${resp.status}): ${await resp.text()}`);
    }

    const data = await resp.json() as {
      status: string;
      model_urls?: { glb?: string };
      error?: string;
    };

    if (data.status === 'SUCCEEDED') {
      return data.model_urls?.glb || '';
    }

    if (data.status === 'FAILED') {
      throw new Error(`[meshy] Generation failed: ${data.error || 'unknown error'}`);
    }

    // Still processing — PENDING or IN_PROGRESS
    if (i % 6 === 0) {
      console.log(`  [meshy] Still generating... (${Math.round((i * POLL_INTERVAL_MS) / 1000)}s)`);
    }
  }

  throw new Error(`[meshy] Generation timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
}

export const meshy: Fetcher = {
  name: 'meshy',

  isAvailable(): boolean {
    return !!process.env.MESHY_API_KEY;
  },

  async fetch(spec: AssetSpec, sourceEntry?: SourceEntry): Promise<FetchResult> {
    const apiKey = getApiKey();
    const prompt = sourceEntry?.prompt || spec.prompt;
    if (!prompt) throw new Error(`[meshy] No prompt provided for ${spec.id}`);

    const targetPath = spec.target_path;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Priority 1: Local cache (prompt hash match)
    const cachePath = getCachePath(prompt);
    if (fs.existsSync(cachePath)) {
      console.log(`  [meshy] Cache hit for "${prompt.slice(0, 50)}..."`);
      fs.copyFileSync(cachePath, targetPath);
      return buildResult(targetPath, prompt, 'cache');
    }

    // Priority 2: Search Meshy community library (free models)
    console.log(`  [meshy] Searching community library...`);
    const communityMatch = await searchCommunityLibrary(prompt, apiKey);
    if (communityMatch) {
      console.log(`  [meshy] Downloading community model: "${communityMatch.title}"`);
      await downloadGlb(communityMatch.url, targetPath);
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.copyFileSync(targetPath, cachePath);
      return buildResult(targetPath, communityMatch.title, 'community');
    }

    // Priority 3: Search own task history (already-generated)
    console.log(`  [meshy] Searching task history...`);
    const existingUrl = await searchExistingTask(prompt, apiKey);
    if (existingUrl) {
      console.log(`  [meshy] Found existing generation, downloading`);
      await downloadGlb(existingUrl, targetPath);
      fs.mkdirSync(path.dirname(cachePath), { recursive: true });
      fs.copyFileSync(targetPath, cachePath);
      return buildResult(targetPath, prompt, 'history');
    }

    // Priority 4: Generate new (preview only, no refine — saves tokens)
    console.log(`  [meshy] No existing match. Generating preview (no refine)...`);
    const previewResp = await fetch(`${API_BASE}/text-to-3d`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'preview',
        prompt,
        art_style: 'realistic',
      }),
    });

    if (!previewResp.ok) {
      throw new Error(`[meshy] Preview task failed (${previewResp.status}): ${await previewResp.text()}`);
    }

    const previewData = await previewResp.json() as { result: string };
    const previewTaskId = previewData.result;
    console.log(`  [meshy] Preview task: ${previewTaskId}`);

    const glbUrl = await pollJob(previewTaskId, apiKey);
    if (!glbUrl) {
      throw new Error('[meshy] Preview completed but no GLB URL returned');
    }

    await downloadGlb(glbUrl, targetPath);
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.copyFileSync(targetPath, cachePath);
    console.log(`  [meshy] Generated and cached: ${spec.id}`);

    return buildResult(targetPath, prompt, 'generated');
  },
};

async function downloadGlb(url: string, destPath: string): Promise<void> {
  const resp = await fetch(url);
  if (!resp.ok || !resp.body) {
    throw new Error(`[meshy] GLB download failed (${resp.status})`);
  }
  const writeStream = fs.createWriteStream(destPath);
  await pipeline(Readable.fromWeb(resp.body as never), writeStream);
}

function buildResult(localPath: string, title: string, source: string): FetchResult {
  const sourceLabel = source === 'community' ? 'Meshy Community (free)' : 'Meshy AI';
  const license = source === 'community' ? 'Meshy-Community' : 'Meshy-Commercial';
  return {
    localPath,
    license,
    licenseUrl: 'https://www.meshy.ai/terms',
    attribution: {
      title: source === 'generated' ? `AI Generated: ${title.slice(0, 60)}` : title,
      author: sourceLabel,
      sourceUrl: 'https://www.meshy.ai',
      downloadDate: new Date().toISOString().split('T')[0],
    },
  };
}
