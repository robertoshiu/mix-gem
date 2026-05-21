/**
 * Tripo AI fetcher — alternative to Meshy for text-to-3D generation.
 * Used as fallback when MESHY_API_KEY is not available.
 * Requires TRIPO_API_KEY env var.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { AssetSpec, FetchResult, Fetcher, SourceEntry } from './types.js';

const API_BASE = 'https://api.tripo3d.ai/v2/openapi';
const CACHE_DIR = 'node_modules/.cache/tripo';
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 60;

function getApiKey(): string {
  const key = process.env.TRIPO_API_KEY;
  if (!key) throw new Error('[tripo] TRIPO_API_KEY env var not set');
  return key;
}

function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

function getCachePath(prompt: string): string {
  return path.join(CACHE_DIR, `${hashPrompt(prompt)}.glb`);
}

async function pollTask(taskId: string, apiKey: string): Promise<string> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

    const resp = await fetch(`${API_BASE}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!resp.ok) {
      throw new Error(`[tripo] Poll failed (${resp.status}): ${await resp.text()}`);
    }

    const data = await resp.json() as {
      data: {
        status: string;
        output?: { model?: string };
        error?: string;
      };
    };

    const task = data.data;

    if (task.status === 'success') {
      if (!task.output?.model) {
        throw new Error('[tripo] Task succeeded but no model URL');
      }
      return task.output.model;
    }

    if (task.status === 'failed') {
      throw new Error(`[tripo] Generation failed: ${task.error || 'unknown'}`);
    }

    if (i % 6 === 0) {
      console.log(`  [tripo] Still generating... (${Math.round((i * POLL_INTERVAL_MS) / 1000)}s)`);
    }
  }

  throw new Error(`[tripo] Generation timed out`);
}

export const tripo: Fetcher = {
  name: 'tripo',

  isAvailable(): boolean {
    return !!process.env.TRIPO_API_KEY;
  },

  async fetch(spec: AssetSpec, sourceEntry?: SourceEntry): Promise<FetchResult> {
    const apiKey = getApiKey();
    const prompt = sourceEntry?.prompt || spec.prompt;
    if (!prompt) throw new Error(`[tripo] No prompt provided for ${spec.id}`);

    // Check cache
    const cachePath = getCachePath(prompt);
    if (fs.existsSync(cachePath)) {
      console.log(`  [tripo] Cache hit for "${prompt.slice(0, 50)}..."`);
      const targetPath = spec.target_path;
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(cachePath, targetPath);

      return {
        localPath: targetPath,
        license: 'Tripo-Commercial',
        licenseUrl: 'https://www.tripo3d.ai/terms',
        attribution: {
          title: `AI Generated: ${prompt.slice(0, 60)}`,
          author: 'Tripo AI',
          sourceUrl: 'https://www.tripo3d.ai',
          downloadDate: new Date().toISOString().split('T')[0],
        },
      };
    }

    console.log(`  [tripo] Generating: "${prompt.slice(0, 80)}..."`);

    // Create task
    const createResp = await fetch(`${API_BASE}/task`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'text_to_model',
        prompt,
        model_version: 'v2.0-20240919',
        output_format: 'glb',
      }),
    });

    if (!createResp.ok) {
      throw new Error(`[tripo] Create task failed (${createResp.status}): ${await createResp.text()}`);
    }

    const createData = await createResp.json() as { data: { task_id: string } };
    const taskId = createData.data.task_id;
    console.log(`  [tripo] Task created: ${taskId}`);

    // Poll
    const modelUrl = await pollTask(taskId, apiKey);

    // Download
    const targetPath = spec.target_path;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    const dlResp = await fetch(modelUrl);
    if (!dlResp.ok || !dlResp.body) {
      throw new Error(`[tripo] Download failed (${dlResp.status})`);
    }

    const writeStream = fs.createWriteStream(targetPath);
    await pipeline(Readable.fromWeb(dlResp.body as never), writeStream);

    // Cache
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.copyFileSync(targetPath, cachePath);

    console.log(`  [tripo] Generated and cached: ${spec.id}`);

    return {
      localPath: targetPath,
      license: 'Tripo-Commercial',
      licenseUrl: 'https://www.tripo3d.ai/terms',
      attribution: {
        title: `AI Generated: ${prompt.slice(0, 60)}`,
        author: 'Tripo AI',
        sourceUrl: 'https://www.tripo3d.ai',
        downloadDate: new Date().toISOString().split('T')[0],
      },
    };
  },
};
