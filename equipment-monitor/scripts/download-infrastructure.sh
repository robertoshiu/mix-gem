#!/usr/bin/env bash
# Download 6 infrastructure GLB assets from Sketchfab (CC-BY licensed).
# Requires: SKETCHFAB_TOKEN env var (get one at https://sketchfab.com/settings/password)
#
# Usage:
#   export SKETCHFAB_TOKEN=your_token_here
#   bash scripts/download-infrastructure.sh

set -euo pipefail

if [ -z "${SKETCHFAB_TOKEN:-}" ]; then
  echo "ERROR: SKETCHFAB_TOKEN env var not set."
  echo "Get a token at: https://sketchfab.com/settings/password"
  exit 1
fi

API="https://api.sketchfab.com/v3"
OUT_DIR="public/models/infrastructure"
mkdir -p "$OUT_DIR"

# Asset definitions: name | sketchfab_uid | output_filename
ASSETS=(
  "Electrical Control Panel sci-fi|c0dfab99f2c34b4aa76e895362608677|pdu.glb"
  "Gas Tank|fcff049c431041a4889b836be5e93c93|gas_cabinet.glb"
  "Chemical tank|63c001e74ff5402fbcf1338479c9c0c5|scrubber.glb"
  "Pressure_vessel_HE|c4c75717bcc743ce8bb08a0aa0abe52e|chiller.glb"
  "Low-Poly Conveyor for SCADA & HMI|fe72a89566b04b45b79d3e9297a6a5cf|amhs_carrier.glb"
  "Ventilation Shafts (Low Poly)|03f7eed39e654ad0a8d107d239c80e28|ffu.glb"
)

download_model() {
  local name="$1" uid="$2" filename="$3"
  local target="$OUT_DIR/$filename"

  if [ -f "$target" ]; then
    echo "SKIP: $filename already exists"
    return 0
  fi

  echo "Downloading: $name ($uid) -> $filename"

  # Request download URL from Sketchfab API
  local dl_json
  dl_json=$(curl -sf -H "Authorization: Token $SKETCHFAB_TOKEN" "$API/models/$uid/download")
  if [ $? -ne 0 ]; then
    echo "  WARN: Download request failed for $name (may not be downloadable)"
    return 1
  fi

  # Try GLB first, then GLTF
  local url
  url=$(echo "$dl_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print((d.get('glb') or d.get('gltf',{})).get('url',''))" 2>/dev/null)

  if [ -z "$url" ]; then
    echo "  WARN: No GLB/GLTF download URL for $name"
    return 1
  fi

  # Download the file
  curl -sfL -o "$target" "$url"
  local size
  size=$(stat -c%s "$target" 2>/dev/null || stat -f%z "$target" 2>/dev/null || echo "?")
  echo "  OK: $filename ($size bytes)"
}

echo "=== Infrastructure GLB Asset Download ==="
echo "Output: $OUT_DIR/"
echo ""

success=0
failed=0
for entry in "${ASSETS[@]}"; do
  IFS='|' read -r name uid filename <<< "$entry"
  if download_model "$name" "$uid" "$filename"; then
    ((success++))
  else
    ((failed++))
  fi
done

echo ""
echo "Done: $success downloaded, $failed failed"
echo ""
echo "Attribution (CC-BY 4.0) — add to credits:"
for entry in "${ASSETS[@]}"; do
  IFS='|' read -r name uid filename <<< "$entry"
  echo "  $filename: \"$name\" — https://sketchfab.com/3d-models/$uid"
done
