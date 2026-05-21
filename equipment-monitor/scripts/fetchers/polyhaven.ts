/**
 * Poly Haven fetcher — public API at https://api.polyhaven.com
 * All assets are CC0 (public domain).
 */
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { AssetSpec, FetchResult, Fetcher } from './types.js';

const API_BASE = 'https://api.polyhaven.com';

export const polyhaven: Fetcher = {
  name: 'polyhaven',

  isAvailable(): boolean {
    return true; // No API key required
  },

  async fetch(spec: AssetSpec): Promise<FetchResult> {
    const slug = spec.query;
    if (!slug) throw new Error(`[polyhaven] No query/slug provided for ${spec.id}`);

    const resolution = spec.resolution || '2k';
    // Poly Haven API uses 'hdri' as the key, not 'hdr'
    const rawFormat = spec.format || 'hdr';
    const format = rawFormat === 'hdr' ? 'hdri' : rawFormat;

    // Get file URLs for this asset
    const filesUrl = `${API_BASE}/files/${slug}`;
    const resp = await fetch(filesUrl);
    if (!resp.ok) {
      throw new Error(`[polyhaven] Asset "${slug}" not found (${resp.status})`);
    }

    const data = await resp.json() as Record<string, Record<string, Record<string, { url: string }>>>;

    // Navigate the response structure: data[format][resolution][format].url
    const formatData = data[format];
    if (!formatData) {
      throw new Error(`[polyhaven] Format "${format}" not available for "${slug}". Available: ${Object.keys(data).join(', ')}`);
    }

    const resData = formatData[resolution];
    if (!resData) {
      throw new Error(`[polyhaven] Resolution "${resolution}" not available for "${slug}". Available: ${Object.keys(formatData).join(', ')}`);
    }

    // Get the download URL — inner key is the file extension (e.g. 'hdr', 'exr')
    const fileKey = rawFormat === 'hdr' ? 'hdr' : rawFormat;
    const fileEntry = resData[fileKey] || Object.values(resData)[0];
    if (!fileEntry?.url) {
      throw new Error(`[polyhaven] No download URL found for "${slug}" at ${resolution}. Keys: ${Object.keys(resData).join(', ')}`);
    }

    const downloadUrl = fileEntry.url;

    // Ensure output directory exists
    const targetPath = spec.target_path;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Download the file
    const downloadResp = await fetch(downloadUrl);
    if (!downloadResp.ok || !downloadResp.body) {
      throw new Error(`[polyhaven] Download failed for "${slug}" (${downloadResp.status})`);
    }

    const writeStream = fs.createWriteStream(targetPath);
    await pipeline(Readable.fromWeb(downloadResp.body as never), writeStream);

    console.log(`  [polyhaven] Downloaded: ${slug} (${resolution} ${format})`);

    return {
      localPath: targetPath,
      license: 'CC0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution: {
        title: slug.replace(/_/g, ' '),
        author: 'Poly Haven',
        sourceUrl: `https://polyhaven.com/a/${slug}`,
        downloadDate: new Date().toISOString().split('T')[0],
      },
    };
  },
};
