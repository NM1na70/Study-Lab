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
