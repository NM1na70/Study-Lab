#!/usr/bin/env bash
set -euo pipefail
mkdir -p reports

# Scan the working tree, including new files, using native Gitleaks or the versioned Docker fallback
# Redact findings in the report without suppressing the scanner's failure status
if command -v gitleaks >/dev/null; then
  gitleaks dir . --redact --report-format json --report-path reports/gitleaks.json
else
  docker run --rm -v "$PWD:/scan:ro" -v "$PWD/reports:/reports" zricethezav/gitleaks:v8.30.1 dir /scan --redact --report-format json --report-path /reports/gitleaks.json
fi
