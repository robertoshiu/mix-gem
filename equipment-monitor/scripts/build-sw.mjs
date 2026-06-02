import { generateSW } from 'workbox-build';

const BASE = '/mix-gem/';

const { count, size, warnings } = await generateSW({
  globDirectory: 'out',
  swDest: 'out/sw.js',
  // Precache the app shell. Exclude heavy media (runtime-cached instead) and maps.
  globPatterns: ['**/*.{html,js,css,woff2,json,webmanifest,png,svg,ico,txt}'],
  globIgnores: ['**/models/**', '**/*.glb', '**/*.mp4', '**/*.webm', '**/*.map', 'sw.js'],
  // Files live in out/ but are served under /mix-gem/ — prefix every precache URL.
  manifestTransforms: [
    (entries) => ({
      manifest: entries.map((e) => ({ ...e, url: BASE + e.url.replace(/^\//, '') })),
      warnings: [],
    }),
  ],
  cacheId: 'equipment-monitor',
  // Precache the two ~3.8 MB Babylon chunks too, so the shell works fully offline.
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: BASE + 'index.html',
  navigateFallbackDenylist: [/^\/mix-gem\/_next\//],
  runtimeCaching: [
    {
      // 3D GLB models — cache on first view, capped.
      urlPattern: /\.glb(\?.*)?$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'glb-models',
        expiration: { maxEntries: 30, maxAgeSeconds: 30 * 24 * 60 * 60, purgeOnQuotaError: true },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-fonts-stylesheets' },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)(\?.*)?$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
});

if (warnings.length) console.warn('[build-sw] warnings:', warnings);
console.log(`[build-sw] precached ${count} files, ${(size / 1024 / 1024).toFixed(2)} MB -> out/sw.js`);
