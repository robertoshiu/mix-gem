# Fab-Twin Meshy Asset Replacement Design

> Date: 2026-05-18
> Status: Approved
> Scope: Replace all procedural geometry + existing GLBs in FabTwinBabylonScene with free models from Meshy community library

## Context

The Fab-Twin scene (`/mes/fab-twin`) currently uses:
- **5 equipment GLBs** (~43 MB total) sourced from Meshy AI generation + Sketchfab
- **Procedural geometry** (boxes/cylinders) for infrastructure: scrubber, PDU, FOUP carrier, FFU ceiling, pipes, walls
- **Empty `public/models/infrastructure/`** directory (planned Sketchfab downloads never executed)

Goal: source realistic industrial models from **Meshy community library** (free, no generation credits) and replace everything for a cohesive visual upgrade.

## Constraints

- **Total GLB budget: ~80 MB** (current 43 MB + ~37 MB new)
- **Source: Meshy community library only** (free downloads, GLB format)
- **Style: Realistic industrial** — keep original PBR textures from Meshy
- **Fallback: Procedural geometry stays** — if a GLB fails to load, the existing boxes/cylinders remain
- **Deployment: GitHub Pages static export** — all assets committed to git

## Priority Table

| Priority | Object | Meshy Search Terms | Budget | Replaces |
|----------|--------|--------------------|--------|----------|
| P1 | Lithography scanner | "semiconductor scanner", "wafer stepper", "lithography machine" | ~4 MB | stepper.glb (5.2 MB) |
| P1 | Etch/CVD chamber | "vacuum chamber", "plasma chamber", "semiconductor chamber" | ~5 MB | chamber.glb (12 MB) |
| P1 | FOUP carrier | "FOUP", "wafer carrier", "wafer cassette" | ~2 MB | procedural box |
| P2 | Scrubber | "industrial scrubber", "exhaust scrubber", "chemical scrubber" | ~3 MB | procedural cylinder |
| P2 | PDU | "electrical panel", "power distribution", "server rack cabinet" | ~3 MB | procedural box |
| P2 | FFU unit | "fan filter unit", "ceiling vent", "HEPA filter panel" | ~1 MB | procedural box (instanced x50) |
| P3 | CD-SEM metrology | "electron microscope", "SEM", "metrology inspection" | ~3 MB | metrology.glb (2.7 MB) |
| P3 | EFEM | "equipment front end", "wafer loader", "load port module" | ~3 MB | efem.glb (2.8 MB) |
| P3 | Gas cabinet | "gas cabinet", "gas cylinder rack", "chemical cabinet" | ~2 MB | not yet in scene |

**Keep procedural** (low visual impact, save budget):
- Pipe rack + hangers (lines/cylinders look fine)
- Cleanroom walls (flat panels)
- Floor grid (flat plane)
- Light fixtures (tiny, instanced)
- Sensors (tiny spheres)

**Estimated new total: ~69 MB** (current 43 MB - replaced models + new models + compression savings)

## File Organization

```
public/models/
  equipment/              <- process tools (P1/P3)
    lithography.glb       <- NEW from Meshy (replaces stepper.glb)
    etch_chamber.glb      <- NEW from Meshy (replaces chamber.glb)
    metrology.glb         <- NEW from Meshy (replaces current)
    efem.glb              <- NEW from Meshy (replaces current)
    spin_coater.glb       <- KEEP (not used in fab-twin)
    robot_arm.glb         <- KEEP (not used in fab-twin)
    wafer_cassette.glb    <- KEEP (not used in fab-twin)
  infrastructure/         <- support systems (P2/P3)
    scrubber.glb          <- NEW from Meshy
    pdu.glb               <- NEW from Meshy
    ffu.glb               <- NEW from Meshy
    foup_carrier.glb      <- NEW from Meshy
    gas_cabinet.glb       <- NEW from Meshy
```

Old files (stepper.glb, chamber.glb) deleted after replacement is verified.

## Code Changes

### 1. Update TOOL_GLB_MAP (FabTwinBabylonScene.tsx)

```typescript
const TOOL_GLB_MAP: Record<string, string> = {
  lithography: '/models/equipment/lithography.glb',
  etch: '/models/equipment/etch_chamber.glb',
  deposition: '/models/equipment/etch_chamber.glb',
  metrology: '/models/equipment/metrology.glb',
  test: '/models/equipment/efem.glb',
};
```

### 2. Add INFRA_GLB_MAP + upgradeInfrastructureWithGLB()

New map linking procedural mesh names to GLB paths:

```typescript
const INFRA_GLB_MAP: Record<string, string> = {
  'SCRUBBER-SUBFAB-01': '/models/infrastructure/scrubber.glb',
  'PDU-A-01': '/models/infrastructure/pdu.glb',
  'FOUP-CARRIER-A17': '/models/infrastructure/foup_carrier.glb',
};
```

New async function following the same pattern as `upgradeToolsWithGLB()`:
- Load GLB as AssetContainer
- Find procedural mesh by name
- Parent GLB under the mesh's position
- Scale to match original bounding box
- Keep original PBR textures from Meshy
- Hide procedural mesh (don't delete — serves as fallback)

### 3. FFU instancing with GLB

Special handling for FFU — the current pattern creates ~50 instances from a master box:
- Load `ffu.glb` once
- Replace `FFU-MASTER-LOD0` mesh with GLB geometry
- Existing `createInstance()` calls continue to work on the new mesh

### 4. Gas cabinet (new object)

Add gas cabinet to `createUtilities()`:
- Position near scrubber in subfab zone
- Load GLB with same fallback pattern
- Add metadata for asset picking

## Compression Pipeline

Post-download optimization for each model:

```bash
npx gltf-transform optimize input.glb output.glb \
  --compress draco \
  --texture-compress webp \
  --texture-size 1024
```

Target: each model compressed to its budget from the priority table.

## Asset Manifest Updates

Update `equipment-monitor/assets.manifest.yaml`:
- Change infrastructure entries from `source: sketchfab` to `source: meshy` with community library URLs
- Change equipment entries from `source: meshy` (AI generation) to `source: meshy` (community library) with direct URLs
- Add `meshy_id` field for each community model for traceability

## Git Strategy

- One commit per priority tier: P1, P2, P3
- Delete old GLBs (stepper.glb, chamber.glb) only after P1 replacement is verified working
- Update asset manifest in the same commit as the GLBs

## Workflow

1. Search Meshy community library for each item (browser)
2. Download GLB, verify in Babylon.js sandbox
3. Compress with gltf-transform
4. Place in correct directory
5. Update code (GLB maps, new infrastructure loader)
6. Test scene loads with all models
7. Commit per priority tier
