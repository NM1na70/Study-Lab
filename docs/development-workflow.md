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

## **Coordinated Node Updates**

Study Lab stays on Node **24.22.2** for this maintenance baseline — `package.json` pins that exact release and `.npmrc` keeps `engine-strict=true`

Dependabot ignores `node` Docker versions `>=25` using the [documented Docker ignore range syntax](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#versions-ignore) — npm packages, GitHub Actions and other Docker dependencies keep their existing update policies

Node 24 Docker updates can still be proposed, but an image-only PR is not ready to merge — even a Node 24 patch release fails the exact engine check until the remaining pins are updated in the same change

| Update together                              | Required action                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` → `engines.node`              | Set the selected exact Node 24 release, rather than widening the allowed engine range                                                                         |
| `.node-version`                              | Use the identical exact version for local tools and CI                                                                                                        |
| Both Dockerfile `FROM node:` lines           | Use the same version in the `bookworm-slim` build stage and the `alpine` runtime stage                                                                        |
| Local Linux Node installation                | Install the checksum-verified selected release and confirm `node --version` after sourcing `scripts/dev-env.sh`                                               |
| `.github/workflows/ci.yml`                   | Keep every Node setup step reading `.node-version` and update any future independent exact reference                                                          |
| Current setup and architecture documentation | Update the Node download URL, user tool directory, version table and other current exact-version examples — keep dated historical verification records intact |

Review Node release/security notes and image availability before choosing a newer Node 24 release — review compatible Node type definitions and pnpm separately instead of changing unrelated dependencies automatically

Keep pnpm's package-manager pin consistent between package.json, Docker and CI if it needs a separate update — never bypass engine validation to make a Node image proposal pass

Use `rg -n --hidden '24\.22\.2|FROM node:|node-version|engine-strict' package.json .node-version .npmrc Dockerfile .github scripts/dev-env.sh README.md docs` from the repository root to review the current references before changing the version

After coordinating the files, use the selected local Node and run frozen installation, `pnpm check`, `pnpm build`, `pnpm test:browser`, the isolated `pnpm docker:smoke` and `pnpm security:container` against the freshly built image — confirm the non-root runtime's Node version during Docker validation and record any unavailable checks

An upgrade beyond Node 24 is a separate compatibility decision that must also deliberately revise the Dependabot limit — the limit is not permission to ignore security fixes within Node 24

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

## Code comments during development

Check the root AGENTS.md “Code comment style” section whenever creating or changing code. Explain the purpose of each main logical block in simple English, using one comment for a related group. Start with a capital letter, use normal sentence case, preserve correct names/acronyms (including React, TypeScript, GitHub, API, SQLite, AFP and CommBank), and omit the final full stop. Put one blank line before a new main block's comment except at file start or where syntax requires otherwise, keep it directly above the code, and keep consecutive lines for the same explanation together.

Use TaskCard.tsx as the grouping reference. For example, a single comment can cover all related imports:

```tsx
// Import React hooks, task types, and default task progress
```

Likewise, group related state and refs under one purpose comment:

```tsx
// Track the answer, unsaved edits, review confirmation, pending actions, and autosave references
```

A short internal comment should explain a non-obvious safeguard when the main block description is insufficient:

```tsx
// Clear unsaved status only if this card is mounted and the saved answer is still current
```

Describe what the current code actually does and why a safeguard exists. Avoid vague headings and per-line narration. Improve existing useful comments instead of duplicating them, and update nearby comments whenever behaviour changes. Inside JSX use `{/* Explanatory comment */}`; in CSS use block comments, and use the native comment syntax for scripts and operational configuration. Do not force a comment into every tiny file or obvious statement.

Preserve shebangs, licence notices, directives, tool annotations, URLs and other machine-sensitive text. Do not comment strict JSON, lockfiles, generated files, dependencies, build output, reports or binary/evidence data. Existing Python docstrings are strings, so keep them intact during a comments-only change. No comment-count checker or new tool is required.

For non-commentable configuration, package.json holds scripts, dependency versions and Node/pnpm requirements; tsconfig.json and tsconfig.server.json control strict client/test and server compilation; .prettierrc.json controls formatting; .node-version supplies the exact Node release; and pnpm-lock.yaml freezes dependency resolution. Explain important choices here rather than inserting invalid comments into those files.

For a comments-only review, preserve strings, identifiers, exports, execution order, JSX text/whitespace, CSS values and shell continuations. Review the full diff for executable changes, run pnpm check and the production build, and validate changed shell/configuration files with existing checks. Use the isolated Docker smoke when operational comments warrant verification. Record actual results and any unavailable checks in the handover; leave unrelated functional findings for a separate change.

## Testing Changes To Learning Controls

Use the temporary SQLite fixtures for migrations and browser tests — never point a test or preview at normal learner data

Answer shapes are shared across content, domain validation, API drafts, autosave and review — changing a task's objective or grading requires a content version and deliberate migration, including old assistance and completion history

For short-answer keyboard changes, test keydown, keyup, held repeats and composition events as well as clicks — use real browser tests for native button activation, dialog focus trapping and Escape

After changing question types, update the real API smoke helper and independent PCAP assertions as well as unit tests — restore must accept all supported backup schemas without bypassing integrity checks
