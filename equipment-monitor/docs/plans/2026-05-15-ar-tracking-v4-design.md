# AR Tracking v4 — PiP Isolation, Holographic Visuals, Nav Graph Pathfinding

> Fixes three critical issues in the v3 implementation:
> 1. PiP ghosting from shared post-processing in multi-viewport mode
> 2. Toy-like personnel and equipment visuals (capsule primitives, wireframe boxes)
> 3. Personnel walking paths that cut through equipment bays

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PiP rendering | RTT + CSS composite | Eliminates viewport bleed by rendering PiP to offscreen texture, blitting to a DOM canvas. Zero shared post-processing. |
| Personnel visuals | GLTF + holographic shader | Existing GLTF pipeline reused. Strip original materials, apply fresnel + scan-line shader. Articulated procedural fallback when GLTF unavailable. |
| Equipment visuals | Hybrid shell + wireframe internals | Semi-transparent low-poly outer form per bay type + emissive internal line structure = "X-ray hologram" |
| Pathfinding | Navigation graph + corrected waypoints | ~20-25 graph nodes along fab walkways. Routes follow graph edges. No path crosses equipment AABBs. |

---

## Section 1: PiP — RTT + CSS Composite

### Problem

`scene.activeCameras = [overviewCamera, arCamera]` renders both cameras in the same scene pass. The GlowLayer, HighlightLayer, SSAO, and SSR are scene-global — they bleed across both viewports. The `AdvancedDynamicTexture.CreateFullscreenUI` for the PiP HUD also renders fullscreen and the `layerMask` trick is fragile.

### Solution

Remove the multi-viewport system entirely. Render the PiP camera to a RenderTargetTexture (RTT), then blit the result to a separate `<canvas>` element positioned via CSS over the main canvas.

### Implementation

- Create a `RenderTargetTexture` (512x384) attached to `arCamera`
- Every frame, the RTT captures the PiP view in isolation — no shared post-processing
- A second `<canvas>` element (the "pip canvas") sits as a CSS-positioned sibling of the main Babylon canvas. React renders it inside the page layout alongside the existing PipOverlay component
- Each frame, blit the RTT pixel data to the pip canvas via `readPixels()` + `putImageData()`, or more efficiently use `engine.createDynamicTexture` and draw to a 2D canvas context
- The CRT scan-line effect moves from a Babylon PostProcess to a lightweight 2D canvas filter drawn on top of the pip canvas — horizontal lines, vignette, subtle noise. Cheaper and visually identical
- The PiP AR HUD (zone markers, distance warning, path prediction) moves from AdvancedDynamicTexture to React DOM elements positioned over the pip canvas — easier to style, no layer mask conflicts
- `createPipScanlinePostProcess` and `createPipArHud` are deleted entirely
- The pip canvas visibility is toggled by `pipTarget` state — same as today

### What This Eliminates

GlowLayer bleed, SSAO/SSR double-rendering on PiP, HighlightLayer artifacts, AdvancedDynamicTexture fullscreen leak, the fragile `PIP_HUD_LAYER_MASK` system.

---

## Section 2: Holographic Material System

### Problem

Personnel and equipment both need a "holographic" look, but the current approach uses separate ad-hoc PBR materials that read as toy-like.

### Solution

Create a reusable holographic material factory that produces a consistent AR projection aesthetic. Two material variants from one system.

### Personnel Holographic Material

- `ShaderMaterial` with custom vertex/fragment: fresnel edge glow (bright at grazing angles, transparent at center), horizontal scan-line bands scrolling slowly upward, subtle vertex displacement noise for a "projection flicker" effect
- Base color driven by personnel state (cyan/amber/red/blue) — same color mapping as today but the shader makes it look like a data projection rather than painted plastic
- Alpha ~0.7 at center, ~1.0 at edges — the person is semi-transparent, you see through their torso slightly. This is the key trick that makes it read as "hologram" not "toy"

