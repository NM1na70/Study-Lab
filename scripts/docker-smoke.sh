#!/usr/bin/env bash
set -euo pipefail
# Isolate both port and named volume; never touch the normal learner's data.
project="study-smoke-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"
export APP_PORT="${SMOKE_PORT:-3301}"
export BIND_ADDRESS=127.0.0.1
compose=(docker compose -p "$project")
backup_file="$(mktemp /tmp/study-smoke-backup.XXXXXX)"
cleanup() { rm -f "$backup_file"; "${compose[@]}" down --volumes --remove-orphans; }
trap cleanup EXIT
"${compose[@]}" up --build -d --wait --wait-timeout 120
base="http://127.0.0.1:$APP_PORT"
# Consume the full response so pipefail preserves curl failures as well as missing text.
curl --fail --silent "$base/" | grep -F 'Study Lab' > /dev/null
node scripts/smoke-progress.mjs "$base" write
"${compose[@]}" up -d --force-recreate --wait --wait-timeout 120
node scripts/smoke-progress.mjs "$base" read
"${compose[@]}" exec -T app node scripts/backup.mjs /tmp/study-backup.sqlite
"${compose[@]}" exec -T app node -e 'process.stdout.write(require("node:fs").readFileSync("/tmp/study-backup.sqlite"))' > "$backup_file"
"${compose[@]}" stop app
"${compose[@]}" run --rm --no-deps -T app node scripts/restore.mjs < "$backup_file"
"${compose[@]}" up -d --wait --wait-timeout 120
node scripts/smoke-progress.mjs "$base" read
"${compose[@]}" exec -T app node -e 'if(process.getuid() === 0) process.exit(1); console.log("Verified non-root UID",process.getuid())'
echo 'Docker health, real page, complete lessons and volume persistence and backup/restore verified.'
