import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tile = await readFile(join(root, 'assets/icons/icon.svg'));
const maskable = await readFile(join(root, 'assets/icons/icon-maskable.svg'));
const out = (name) => join(root, 'public', name);

const jobs = [
  [tile, 192, 'icon-192.png'],
  [tile, 512, 'icon-512.png'],
  [maskable, 192, 'icon-192-maskable.png'],
  [maskable, 512, 'icon-512-maskable.png'],
  [maskable, 180, 'apple-touch-icon.png'],
];

for (const [svg, size, name] of jobs) {
  await sharp(svg).resize(size, size).png().toFile(out(name));
  console.log('wrote', name, size + 'x' + size);
}
