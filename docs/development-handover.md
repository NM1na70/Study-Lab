# Development handover — 3 November 2026

Branch: `codex/milestone-1-study-core`. Base: original main containing README.md. README preserved byte-for-byte. Local original implementation only; no push, commit, merge, publication or remote configuration changes. Intent-to-add makes new files visible in the unstaged Git diff; this note is not a restorable code backup.

Implemented Milestone 1: React/Fastify/SQLite, two sourced complete lessons, synthetic PCAP and independently checked evidence, autosaved/resumable progress, checked-attempt history, explicit writing self-review, hint/solution tracking, completion rules, mistake retry, responsive UI and local assets. Added Node/pnpm pins, strict validation, non-root persistent Compose runtime, real backup/restore tools, tests, local WSL hooks, pinned Actions checks, scanners, dependency updates, PR template, engineering/content/operations docs and a bounded roadmap.

Actual checks: frozen install; format/lint/types/content/parser; 6 backend/domain/commit tests; 4 UI tests; 4 desktop/mobile browser flows; production build; Docker health/recreate/persistence/UID and backup/restore; actionlint; Compose config; hook acceptance/rejection/clean-PATH launch; Gitleaks; Trivy HIGH/CRITICAL; Git whitespace/README preservation. See verification.md for evidence, corrected failed approaches and limitations. Dependency audit succeeds at HIGH/CRITICAL but reports two MODERATE upstream advisories. No suppressions/overrides. Hosted CI/CodeQL and physical phone/LAN connectivity remain unverified.

Linux tool setup: source scripts/dev-env.sh. Local Playwright additionally uses the user-scoped LD_LIBRARY_PATH documented in development-workflow.md. Default Docker app is at http://localhost:3000 with its normal named volume, separate from every smoke-test volume. Test resources are cleaned up; generated reports/backups/DBs are ignored.

Exact next owner action: open http://localhost:3000, perform the five-minute walkthrough in operations.md and inspect `git diff`. If satisfied, stage reviewed files, commit with `feat(study): implement local milestone one learning core`, push this feature branch and open a PR into main. Wait for actual hosted checks before squash merging. Do the manual phone/LAN check separately; main protection is a later owner setting after check contexts exist.

Next implementation milestone: explicit content migration policy, small spaced-repetition scheduler and versioned lesson packs, following docs/roadmap.md. No AI or additional placeholder lessons are installed.
