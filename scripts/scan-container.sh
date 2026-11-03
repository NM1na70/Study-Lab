#!/usr/bin/env bash
set -euo pipefail
mkdir -p reports
image="${1:-study-lab:local}"
# No Docker socket mount: give the scanner an exported image archive.
docker save -o reports/study-image.tar "$image"
trap 'rm -f reports/study-image.tar' EXIT
if command -v trivy >/dev/null; then
  trivy image --input reports/study-image.tar --quiet --scanners vuln --severity HIGH,CRITICAL --exit-code 1 --format json --output reports/trivy.json
else
  docker run --rm -v "$PWD/reports:/reports" -v study-lab-trivy-cache:/root/.cache/trivy aquasec/trivy:0.76.1 image --input /reports/study-image.tar --quiet --scanners vuln --severity HIGH,CRITICAL --exit-code 1 --format json --output /reports/trivy.json
fi
