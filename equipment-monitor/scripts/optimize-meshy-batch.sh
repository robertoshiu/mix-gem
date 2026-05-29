#!/usr/bin/env bash
# optimize-meshy-batch.sh
# One-shot optimizer for the raw Meshy_AI_* equipment GLB downloads.
# Maps each raw download to a clean semantic filename and runs the proven
# gltf-transform profile (Draco geometry + WebP textures + 1024 cap + simplify).
# Babylon.js loads Draco + WebP natively (no extra transcoder files needed).
#
# Raw downloads are huge (24 MB – 484 MB) and cannot ship to GitHub Pages
# (100 MB/file hard limit). This crushes them to web budget (~1–10 MB each).
#
# Usage: ./scripts/optimize-meshy-batch.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
EQ_DIR="$PROJECT_DIR/public/models/equipment"
BIN="$PROJECT_DIR/node_modules/.bin/gltf-transform"
export NODE_OPTIONS=--max-old-space-size=8192

# Format: RAW_FILENAME|DEST_FILENAME  (DEST relative to equipment/)
# The two huge redundant plasma duplicates (0529090224 484MB, 0529091814 359MB)
# are intentionally skipped — plasma_etcher + etch_chamber_hero + plasma_reactor
# already cover the etch/plasma category.
MAP=(
  "Meshy_AI_A_large_modular_semic_0529090425_texture.glb|cluster_tool.glb"
  "Meshy_AI_A_large_modular_semic_0529090508_texture.glb|cluster_tool_b.glb"
  "Meshy_AI_A_large_semiconductor_0529084208_texture.glb|process_bay.glb"
  "Meshy_AI_A_plasma_etching_syst_0529080510_texture.glb|plasma_etcher.glb"
  "Meshy_AI_A_plasma_etching_syst_0529090256_texture.glb|etch_chamber_hero.glb"
  "Meshy_AI_A_semiconductor_CMP_c_0529081052_texture.glb|cmp_polisher.glb"
  "Meshy_AI_A_semiconductor_coppe_0529080937_texture.glb|cu_electroplating.glb"
  "Meshy_AI_A_semiconductor_thin__0529090351_texture.glb|thinfilm_cvd.glb"
  "Meshy_AI_A_tall_cylindrical_ve_0529091254_texture.glb|stirred_reactor.glb"
  "Meshy_AI_A_vertical_semiconduc_0529081127_texture.glb|diffusion_furnace.glb"
  "Meshy_AI_Blue_Beam_Through_a_L_0529084047_texture.glb|litho_optics.glb"
  "Meshy_AI_Blue_Liquid_Processin_0529080749_texture.glb|wet_bench.glb"
  "Meshy_AI_Copper_Vacuum_Chamber_0529080553_texture.glb|vacuum_chamber.glb"
  "Meshy_AI_Cryostat_in_Operation_0529090531_texture.glb|cryo_implanter.glb"
  "Meshy_AI_Glowing_Industrial_Re_0529081114_texture.glb|plasma_reactor.glb"
  "Meshy_AI_Industrial_Automation_0529094959_texture.glb|automation_cell.glb"
  "Meshy_AI_Nikon_NSR_Series_Lith_0529094827_texture.glb|litho_scanner.glb"
  "Meshy_AI_Semiconductor_wafer_p_0529084131_texture.glb|wafer_processor.glb"
  "Meshy_AI_The_Discovery_Engine_0529084725_texture.glb|discovery_engine.glb"
)

mb() { awk "BEGIN{printf \"%.2f\", $(stat -c%s "$1" 2>/dev/null || echo 0)/1048576}"; }

done_n=0; skip_n=0; fail_n=0; total_out=0
for entry in "${MAP[@]}"; do
  IFS='|' read -r raw dest <<< "$entry"
  src="$EQ_DIR/$raw"
  out="$EQ_DIR/$dest"

  if [ -f "$out" ]; then
    echo "[skip] $dest already exists ($(mb "$out") MB)"
    total_out=$((total_out + $(stat -c%s "$out")))
    ((skip_n++)); continue
  fi
  if [ ! -f "$src" ]; then
    echo "[FAIL] raw missing: $raw"
    ((fail_n++)); continue
  fi

  echo "[opt ] $raw ($(mb "$src") MB) -> $dest ..."
  if "$BIN" optimize "$src" "$out" --compress draco --texture-compress webp --texture-size 1024 >/dev/null 2>&1; then
    echo "       -> $dest ($(mb "$out") MB)"
    total_out=$((total_out + $(stat -c%s "$out")))
    ((done_n++))
  else
    echo "[FAIL] gltf-transform failed for $raw"
    rm -f "$out"
    ((fail_n++))
  fi
done

echo ""
echo "=== batch complete: $done_n optimized, $skip_n skipped, $fail_n failed ==="
echo "=== total optimized payload: $(awk "BEGIN{printf \"%.1f\", $total_out/1048576}") MB ==="
