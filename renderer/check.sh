#!/usr/bin/env bash
#
# check.sh — render a spec, build the delivered PDF, and report PAGE-ACCURATE
# pagination straight from the real PDF. Replaces the brittle "count /Page in the
# raw PDF bytes" method, which mixed screen-media and print-media and could not
# see where the page break actually fell.
#
# What it does, in one command:
#   1. node render.js   -> .docx / .md / .html   (honors RESUME_DENSITY)
#   2. Chrome/Chromium  -> .pdf  (the delivered artifact, from the HTML)
#   3. pdfinfo          -> authoritative page count (ground truth, not a regex)
#   4. pdftoppm         -> one PNG per ACTUAL page  (Read the last one to judge fill)
#   5. pdftotext -bbox  -> last-page fill %, with an ORPHAN-RISK flag
#
# This skill is identity- and platform-agnostic: the basename is derived from the
# spec (config.output_basename, else a slug of the name, else "resume") by parsing
# render.js's stdout, and Chrome/Chromium is detected portably across macOS, Linux,
# and WSL. Set CHROME in the environment to override detection.
#
# Usage:
#   renderer/check.sh <output-dir-or-slug>
#     renderer/check.sh output/acme-staff-engineer
#     renderer/check.sh acme-staff-engineer            # resolves under output/
#   RESUME_DENSITY=0.97 renderer/check.sh <slug>       # nudge page-fit
#   CHROME=/path/to/chrome renderer/check.sh <slug>    # override browser detection
#
# Requires: node + renderer, headless Chrome/Chromium, and (for the page-fit
# report) poppler — pdfinfo / pdftoppm / pdftotext:
#   macOS:        brew install poppler
#   Debian/Ubuntu: apt-get install poppler-utils
# Poppler is OPTIONAL: without it the PDF is still produced, but the page count and
# orphan check are skipped (open the PDF to judge pagination manually).
#
# Temp artifacts (_page-*.png) are left in the output dir for you to Read; delete
# them before delivering (they are underscore-prefixed and not part of the bundle).

set -uo pipefail

DIR="${1:?usage: check.sh <output-dir containing spec.json>}"
[ -d "$DIR" ] || DIR="output/$DIR"
SPEC="$DIR/spec.json"
[ -f "$SPEC" ] || { echo "check.sh: no spec.json in '$DIR'"; exit 1; }

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ABS="$(cd "$DIR" && pwd)"

# Portable Chrome/Chromium detection — mirrors SKILL.md step 8.
detect_chrome() {
  if [ -n "${CHROME:-}" ] && [ -x "$CHROME" ]; then echo "$CHROME"; return; fi
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/usr/bin/google-chrome" "/usr/bin/google-chrome-stable" \
    "/usr/bin/chromium" "/usr/bin/chromium-browser" \
    "/opt/google/chrome/chrome" \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"; do
    [ -x "$c" ] && { echo "$c"; return; }
  done
  for n in google-chrome google-chrome-stable chromium chromium-browser chrome; do
    command -v "$n" >/dev/null 2>&1 && { command -v "$n"; return; }
  done
}
CHROME_BIN="$(detect_chrome)"
[ -n "$CHROME_BIN" ] || { echo "check.sh: Chrome/Chromium not found — set CHROME=/path, or use the step-8 fallbacks for the PDF"; exit 1; }

# 1) render — capture stdout to derive the spec-driven basename
OUT="$(node "$SKILL_DIR/renderer/render.js" "$SPEC" "$ABS/")" || { echo "check.sh: render failed"; exit 1; }
BASE="$(printf '%s\n' "$OUT" | sed -n 's/^Wrote .*\/\([^/]*\)\.docx$/\1/p' | head -n1)"
[ -n "$BASE" ] || { echo "check.sh: could not derive basename from render output"; exit 1; }

# 2) HTML -> PDF (delivered artifact)
"$CHROME_BIN" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$ABS/$BASE.pdf" "file://$ABS/$BASE.html" 2>/dev/null

# poppler is optional — degrade gracefully if it's missing
HAVE_POPPLER=1
for tool in pdfinfo pdftoppm pdftotext; do
  command -v "$tool" >/dev/null 2>&1 || HAVE_POPPLER=0
done

echo "==================== PAGINATION ===================="
echo "Dir:            $DIR"
echo "Basename:       $BASE"
echo "Density:        ${RESUME_DENSITY:-1.0}"

if [ "$HAVE_POPPLER" -eq 0 ]; then
  echo "PDF:            $ABS/$BASE.pdf"
  echo "poppler not found — page count & orphan check skipped."
  echo "Install it (brew install poppler / apt-get install poppler-utils) for the"
  echo "page-accurate check, or open the PDF to judge pagination manually."
  echo "===================================================="
  exit 0
fi

# 3) authoritative page count
PAGES="$(pdfinfo "$ABS/$BASE.pdf" 2>/dev/null | awk '/^Pages:/{print $2}')"

# 4) per-page rasters (Read the last one to eyeball fill / orphan)
rm -f "$ABS"/_page-*.png
pdftoppm -png -r 110 "$ABS/$BASE.pdf" "$ABS/_page" >/dev/null 2>&1

# 5) last-page fill % from text bounding boxes (poppler-only, ground truth)
FILL="$(python3 "$SKILL_DIR/renderer/lastpage_fill.py" "$ABS/$BASE.pdf" 2>/dev/null || echo "?")"

echo "Pages:          ${PAGES:-?}"
echo "Last-page fill: ~${FILL}%"
if [ "${PAGES:-0}" -ge 2 ] 2>/dev/null && [[ "$FILL" =~ ^[0-9]+$ ]] && [ "$FILL" -lt 18 ]; then
  echo "!! ORPHAN ZONE: ${PAGES} pages but the last page is nearly empty (<~18% full)."
  echo "   Decide ONE direction, do not loop:"
  echo "     - clean 1 page : trim content, or RESUME_DENSITY=0.97 (tighter), re-check"
  echo "     - filled 2 pages: add on-theme content until last-page fill >= ~33%"
fi
echo "Page images:    $ABS/_page-*.png   (Read the LAST page to confirm fill / no orphan)"
echo "===================================================="
