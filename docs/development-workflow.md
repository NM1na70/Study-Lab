# Development workflow

Ordinary study needs Docker Desktop with WSL integration, Git and Docker Compose, not host Node. Development uses Linux-native Node **24.22.2**, pnpm **10.32.1**, Python 3 and Chromium for Playwright. Do not use Windows npm/pnpm from /mnt/c.

## Linux tools

This workstation has checksum-verified Node installed at `$HOME/.local/share/study-lab/node-v24.22.2-linux-x64`; pnpm is installed inside that distribution. From the repository:

```bash
source scripts/dev-env.sh
command -v node pnpm
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm hooks:install
```

On a fresh WSL installation, download the Linux x64 Node 24.22.2 tarball and SHASUMS256.txt from [nodejs.org](https://nodejs.org/dist/v24.22.2/), verify its SHA256 with `sha256sum -c`, extract it into `$HOME/.local/share/study-lab`, then prepend its bin directory to this shell's PATH and run `npm install --global pnpm@10.32.1`. No system Node, global npm config or shell profile edits are needed. For a different Linux-native installation, set STUDY_NODE_BIN before sourcing the helper.

## Work loop

Inspect Git state and applicable AGENTS.md; research official documentation; choose a narrow change; implement and validate it; review the diff; update the handover. Do not run reference-repository setup scripts or inherit its agent configuration. This project contains independently written code and configuration.

```bash
source scripts/dev-env.sh
pnpm build
pnpm dev                 # API/static app: http://127.0.0.1:3000
# Optional second terminal, after sourcing scripts/dev-env.sh:
pnpm dev:client          # Vite UI/HMR: http://127.0.0.1:5173
```

Vite proxies /api while preserving the incoming Host header, so its UI can use the same-origin write guard. Production/browser acceptance checks use the built assets. Do not disable the server's origin guard for convenience. The API defaults to a Git-ignored data/study.sqlite; the Docker learner has its own named volume.

```bash
pnpm check
pnpm build
pnpm exec playwright install --with-deps chromium
pnpm test:browser
pnpm docker:smoke
pnpm security:audit
pnpm security:secrets
pnpm security:container
```

`pnpm check` runs format check, lint, both TypeScript checks, lesson/PCAP validation, backend tests and UI tests. Browser tests exercise both complete lessons, refresh/resume, mistakes, self-review, hints/solutions, external-request blocking, responsive viewports and axe accessibility. HTTP integration tests reopen SQLite. Docker smoke uses its own named volume/port, completes both lessons, recreates the container and verifies persisted state and UID. Its EXIT trap deletes **only its own test resources**.

On this WSL host, Playwright's missing libnspr4/libnss3/libasound2 dependencies were extracted from Ubuntu packages to a user directory because sudo requires a password. For this installation only:

```bash
export LD_LIBRARY_PATH="$HOME/.local/share/study-lab/browser-libs/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
pnpm test:browser
```

CI installs browser OS dependencies using Playwright's supported `--with-deps` option. Do not assume this host-specific workaround is needed elsewhere.

## Commits, PRs and checks

The repository-local hooks path is `.githooks`. Shell launchers restore the project Linux tool path, then invoke installed/versioned lefthook. `pre-commit` runs pnpm check; commit-msg validates the whole subject, including `feat!: ...` and `feat(scope)!: ...`. Tests cover valid/invalid subjects. Hooks need installed dependencies and the Linux Node path; required CI quality checks also enforce validation if hooks are absent or bypassed.

```bash
git switch -c codex/your-change
# Implement, test and review.
git diff --check
git add <reviewed-paths>
git commit -m "feat(study): describe the learner-visible change"
git push -u origin codex/your-change
# Open a PR targeting main with a Conventional Commit title.
```

Push/open/merge commands are owner actions, not performed by the initial build. CI runs on every branch push, PRs into main and manual dispatch. Squash merge after passing checks; the PR title becomes the conventional commit subject. For a solo maintainer, configure main's ruleset to require PRs and checks but zero other-person approvals. Add the actual check names after Actions has run: Lint & Typecheck, Backend Unit Tests, Frontend Tests, Integration / Browser Tests, Build & Docker Smoke Test, Dependency Security Scan, Secret Detection, Container Security Scan, Code Analysis, and Conventional PR Title for PRs. Consider avoiding duplicate required contexts from push/PR events when selecting checks. No remote protection has been configured here.

PR title is passed through an environment variable, never interpolated into shell code. Workflows use pull_request, not pull_request_target. Hosted CI remains unverified until pushed and completed. See security.md for scanner failure thresholds.
