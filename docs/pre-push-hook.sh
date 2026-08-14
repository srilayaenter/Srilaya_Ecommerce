#!/bin/sh
# SriLaYa pre-push hook — image upload reminder
# Fires on push to staging or main only
#
# ─── HOW TO REINSTALL (after fresh git clone or on a new machine) ───
#   cp docs/pre-push-hook.sh .git/hooks/pre-push
#   chmod +x .git/hooks/pre-push
# ────────────────────────────────────────────────────────────────────
#
# Reference: SriLaYa Business Plan / 01-Technical / 02-Launch & Release
#            / SriLaYa_Product_Image_Upload_Guide.docx

REMOTE="$1"
TARGET_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Only run on staging or main pushes
if [ "$TARGET_BRANCH" != "staging" ] && [ "$TARGET_BRANCH" != "main" ]; then
  exit 0
fi

# Check if any image-related files changed vs upstream
IMAGE_CHANGES=$(git diff --name-only @{u}.. 2>/dev/null | grep -iE \
  "(image|upload|media|photo|product.*admin|admin.*product|migrate-image|public/images)" \
  | head -10)

# Also check for any new products added (which need images)
PRODUCT_CHANGES=$(git diff --name-only @{u}.. 2>/dev/null | grep -iE \
  "(seed|product|category)" \
  | head -5)

if [ -n "$IMAGE_CHANGES" ] || [ -n "$PRODUCT_CHANGES" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║          ⚠  IMAGE UPLOAD REMINDER — SriLaYa Naturals        ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║                                                              ║"
  echo "║  Image-related changes detected in this push.               ║"
  echo "║  Before this deploy goes live, confirm:                     ║"
  echo "║                                                              ║"
  echo "║  ☐  New product photos saved to:                            ║"
  echo "║     apps/web/public/images/products/{slug}.webp             ║"
  echo "║                                                              ║"
  echo "║  ☐  Images uploaded to Supabase Storage via:               ║"
  echo "║     staging admin → /admin/products → upload image          ║"
  echo "║                                                              ║"
  echo "║  ☐  Production DB image URLs updated via Supabase           ║"
  echo "║     SQL Editor (see guide for the SQL statement)            ║"
  echo "║                                                              ║"
  echo "║  ☐  Image verified on staging site before this push         ║"
  echo "║                                                              ║"
  echo "║  Full guide:                                                 ║"
  echo "║  SriLaYa Business Plan / 01-Technical / 02-Launch &        ║"
  echo "║  Release / SriLaYa_Product_Image_Upload_Guide.docx          ║"
  echo "║                                                              ║"
  if [ -n "$IMAGE_CHANGES" ]; then
    echo "║  Changed image-related files:                               ║"
    echo "$IMAGE_CHANGES" | while read -r f; do
      printf "║    %-59s║\n" "• $f"
    done
    echo "║                                                              ║"
  fi
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Have you uploaded all pending images? (y/N)                ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""

  # Read from terminal directly
  exec < /dev/tty
  read -r answer
  case "$answer" in
    [yY][eE][sS]|[yY])
      echo "✓ Confirmed — proceeding with push."
      exit 0
      ;;
    *)
      echo "✗ Push cancelled. Upload images first, then push again."
      exit 1
      ;;
  esac
else
  # No image changes — still show a brief reminder on every staging/main push
  echo ""
  echo "┌─────────────────────────────────────────────────────────────┐"
  echo "│  SriLaYa: No image-related changes detected in this push.  │"
  echo "│  If you added new products, remember to upload their        │"
  echo "│  photos to Supabase Storage before go-live.                 │"
  echo "└─────────────────────────────────────────────────────────────┘"
  echo ""
fi

exit 0
