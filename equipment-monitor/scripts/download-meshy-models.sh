#!/usr/bin/env bash
# download-meshy-models.sh
# Post-download pipeline for Meshy community library GLB models.
#
# Meshy community models require browser-side decryption — they cannot
# be downloaded via curl/wget. This script handles:
#   1. Opening model pages in the browser for manual download
#   2. Moving downloaded GLBs from ~/Downloads to the correct directories
#   3. Optimizing with gltf-transform (Draco compression + texture resize)
#   4. Verifying file sizes against budget
#
# Usage:
#   ./scripts/download-meshy-models.sh [open|move|optimize|verify|all]
#
# Prerequisites:
#   npm install -g @gltf-transform/cli

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MODELS_DIR="$PROJECT_DIR/public/models"
DOWNLOAD_DIR="${MESHY_DOWNLOAD_DIR:-/mnt/c/Users/quito/Downloads}"

# ---- Model Registry ----
# Format: MESHY_SLUG | TARGET_PATH | MAX_SIZE_MB | DESCRIPTION
declare -a MODELS=(
  # P1 — Equipment
  "Large-industrial-optical-imaging-system-v2-019e1ed4-491a-7bfb-a59d-4eb643021449|equipment/lithography.glb|4|Lithography scanner (optical imaging system)"
  "Industrial-Vacuum-Chamber-Machine-v2-0197f29a-ff26-7d5b-bab4-b3f5058bfbe3|equipment/etch_chamber.glb|5|Etch/CVD vacuum chamber"
  # P2 — Infrastructure
  "A-Stirred-Tank-Reactor-STR-is-a-type-of-chemical-reactor-commonly-used-in-laboratories-and-industrial-settings-to-mix-and-process-fluids-It-consists-of-a-cylindrical-vessel-equipped-with-an-agitator-usually-a-rotating-impeller-driven-by-an-electric-motor-typically-mounted-on-top-of-the-reactor-v2-01988114-762f-7601-a9a2-7fe1efb29737|infrastructure/scrubber.glb|3|Exhaust scrubber (stirred tank reactor)"
  "Industrial-Swtichgear-v2-019616e9-8a04-73b4-a17d-5e3e406c7a31|infrastructure/pdu.glb|3|PDU / electrical switchgear"
  "Ceiling-Diffuser-Round-v2-0199760d-f668-7831-a0a3-718d940f3555|infrastructure/ffu.glb|1|FFU ceiling unit (round diffuser)"
  "Triple-Gas-Cylinder-Manifold-v2-019e2ac5-991a-7cd0-bfb3-1795e9fd5fda|infrastructure/gas_cabinet.glb|2|Gas cylinder cabinet/manifold"
  # P3 — Specialized
  "Industrial-microscope-with-control-console-v2-019c65db-a289-7230-98bf-ce7113c7bb58|equipment/metrology.glb|3|CD-SEM metrology (microscope + console)"
  "Smart-Factory-Automation-v2-019e36a2-b68d-789b-aea5-cf0068ff7f5b|equipment/efem.glb|3|EFEM loader (factory automation)"
)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[meshy]${NC} $*"; }
ok()   { echo -e "${GREEN}  [OK]${NC} $*"; }
warn() { echo -e "${YELLOW}  [WARN]${NC} $*"; }
fail() { echo -e "${RED}  [FAIL]${NC} $*"; }

# ---- Commands ----

cmd_open() {
  log "Opening Meshy model pages in browser..."
  log "For each page: click Download > GLB format"
  log "Files will go to: $DOWNLOAD_DIR"
  echo ""

  for entry in "${MODELS[@]}"; do
    IFS='|' read -r slug target max_mb desc <<< "$entry"
    local url="https://www.meshy.ai/3d-models/$slug"
    echo -e "  ${CYAN}$desc${NC}"
    echo "  $url"
    echo ""

    # Try to open in browser (works on Linux/WSL/macOS)
    if command -v xdg-open &>/dev/null; then
      xdg-open "$url" 2>/dev/null || true
    elif command -v open &>/dev/null; then
      open "$url" 2>/dev/null || true
    elif command -v explorer.exe &>/dev/null; then
      explorer.exe "$url" 2>/dev/null || true
    fi
    sleep 2
  done

  echo ""
  log "All ${#MODELS[@]} pages opened."
  log "After downloading all GLBs, run: $0 move"
}

