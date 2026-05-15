# AR Tracking GLTF Models

Place cleanroom suit character GLB files here:

- `cleanroom-a.glb` - Variant A (used by OP-01, OP-03)
- `cleanroom-b.glb` - Variant B (used by OP-02)
- `cleanroom-c.glb` - Variant C (used by OP-04)

After adding GLB files, list available filenames in `models.json`. The AR scene only attempts to load models listed there, so local development and CI do not emit browser 404 errors while placeholder assets are absent.

## Requirements

- Format: GLB (binary glTF)
- Triangle budget: under 5K per model
- File size: under 400KB each
- Required animation clips (names must contain these substrings):
  - `walk` - looping walk cycle
  - `idle` - looping idle stance
  - `look` - single-play head look-around

## Sourcing Workflow

1. Download rigged humanoid from Mixamo, such as X Bot or Y Bot.
2. Apply animations in Mixamo: Walking, Idle, Looking Around.
3. Export as GLB with skin and baked animations.
4. Re-color in Blender to a white cleanroom suit with 2-3 tint variants.
5. Verify triangle count and file size.

Until these files are placed here, the scene falls back to capsule primitives.
