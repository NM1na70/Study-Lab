#!/usr/bin/env bash
set -euo pipefail

# Isolate the project, port, and named volume from the normal learner's data
project="study-smoke-${GITHUB_RUN_ID:-$$}-${GITHUB_RUN_ATTEMPT:-1}"
export APP_PORT="${SMOKE_PORT:-3301}"
export BIND_ADDRESS=127.0.0.1
compose=(docker compose -p "$project")
backup_file="$(mktemp /tmp/study-smoke-backup.XXXXXX)"

# Remove only this smoke run's backup, containers, network, and disposable learner volume on exit
cleanup() { rm -f "$backup_file"; "${compose[@]}" down --volumes --remove-orphans; }
trap cleanup EXIT

# Build the real image and wait for health before exercising its page and API
"${compose[@]}" up --build -d --wait --wait-timeout 120
base="http://127.0.0.1:$APP_PORT"

# Consume the full response so pipefail preserves curl failures as well as missing text
curl --fail --silent "$base/" | grep -F 'Study Lab' > /dev/null

# Verify supported assessments and rejected lab completion, then retain both across container recreation
node scripts/smoke-progress.mjs "$base" write
"${compose[@]}" up -d --force-recreate --wait --wait-timeout 120
node scripts/smoke-progress.mjs "$base" read

# Stream a consistent backup out of tmpfs and restore it while the test app is stopped
"${compose[@]}" exec -T app node scripts/backup.mjs /tmp/study-backup.sqlite
"${compose[@]}" exec -T app node -e 'process.stdout.write(require("node:fs").readFileSync("/tmp/study-backup.sqlite"))' > "$backup_file"
"${compose[@]}" stop app
"${compose[@]}" run --rm --no-deps -T app node scripts/restore.mjs < "$backup_file"
"${compose[@]}" up -d --wait --wait-timeout 120
node scripts/smoke-progress.mjs "$base" read

# Verify that the running application uses a non-root UID after restoration
"${compose[@]}" exec -T app node -e 'if(process.getuid() === 0) process.exit(1); console.log("Verified non-root UID",process.getuid())'
echo 'Docker health, real page, supported assessments, incomplete owner-only lab boundary, volume persistence, backup/restore and non-root UID verified.'
