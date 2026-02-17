#!/usr/bin/env bash
set -euo pipefail

# Usage:
# DATABASE_URL='postgres://...' ./scripts/backup_db.sh

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

mkdir -p backups
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="backups/finbase_${STAMP}.dump"

pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file "$OUT"
echo "Backup written to $OUT"
