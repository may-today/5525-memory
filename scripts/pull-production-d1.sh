#!/usr/bin/env bash

set -euo pipefail

database_name="5525-memory-db"
local_state_dir=".wrangler/state/v3/d1"

if [[ "${1:-}" != "--confirm" || $# -ne 1 ]]; then
  cat <<'EOF'
This replaces every local D1 table with a fresh production snapshot.

Stop the local development server first, then run:
  bun run db:pull -- --confirm
EOF
  exit 1
fi

snapshot_dir="$(mktemp -d)"
snapshot_path="$snapshot_dir/production.sql"
local_state_backup_dir="${local_state_dir}.pull-backup"
backup_created=false
pull_completed=false

cleanup() {
  if [[ "$pull_completed" == false && "$backup_created" == true && -d "$local_state_backup_dir" ]]; then
    rm -rf "$local_state_dir"
    mv "$local_state_backup_dir" "$local_state_dir"
  elif [[ "$backup_created" == true ]]; then
    rm -rf "$local_state_backup_dir"
  fi
  rm -rf "$snapshot_dir"
}
trap cleanup EXIT

echo "Exporting the production D1 snapshot..."
bunx wrangler d1 export "$database_name" --remote --output "$snapshot_path" --skip-confirmation

echo "Replacing local D1 state..."
if [[ -e "$local_state_backup_dir" ]]; then
  echo "Refusing to overwrite an existing local D1 backup: $local_state_backup_dir" >&2
  exit 1
fi

if [[ -d "$local_state_dir" ]]; then
  mv "$local_state_dir" "$local_state_backup_dir"
  backup_created=true
fi

bunx wrangler d1 execute "$database_name" --local --file "$snapshot_path"
pull_completed=true

echo "Done. Local D1 now matches production."
