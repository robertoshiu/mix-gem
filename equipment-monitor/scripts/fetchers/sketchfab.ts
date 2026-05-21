/**
 * Sketchfab fetcher — REST API at https://api.sketchfab.com/v3
 * Requires SKETCHFAB_TOKEN env var.
 * Filters by license: only CC0 (cc0) and CC-BY (by) allowed by default.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { AssetSpec, FetchResult, Fetcher, SourceEntry } from './types.js';

const API_BASE = 'https://api.sketchfab.com/v3';

const LICENSE_MAP: Record<string, string> = {
  'cc0': 'CC0',
  'by': 'CC-BY',
  'by-sa': 'CC-BY-SA',
  'by-nd': 'CC-BY-ND',
  'by-nc': 'CC-BY-NC',
  'by-nc-sa': 'CC-BY-NC-SA',
  'by-nc-nd': 'CC-BY-NC-ND',
};

const LICENSE_URLS: Record<string, string> = {
  'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC-BY': 'https://creativecommons.org/licenses/by/4.0/',
  'CC-BY-SA': 'https://creativecommons.org/licenses/by-sa/4.0/',
};

function getToken(): string {
  const token = process.env.SKETCHFAB_TOKEN;
  if (!token) throw new Error('[sketchfab] SKETCHFAB_TOKEN env var not set');
  return token;
}


export const sketchfab: Fetcher = {
  name: 'sketchfab',

  isAvailable(): boolean {
    return !!process.env.SKETCHFAB_TOKEN;
  },

  async fetch(spec: AssetSpec, sourceEntry?: SourceEntry): Promise<FetchResult> {
    const token = getToken();
    const query = sourceEntry?.query || spec.query;
    if (!query) throw new Error(`[sketchfab] No query provided for ${spec.id}`);

    const licenseFilter = sourceEntry?.license_filter || spec.license_filter || ['CC0', 'CC-BY'];
    const minLikes = sourceEntry?.min_likes || spec.min_likes || 0;

    // Search for downloadable models with license filter
    // Sketchfab API requires separate 'license' params per value
    const licenseSlugs = licenseFilter.map(f => {
      const slugMap: Record<string, string> = { 'CC0': 'cc0', 'CC-BY': 'by', 'CC-BY-SA': 'by-sa' };
      return slugMap[f] || f.toLowerCase();
    });
    const searchUrl = new URL(`${API_BASE}/search`);
    searchUrl.searchParams.set('type', 'models');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('downloadable', 'true');
    for (const slug of licenseSlugs) {
      searchUrl.searchParams.append('license', slug);
    }
    searchUrl.searchParams.set('sort_by', '-likeCount');

    const searchResp = await fetch(searchUrl.toString(), {
      headers: { Authorization: `Token ${token}` },
    });

    if (!searchResp.ok) {
      throw new Error(`[sketchfab] Search failed (${searchResp.status}): ${await searchResp.text()}`);
    }

    const searchData = await searchResp.json() as {
      results: Array<{
        uid: string;
        name: string;
        likeCount: number;
        user: { displayName: string };
        viewerUrl: string;
        license: { slug: string; label: string } | null;
      }>;
    };

    // Filter by minimum likes
    const candidates = searchData.results.filter(r => r.likeCount >= minLikes);
    if (candidates.length === 0) {
      throw new Error(`[sketchfab] No results for "${query}" with >= ${minLikes} likes and license ${licenseSlugs.join(',')}`);
    }

    const model = candidates[0];
    console.log(`  [sketchfab] Selected: "${model.name}" by ${model.user.displayName} (${model.likeCount} likes)`);

    // Request download URL
    const downloadReqUrl = `${API_BASE}/models/${model.uid}/download`;
    const dlResp = await fetch(downloadReqUrl, {
      headers: { Authorization: `Token ${token}` },
    });

    if (!dlResp.ok) {
      throw new Error(`[sketchfab] Download request failed for ${model.uid} (${dlResp.status})`);
    }

    const dlData = await dlResp.json() as {
      gltf?: { url: string; size: number };
      glb?: { url: string; size: number };
    };

    // Prefer GLB, fall back to GLTF
    const downloadInfo = dlData.glb || dlData.gltf;
    if (!downloadInfo) {
      throw new Error(`[sketchfab] No GLB/GLTF download available for "${model.name}"`);
    }

    // Download the file
    const targetPath = spec.target_path;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    const fileResp = await fetch(downloadInfo.url);
    if (!fileResp.ok || !fileResp.body) {
      throw new Error(`[sketchfab] File download failed (${fileResp.status})`);
    }

    const writeStream = fs.createWriteStream(targetPath);
    await pipeline(Readable.fromWeb(fileResp.body as never), writeStream);

    const licenseSlug = model.license?.slug || 'by';
    const licenseName = LICENSE_MAP[licenseSlug] || licenseSlug.toUpperCase();
    console.log(`  [sketchfab] Downloaded: ${model.name} [${licenseName}]`);

    return {
      localPath: targetPath,
      license: licenseName,
      licenseUrl: LICENSE_URLS[licenseName] || `https://creativecommons.org/licenses/${licenseSlug}/4.0/`,
      attribution: {
        title: model.name,
        author: model.user.displayName,
        sourceUrl: model.viewerUrl || `https://sketchfab.com/3d-models/${model.uid}`,
        downloadDate: new Date().toISOString().split('T')[0],
      },
    };
  },
};