cmd_move() {
  log "Moving downloaded GLBs from $DOWNLOAD_DIR to $MODELS_DIR..."

  # Ensure target directories exist
  mkdir -p "$MODELS_DIR/equipment" "$MODELS_DIR/infrastructure"

  local moved=0
  local missing=0

  for entry in "${MODELS[@]}"; do
    IFS='|' read -r slug target max_mb desc <<< "$entry"

    # Extract the model name from the slug for fuzzy matching
    local model_name
    model_name=$(echo "$slug" | sed 's/-v2-[0-9a-f-]*$//')

    local target_path="$MODELS_DIR/$target"
    local found=""

    # Meshy downloads as: Meshy_AI_<Title_Words>_<timestamp>_texture.glb
    # Convert slug to search pattern: first 2-3 words underscored
    local search_key
    search_key=$(echo "$model_name" | cut -d'-' -f1-3 | tr '-' '_')

    for f in "$DOWNLOAD_DIR"/Meshy_AI_*.glb; do
      [ -f "$f" ] || continue
      local basename
      basename=$(basename "$f" .glb)
      if echo "$basename" | grep -qi "$search_key" 2>/dev/null; then
        found="$f"
        break
      fi
    done

    # Fallback: also check for exact slug or any GLB with matching words
    if [ -z "$found" ]; then
      for f in "$DOWNLOAD_DIR"/*.glb; do
        [ -f "$f" ] || continue
        local basename
        basename=$(basename "$f" .glb)
        local first_word
        first_word=$(echo "$model_name" | cut -d'-' -f1-2)
        if echo "$basename" | grep -qi "$first_word" 2>/dev/null; then
          found="$f"
          break
        fi
      done
    fi

    if [ -n "$found" ]; then
      cp "$found" "$target_path"
      local size
      size=$(du -h "$target_path" | cut -f1)
      ok "$desc -> $target ($size)"
      ((moved++))
    else
      fail "$desc — not found in $DOWNLOAD_DIR"
      warn "  Expected slug: $model_name"
      ((missing++))
    fi
  done

  echo ""
  log "Moved: $moved, Missing: $missing"
  if [ "$missing" -gt 0 ]; then
    log "For missing models, manually place GLBs at:"
    for entry in "${MODELS[@]}"; do
      IFS='|' read -r slug target max_mb desc <<< "$entry"
      local target_path="$MODELS_DIR/$target"
      [ -f "$target_path" ] || warn "  $target_path"
    done
  fi
  [ "$moved" -gt 0 ] && log "Next: $0 optimize"
}

cmd_optimize() {
  log "Optimizing GLBs with gltf-transform..."

  if ! command -v gltf-transform &>/dev/null; then
    fail "gltf-transform not found. Install: npm install -g @gltf-transform/cli"
    exit 1
  fi

  for entry in "${MODELS[@]}"; do
    IFS='|' read -r slug target max_mb desc <<< "$entry"
    local target_path="$MODELS_DIR/$target"
    [ -f "$target_path" ] || continue

    local size_before
    size_before=$(stat -c%s "$target_path" 2>/dev/null || stat -f%z "$target_path" 2>/dev/null)
    local mb_before
    mb_before=$(echo "scale=1; $size_before / 1048576" | bc)

    log "Optimizing $target ($mb_before MB -> target ${max_mb} MB)..."

    local tmp_path="${target_path}.tmp"

    # Draco compression + texture resize
    gltf-transform optimize "$target_path" "$tmp_path" \
      --compress draco \
      --texture-size 1024 \
      2>/dev/null || {
        warn "  gltf-transform optimize failed, trying simpler pipeline..."
        # Fallback: just draco compress
        gltf-transform draco "$target_path" "$tmp_path" 2>/dev/null || {
          fail "  Could not optimize $target"
          rm -f "$tmp_path"
          continue
        }
      }

    if [ -f "$tmp_path" ]; then
      mv "$tmp_path" "$target_path"
      local size_after
      size_after=$(stat -c%s "$target_path" 2>/dev/null || stat -f%z "$target_path" 2>/dev/null)
      local mb_after
      mb_after=$(echo "scale=1; $size_after / 1048576" | bc)
      local max_bytes=$((max_mb * 1048576))

      if [ "$size_after" -le "$max_bytes" ]; then
        ok "$target: $mb_before MB -> $mb_after MB (budget: ${max_mb} MB)"
      else
        warn "$target: $mb_before MB -> $mb_after MB (OVER budget: ${max_mb} MB)"
        warn "  Consider further decimation or texture downscaling"
      fi
    fi
  done

  echo ""
  log "Next: $0 verify"
}

cmd_verify() {
  log "Verifying all model files..."

  local total_size=0
  local all_ok=true

  # Check new models
  echo ""
  echo "  New Meshy models:"
  for entry in "${MODELS[@]}"; do
    IFS='|' read -r slug target max_mb desc <<< "$entry"
    local target_path="$MODELS_DIR/$target"

    if [ -f "$target_path" ]; then
      local size
      size=$(stat -c%s "$target_path" 2>/dev/null || stat -f%z "$target_path" 2>/dev/null)
      local mb
      mb=$(echo "scale=1; $size / 1048576" | bc)
      total_size=$((total_size + size))
      local max_bytes=$((max_mb * 1048576))

      if [ "$size" -le "$max_bytes" ]; then
        ok "$target — $mb MB (budget: ${max_mb} MB)"
      else
        warn "$target — $mb MB (OVER budget: ${max_mb} MB)"
        all_ok=false
      fi
    else
      fail "$target — MISSING"
      all_ok=false
    fi
  done

  # Check existing models that aren't being replaced
  echo ""
  echo "  Existing models (kept):"
  for f in "$MODELS_DIR"/equipment/spin_coater.glb "$MODELS_DIR"/equipment/robot_arm.glb "$MODELS_DIR"/equipment/wafer_cassette.glb; do
    if [ -f "$f" ]; then
      local size
      size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f" 2>/dev/null)
      local mb
      mb=$(echo "scale=1; $size / 1048576" | bc)
      total_size=$((total_size + size))
      ok "$(basename "$f") — $mb MB"
    fi
  done

  echo ""
  local total_mb
  total_mb=$(echo "scale=1; $total_size / 1048576" | bc)
  if [ "$(echo "$total_mb < 80" | bc)" -eq 1 ]; then
    ok "Total: $total_mb MB (budget: 80 MB)"
  else
    warn "Total: $total_mb MB (OVER budget: 80 MB)"
    all_ok=false
  fi

  $all_ok && ok "All checks passed!" || warn "Some issues need attention."
}

cmd_all() {
  cmd_open
  echo ""
  echo "========================================="
  log "Download all models from the browser, then press Enter to continue..."
  read -r
  cmd_move
  cmd_optimize
  cmd_verify
}

# ---- Main ----
case "${1:-help}" in
  open)     cmd_open ;;
  move)     cmd_move ;;
  optimize) cmd_optimize ;;
  verify)   cmd_verify ;;
  all)      cmd_all ;;
  *)
    echo "Usage: $0 [open|move|optimize|verify|all]"
    echo ""
    echo "  open     — Open all Meshy model pages in browser for manual download"
    echo "  move     — Move downloaded GLBs from ~/Downloads to public/models/"
    echo "  optimize — Compress GLBs with gltf-transform (Draco + texture resize)"
    echo "  verify   — Check all models exist and are within size budget"
    echo "  all      — Run full pipeline (open -> wait -> move -> optimize -> verify)"
    echo ""
    echo "Models (${#MODELS[@]} total):"
    for entry in "${MODELS[@]}"; do
      IFS='|' read -r slug target max_mb desc <<< "$entry"
      echo "  $target ($desc, budget: ${max_mb} MB)"
    done
    ;;
esac