### Equipment Holographic Material

- Same fresnel + scan-line shader base, tuned differently: lower alpha (~0.3 for outer shell), stronger grid-line pattern overlaid on surfaces, state-driven color (cyan idle, amber warmup, green running, blue cooldown)
- Inner wireframe lines use a simpler emissive StandardMaterial — bright, no transparency, strong glow contribution

### Shared Uniforms

`baseColor`, `scanLineSpeed`, `scanLineSpacing`, `fresnelPower`, `flickerIntensity`, `time`. Both variants call the same GLSL but with different defaults.

### File

`src/lib/holographic-material.ts` — exports `createPersonnelHolographicMaterial()` and `createEquipmentHolographicMaterial()`.

---

## Section 3: Personnel Visual Upgrade

### Problem

Capsule+sphere primitives with torus scan rings. No human silhouette, no believable form.

### Primary Path — GLTF Models with Holographic Shader

- The GLTF loading pipeline already exists (ArTrackingScene.tsx lines 565-646). On load, strip all original materials from the imported meshes
- Apply the personnel holographic shader from Section 2 to every mesh in the model. The character becomes a translucent cyan figure with fresnel edge glow and scan-line bands — recognizably human but clearly a "tracking projection"
- Keep the existing animation system (walk/idle/look-around blending) — animations work on the skeleton regardless of material
- AR glasses remain as a small opaque emissive box on the head bone — the one solid element on an otherwise translucent figure. Anchors the "AR tracking" concept
- The ID tag above the head stays as a DynamicTexture billboard but gets a dark backing panel for readability against the translucent body

### Fallback — Articulated Procedural Mesh

- When GLTF fails to load, build: torso (flattened capsule), two arms (thin cylinders with elbow joint), two legs (thin cylinders with knee joint), head (sphere), neck (short cylinder)
- ~15 meshes total per person, parented to a TransformNode hierarchy that allows basic joint rotation
- Simple procedural walk: alternate leg swing + arm counter-swing in the render loop, driven by movement speed
- Same holographic material applied — the articulated fallback still looks like a tracked projection, just lower fidelity

### Augmentation Cleanup

Remove scan ring torus, digital halo torus, and directional indicator cylinder. The holographic shader itself provides the "tracked" visual. Replace with a single ground-projected circle (flat disc at y=0.02 under each person) showing their tracking footprint — color-coded by state.

---

## Section 4: Equipment Visual Upgrade

### Problem

12 CreateLines edges per bay — identical wireframe boxes with no distinguishing form.

### Outer Shell — Distinct Silhouette Per Bay Type

Each of the 8 bay types gets a recognizable low-poly form built from MeshBuilder primitives:

| Bay | Form |
|-----|------|
| Litho Bay | Wide flat platform + tall vertical column + horizontal lens assembly |
| Etch Bay | Cylindrical chamber + domed lid + side pipes |
| Diffusion Bay | Horizontal tube furnace + loading door |
| Metrology | Compact box + overhead arm + optics turret |
| CMP Bay | Round platen + slurry arm + pad conditioner disc |
| Implant | Tall vertical column + angled beam line + end station box |
| Stocker | Tall shelving rack grid (stacked boxes with gaps) |
| Photo Track | Long rectangular body + multiple process cups (cylinders) |

Each shell is 8-15 meshes merged via `Mesh.MergeMeshes`. Equipment holographic material applied — semi-transparent with grid pattern and fresnel edge glow. Shell height varies 2-4m depending on real equipment proportions.

### Inner Wireframe Structure

Inside each shell, 6-10 line meshes suggest internal components — chamber walls, process heads, wafer stages, piping runs. Bright emissive StandardMaterial, stronger glow contribution than the shell.

### Data Panel Upgrade

Replace flat DynamicTexture billboard with a small holographic "floating screen" — thin box with equipment holographic material, text on front face via DynamicTexture. Angled slightly toward overview camera. Shows bay name, state text, and a bar indicator for state timer progress.

