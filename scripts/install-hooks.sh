#!/usr/bin/env bash
set -euo pipefail

# Install only this repository's hooks path so WSL launchers can restore the Linux tool path
git config --local core.hooksPath .githooks
echo 'Installed repository hooks (.githooks → versioned lefthook).'
