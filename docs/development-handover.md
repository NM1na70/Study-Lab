# Development handover — 3 November 2026

Branch: `codex/milestone-1-study-core`. Base: original main containing README.md. README preserved byte-for-byte. Local original implementation only; no push, commit, merge, publication or remote configuration changes. Intent-to-add makes new files visible in the unstaged Git diff; this note is not a restorable code backup.

Implemented Milestone 1: React/Fastify/SQLite, two sourced complete lessons, synthetic PCAP and independently checked evidence, autosaved/resumable progress, checked-attempt history, explicit writing self-review, hint/solution tracking, completion rules, mistake retry, responsive UI and local assets. Added Node/pnpm pins, strict validation, non-root persistent Compose runtime, real backup/restore tools, tests, local WSL hooks, pinned Actions checks, scanners, dependency updates, PR template, engineering/content/operations docs and a bounded roadmap.

Actual checks: frozen install; format/lint/types/content/parser; 6 backend/domain/commit tests; 4 UI tests; 4 desktop/mobile browser flows; production build; Docker health/recreate/persistence/UID and backup/restore; actionlint; Compose config; hook acceptance/rejection/clean-PATH launch; Gitleaks; Trivy HIGH/CRITICAL; Git whitespace/README preservation. See verification.md for evidence, corrected failed approaches and limitations. Dependency audit succeeds at HIGH/CRITICAL but reports two MODERATE upstream advisories. No suppressions/overrides. Hosted CI/CodeQL and physical phone/LAN connectivity remain unverified.

Linux tool setup: source scripts/dev-env.sh. Local Playwright additionally uses the user-scoped LD_LIBRARY_PATH documented in development-workflow.md. Default Docker app is at http://localhost:3000 with its normal named volume, separate from every smoke-test volume. Test resources are cleaned up; generated reports/backups/DBs are ignored.

Exact next owner action: open http://localhost:3000, perform the five-minute walkthrough in operations.md and inspect `git diff`. If satisfied, stage reviewed files, commit with `feat(study): implement local milestone one learning core`, push this feature branch and open a PR into main. Wait for actual hosted checks before squash merging. Do the manual phone/LAN check separately; main protection is a later owner setting after check contexts exist.

Next implementation milestone: explicit content migration policy, small spaced-repetition scheduler and versioned lesson packs, following docs/roadmap.md. No AI or additional placeholder lessons are installed.

## CI smoke portability fix — 3 November 2026

On the existing `codex/milestone-1-study-core` branch, replaced the smoke HTML assertion's `rg -q` with standard `grep -F` and redirected its output. The assertion still requires “Study Lab”; grep consumes the response fully so `set -o pipefail` also preserves curl failures. Inspected the Build & Docker Smoke Test job: it already invokes `pnpm build && pnpm docker:smoke`, so no workflow installation or assertion change is needed.

Validation for this fix: Bash syntax; matching/missing-response-text and upstream-failure checks; `pnpm check` (6 backend and 4 frontend tests); production build; all 4 desktop/mobile browser tests; and the complete isolated Docker smoke (health, HTML, completion, recreation/persistence, non-root UID, backup/restore and cleanup) passed. Read-only before/after fingerprints confirmed normal learner progress and its running container were unchanged. No new security scan was needed for the standard-command substitution; dependency/scanner configuration is unchanged. Hosted Actions rerun remains pending. No commit or push was performed for this fix.

Suggested commit: `fix(ci): remove ripgrep dependency from Docker smoke test`. Next owner action: review the two-file diff, commit when satisfied and push to rerun Actions.

## First-party comment review — 4 November 2026

PR #1 was confirmed merged into main before branch selection. The working tree was clean; `codex/code-comments` starts from updated `origin/main` at `6da056a`, so this change has no dependency on an open Milestone 1 PR. No commit, push, merge, publication or remote-setting change was performed.

Reviewed the tracked first-party inventory and added grouped purpose/safeguard comments across frontend, API/storage, shared rules/schemas, tests, CSS, scripts and comment-capable operational configuration. TaskCard follows the owner's supplied examples. Root AGENTS.md now contains “Code comment style”; development-workflow.md provides the grouped import/state/ref/internal-guard examples, exclusions and the requirement to keep comments accurate as behaviour changes. No fix.tsx, new dependency, behaviour test or persistent comment checker was created.

