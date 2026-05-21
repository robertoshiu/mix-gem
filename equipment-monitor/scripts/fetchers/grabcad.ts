/**
 * GrabCAD fetcher — STUB for manually-downloaded STEP files.
 *
 * GrabCAD has no official public API. This module reads pre-downloaded STEP
 * files from vendor/grabcad/ and converts them to glTF using occt-import-js.
 *
 * Manual workflow:
 * 1. Browse https://grabcad.com/library and download STEP/IGES files
 * 2. Place them in vendor/grabcad/ with the filename matching vendor_path in manifest
 * 3. Run `npm run assets:refresh` — this module converts STEP → GLB automatically
 *
 * Requires: occt-import-js (npm install occt-import-js)
 */
import fs from 'node:fs';
import path from 'node:path';
import type { AssetSpec, FetchResult, Fetcher } from './types.js';

export const grabcad: Fetcher = {
  name: 'grabcad',

  isAvailable(): boolean {
    return true; // Always available (reads local files)
  },

  async fetch(spec: AssetSpec): Promise<FetchResult> {
    const vendorPath = spec.vendor_path;
    if (!vendorPath) {
      throw new Error(`[grabcad] No vendor_path specified for ${spec.id}`);
    }

    if (!fs.existsSync(vendorPath)) {
      throw new Error(
        `[grabcad] File not found: ${vendorPath}\n` +
        `  Manual step required:\n` +
        `  1. Download the STEP file from grabcad.com\n` +
        `  2. Place it at: ${vendorPath}\n` +
        `  3. Re-run npm run assets:refresh`
      );
    }

    console.log(`  [grabcad] Converting STEP → GLB: ${vendorPath}`);

    // Dynamic import for occt-import-js (optional dependency)
    let occtImport: typeof import('occt-import-js');
    try {
      occtImport = await import('occt-import-js');
    } catch {
      throw new Error(
        '[grabcad] occt-import-js not installed. Run: npm install occt-import-js'
      );
    }

    const occt = await occtImport.default();
    const fileBuffer = fs.readFileSync(vendorPath);
    const fileArray = new Uint8Array(fileBuffer);

    // Import the STEP file
    const result = occt.ReadStepFile(fileArray, null);

    if (!result.success) {
      throw new Error(`[grabcad] STEP import failed for ${vendorPath}`);
    }

    // Convert to GLB (basic triangle mesh export)
    const targetPath = spec.target_path;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Build a minimal glTF 2.0 binary from the OCCT mesh data
    const glb = buildGlbFromOcctResult(result);
    fs.writeFileSync(targetPath, glb);

    console.log(`  [grabcad] Converted: ${path.basename(vendorPath)} → ${path.basename(targetPath)}`);

    return {
      localPath: targetPath,
      license: 'GrabCAD-Community',
      licenseUrl: 'https://grabcad.com/terms',
      attribution: {
        title: path.basename(vendorPath, path.extname(vendorPath)).replace(/[_-]/g, ' '),
        author: 'GrabCAD Community (manual download)',
        sourceUrl: 'https://grabcad.com/library',
        downloadDate: new Date().toISOString().split('T')[0],
      },
    };
  },
};

/**
 * Build a minimal GLB from occt-import-js mesh result.
 * This produces a valid glTF 2.0 binary with positions + normals.
 */
function buildGlbFromOcctResult(result: {
  meshes: Array<{
    indices: Uint32Array | number[];
    attributes: {
      position: { array: Float32Array | number[] };
      normal?: { array: Float32Array | number[] };
    };
  }>;
}): Buffer {
  const meshes = result.meshes;
  if (meshes.length === 0) {
    throw new Error('[grabcad] STEP file produced no meshes');
  }

  // Merge all meshes into one
  let totalVerts = 0;
  let totalIndices = 0;
  for (const m of meshes) {
    totalVerts += m.attributes.position.array.length / 3;
    totalIndices += m.indices.length;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalIndices);

  let vertOffset = 0;
  let idxOffset = 0;
  let vertCount = 0;

  for (const m of meshes) {
    const posArr = m.attributes.position.array;
    const normArr = m.attributes.normal?.array;
    const idxArr = m.indices;

    for (let i = 0; i < posArr.length; i++) {
      positions[vertOffset * 3 + i] = posArr[i] as number;
    }
    if (normArr) {
      for (let i = 0; i < normArr.length; i++) {
        normals[vertOffset * 3 + i] = normArr[i] as number;
      }
    }
    for (let i = 0; i < idxArr.length; i++) {
      indices[idxOffset + i] = (idxArr[i] as number) + vertCount;
    }

    vertOffset += posArr.length / 3;
    idxOffset += idxArr.length;
    vertCount += posArr.length / 3;
  }

  // Build minimal glTF JSON
  const posBuffer = Buffer.from(positions.buffer);
  const normBuffer = Buffer.from(normals.buffer);
  const idxBuffer = Buffer.from(indices.buffer);
  const binBuffer = Buffer.concat([idxBuffer, posBuffer, normBuffer]);

  // Compute bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]);
    maxX = Math.max(maxX, positions[i]);
    maxY = Math.max(maxY, positions[i + 1]);
    maxZ = Math.max(maxZ, positions[i + 2]);
  }

  const gltf = {
    asset: { version: '2.0', generator: 'mix-gem-grabcad-converter' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 1, NORMAL: 2 },
        indices: 0,
      }],
    }],
    accessors: [
      { bufferView: 0, componentType: 5125, count: totalIndices, type: 'SCALAR' },
      { bufferView: 1, componentType: 5126, count: totalVerts, type: 'VEC3', min: [minX, minY, minZ], max: [maxX, maxY, maxZ] },
      { bufferView: 2, componentType: 5126, count: totalVerts, type: 'VEC3' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: idxBuffer.length },
      { buffer: 0, byteOffset: idxBuffer.length, byteLength: posBuffer.length },
      { buffer: 0, byteOffset: idxBuffer.length + posBuffer.length, byteLength: normBuffer.length },
    ],
    buffers: [{ byteLength: binBuffer.length }],
  };

  const jsonStr = JSON.stringify(gltf);
  // Pad JSON to 4-byte alignment
  const jsonPadded = jsonStr + ' '.repeat((4 - (jsonStr.length % 4)) % 4);
  const jsonBuffer = Buffer.from(jsonPadded, 'utf8');

  // GLB structure: header (12) + JSON chunk (8 + jsonLen) + BIN chunk (8 + binLen)
  const totalLength = 12 + 8 + jsonBuffer.length + 8 + binBuffer.length;
  const glb = Buffer.alloc(totalLength);

  // Header
  glb.writeUInt32LE(0x46546C67, 0); // magic "glTF"
  glb.writeUInt32LE(2, 4);           // version
  glb.writeUInt32LE(totalLength, 8); // total length

  // JSON chunk
  glb.writeUInt32LE(jsonBuffer.length, 12);
  glb.writeUInt32LE(0x4E4F534A, 16); // "JSON"
  jsonBuffer.copy(glb, 20);

  // BIN chunk
  const binOffset = 20 + jsonBuffer.length;
  glb.writeUInt32LE(binBuffer.length, binOffset);
  glb.writeUInt32LE(0x004E4942, binOffset + 4); // "BIN\0"
  binBuffer.copy(glb, binOffset + 8);

  return glb;
}
