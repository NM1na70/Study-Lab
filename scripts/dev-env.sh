#!/usr/bin/env bash
# Source from the repository root; changes only this shell's environment.
study_node_version="$(cat .node-version)"
study_node_bin="${STUDY_NODE_BIN:-$HOME/.local/share/study-lab/node-v${study_node_version}-linux-x64/bin}"
if [ -x "$study_node_bin/node" ]; then
  export PATH="$study_node_bin:$PATH"
fi
if ! command -v node >/dev/null || ! command -v pnpm >/dev/null; then
  echo 'Linux Node/pnpm missing. See docs/development-workflow.md.' >&2
  return 1 2>/dev/null || exit 1
fi
case "$(command -v node) $(command -v pnpm)" in
  *'/mnt/c/'*) echo 'Use Linux-native Node/pnpm in WSL.' >&2; return 1 2>/dev/null || exit 1 ;;
esac
