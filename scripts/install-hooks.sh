#!/usr/bin/env bash
set -euo pipefail
# Repository-local configuration only; launchers restore the Linux tool path for WSL Git.
git config --local core.hooksPath .githooks
echo 'Installed repository hooks (.githooks → versioned lefthook).'