Temporary comparisons against the branch base confirmed equal TypeScript/JavaScript source structure and emitted JavaScript (including rendered JSX text), equal Python syntax trees/docstrings, unchanged CSS values/HTML content, and unchanged non-comment shell/configuration lines. Lesson JSON, strict JSON configuration, lockfile, generated evidence, PCAP, original README, compiler directives, tool annotations and executable modes were preserved. Changes are comments/spacing and the required development guidance only; no learner data was changed.

Actual validation: `pnpm check` passed formatting, lint, both typechecks, content/PCAP validation, 6 backend tests and 4 frontend tests. Production build and all 4 desktop/mobile browser tests passed. Shell/hook and Python syntax, actionlint, Compose config and Git whitespace checks passed. No unrelated functional issue was confirmed or fixed.

Docker smoke was attempted with its isolated project but could not start because `/var/run/docker.sock` is unavailable in this WSL session. The attempt reached no running containers or learner volumes; read-only normal-profile fingerprinting was also unavailable for the same reason, so no before/after data comparison is claimed. Container/security scans and hosted CI were not rerun for this comments-only task. Existing temporary-database tests passed independently of Docker.

Exact next owner action: review the uncommitted `git diff` on `codex/code-comments`. Once Docker Desktop's WSL daemon is available, run `source scripts/dev-env.sh` and `pnpm docker:smoke` to finish runtime verification of the operational comments. Suggested eventual commit: `docs: explain first-party code and record comment style`.

## **README and Architecture Review — 4 November 2026**

Continued on `codex/code-comments` and preserved every earlier comment/configuration/source change — only README.md, docs/architecture.md, docs/operations.md and this handover changed during this request

The README now introduces current learning features, separates required study tools from optional development/lab tools, and provides Windows/WSL, macOS, Linux and phone guides using four GitHub-compatible disclosures with only Windows open by default — each guide begins at Step 0

Architecture now has a compact Mermaid diagram, beginner terms, API/storage details and relative code links — operations contains the longer LAN, firewall, address, service and alternate-port guidance with safe stop/start and backup/restore commands

Official Docker, Microsoft, Git, GitHub, Mermaid, Apple and Wireshark documentation informed the platform guidance — registry manifests for both pinned Node base images list linux/amd64 and linux/arm64, with no project platform override

Actual checks passed: Markdown parsing, all 53 relative file/heading links, four disclosure sections and their Step 0 sequence, requested final punctuation, every documented Bash block, Compose default/LAN/alternate-port configuration and flags, actionlint and Git whitespace checks — Mermaid 12.3 parsed and rendered the diagram in Chromium, and a rendered Markdown preview confirmed guide expansion

An isolated start of the actual built Node entry with a temporary empty SQLite database and no API keys or .env file served health, the real page, both lessons and the 1,362-byte PCAP — it was stopped and its temporary data removed without accessing normal progress

The existing AGENTS.md required the broader checks even for prose, so pnpm check passed formatting/lint/types/content validation plus 6 backend and 4 frontend tests, pnpm build passed, and a separate pnpm test:browser completed with all 4 tests passing — the earlier combined process reported all tests passed but ended with a termination status, so the standalone rerun supplied the clean result

README.md remains excluded by the existing .prettierignore to preserve the prior comment work — it was explicitly formatted and checked with `pnpm exec prettier --ignore-path /dev/null --check README.md docs/architecture.md docs/operations.md`, rather than claiming the normal formatter checked it

Docker's service remains unavailable at /var/run/docker.sock — no fresh Docker startup, container recreation, backup/restore or LAN/firewall change was performed for this documentation request, and no normal container or learner volume was touched

Windows x64/WSL Docker use has historical local verification; native Linux and both Mac architectures have guidance and manifest/config checks but no installation test — physical phone/Wi-Fi access and actual GitHub rendering remain unverified, and hosted CI/security scans were not rerun for this prose change

No application behaviour, dependencies, lesson content or features changed — no commit, push, merge, publication or remote setting change was made

Exact next owner action: review the complete uncommitted diff for the earlier comments and these guides — suggested combined commit message: `docs: explain code and add setup and architecture guides`
