/**
 * Ready Player Me fetcher — generates customizable avatars via their API.
 * Requires READYPLAYERME_APP_ID env var for subdomain/app identification.
 *
 * Uses the Avatar API to create a full-body realistic avatar in GLB format.
 * Docs: https://docs.readyplayer.me/ready-player-me/api-reference
 */
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import type { AssetSpec, FetchResult, Fetcher } from './types.js';

const DEFAULT_AVATAR_URL = 'https://models.readyplayer.me';

function getAppId(): string {
  const appId = process.env.READYPLAYERME_APP_ID;
  if (!appId) throw new Error('[readyplayerme] READYPLAYERME_APP_ID env var not set');
  return appId;
}

export const readyplayerme: Fetcher = {
  name: 'readyplayerme',

  isAvailable(): boolean {
    return !!process.env.READYPLAYERME_APP_ID;
  },

  async fetch(spec: AssetSpec): Promise<FetchResult> {
    const appId = getAppId();
    const config = (spec.config || {}) as {
      gender?: string;
      style?: string;
      body_type?: string;
      quality?: string;
      avatar_id?: string;
    };

    let avatarUrl: string;

    if (config.avatar_id) {
      // Use a specific avatar ID
      avatarUrl = `${DEFAULT_AVATAR_URL}/${config.avatar_id}.glb`;
    } else {
      // Use the default anonymous avatar endpoint with parameters
      // Ready Player Me provides template avatars for development
      const params = new URLSearchParams();
      params.set('morphTargets', 'none');
      params.set('textureAtlas', config.quality === 'high' ? '1024' : '512');
      params.set('lod', '0'); // highest quality
      if (config.body_type === 'fullbody') {
        params.set('pose', 'T');
      }

      // Use a default demo avatar — in production, user provides their own avatar_id
      // The demo avatars are publicly accessible
      const demoAvatarId = config.gender === 'female'
        ? '64148866f18e41289e3cd535'
        : '6414886df18e41289e3cd53a';

      avatarUrl = `${DEFAULT_AVATAR_URL}/${demoAvatarId}.glb?${params.toString()}`;
    }

    console.log(`  [readyplayerme] Fetching avatar: ${avatarUrl.split('?')[0]}`);

    const resp = await fetch(avatarUrl, {
      headers: {
        'X-App-Id': appId,
      },
    });

    if (!resp.ok || !resp.body) {
      throw new Error(`[readyplayerme] Avatar download failed (${resp.status}): ${await resp.text()}`);
    }

    const targetPath = spec.target_path;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    const writeStream = fs.createWriteStream(targetPath);
    await pipeline(Readable.fromWeb(resp.body as never), writeStream);

    console.log(`  [readyplayerme] Downloaded avatar to ${targetPath}`);

    return {
      localPath: targetPath,
      license: 'RPM-Standard',
      licenseUrl: 'https://docs.readyplayer.me/ready-player-me/legal/end-user-license-agreement',
      attribution: {
        title: 'Ready Player Me Avatar',
        author: 'Ready Player Me',
        sourceUrl: 'https://readyplayer.me',
        downloadDate: new Date().toISOString().split('T')[0],
      },
    };
  },
};
