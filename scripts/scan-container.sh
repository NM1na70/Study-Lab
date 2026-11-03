#!/usr/bin/env bash
set -euo pipefail

# Keep scanner output separate from source and allow an explicit image name
mkdir -p reports
image="${1:-study-lab:local}"

# Export the image without exposing the Docker socket and remove the archive on exit
docker save -o reports/study-image.tar "$image"
trap 'rm -f reports/study-image.tar' EXIT

# Use the installed scanner or a versioned Docker fallback and fail on HIGH or CRITICAL findings
if command -v trivy >/dev/null; then
  trivy image --input reports/study-image.tar --quiet --scanners vuln --severity HIGH,CRITICAL --exit-code 1 --format json --output reports/trivy.json
else
  docker run --rm -v "$PWD/reports:/reports" -v study-lab-trivy-cache:/root/.cache/trivy aquasec/trivy:0.76.1 image --input /reports/study-image.tar --quiet --scanners vuln --severity HIGH,CRITICAL --exit-code 1 --format json --output /reports/trivy.json
fi
