#!/usr/bin/env bash
set -euo pipefail
mkdir -p reports
# Native scanner in CI; Docker fallback for WSL. Full working tree, including new files.
if command -v gitleaks >/dev/null; then
  gitleaks dir . --redact --report-format json --report-path reports/gitleaks.json
else
  docker run --rm -v "$PWD:/scan:ro" -v "$PWD/reports:/reports" zricethezav/gitleaks:v8.30.1 dir /scan --redact --report-format json --report-path /reports/gitleaks.json
fi