### State Visuals

Unchanged mapping: idle=cyan, warmup=amber pulse, running=green, cooldown=blue fade. The shader's `baseColor` uniform drives this.

---

## Section 5: Navigation Graph + Walkway System

### Problem

PATROL_ROUTES are straight lines between sparse waypoints. OP-04 starts inside Stocker. Multiple routes cut through equipment bays.

### Navigation Graph Design

- Define ~20-25 graph nodes along the natural walkways of the fab floor. These represent intersections and corridor segments between equipment bays
- The fab layout has clear aisles: horizontal central spine (~z=0), top corridor (~z=14-16), bottom corridor (~z=-14 to -16), left wing (~x=-24), right wing (~x=22-26), and cross-aisles between bays
- Each node is a `[x, z]` coordinate placed in walkable space — minimum 1.5m clearance from any equipment bay AABB edge
- Edges connect adjacent nodes. Each edge is validated at definition time: line-segment vs AABB intersection test confirms no edge passes through any equipment bay

### Patrol Route Generation

- Each person's route is defined as an ordered list of graph node IDs (not raw coordinates)
- At runtime, the person walks node-to-node along graph edges. When they reach a node, advance to the next node in their route sequence
- Routes loop. Each route visits different areas for realistic patrol coverage
- `updatePersonMovement` changes from "lerp toward next raw waypoint" to "lerp toward next graph node in route"

### Equipment AABB Registry

- Export `EQUIPMENT_AABBS` as a constant alongside `EQUIPMENT_BAY_LAYOUT` — each bay's bounding box with 1m padding
- Used at graph definition time for edge validation, and at runtime for avoidance behavior

### Avoiding Behavior Fix

When a person enters `avoiding` state, `directionAwayFromZone` already works. The difference is they re-enter the graph at the nearest walkable node rather than drifting into equipment.

---

## Section 6: Integration and Data Flow Changes

### ArTrackingScene.tsx — Major Rewrite

- Remove `scene.activeCameras` dual-viewport system. Main canvas renders only `overviewCamera`
- Add RTT creation for PiP: `new RenderTargetTexture('pip-rtt', { width: 512, height: 384 }, scene)` with `arCamera` as active camera for RTT rendering
- Replace `createPerson` capsule builder with articulated procedural fallback builder
- Replace `createGltfPerson` material assignment — strip imported materials, apply holographic shader
- Replace `createFabLayout` equipment box edges with per-bay-type silhouette builders
- Replace PATROL_ROUTES waypoint references with navigation graph traversal
- Remove `createPipScanlinePostProcess` usage and `createPipArHud` usage
- Remove `PIP_HUD_LAYER_MASK` system entirely
- Add RTT `render()` call and pip canvas blit in render loop (only when `pipTarget` is set)

### page.tsx — Moderate Changes

- Add a second `<canvas>` element for PiP, CSS-positioned at bottom-right (same location as current PiP viewport)
- Move PiP HUD elements (zone marker, distance warning, path line) from Babylon GUI to React DOM overlaid on pip canvas
- CRT scan-line effect becomes CSS pseudo-element or lightweight canvas 2D draw on pip canvas
- PipOverlay component wraps the pip canvas + HUD + scan-line effect

### ar-tracking-store.ts — Minor Additions

- No structural changes. Nav graph constants live in a new file
- Personnel and equipment types unchanged

### New Files

| File | Purpose |
|------|---------|
| `src/lib/holographic-material.ts` | Shared holographic shader factory |
| `src/lib/ar-tracking-nav-graph.ts` | Graph nodes, edges, route definitions, AABB validation |
| `src/components/babylon/ar-tracking/equipment-models.ts` | Per-bay-type silhouette builders |

### Deleted Files

| File | Reason |
|------|--------|
| `src/components/babylon/ar-tracking/pip-scanline-shader.ts` | Replaced by 2D canvas effect |
