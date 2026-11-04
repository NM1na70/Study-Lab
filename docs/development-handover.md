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

## Learning UX — 4 November 2026

Work is isolated on `codex/learning-ux` from latest origin/main `23f2ab9` in `/tmp/study-lab-learning-ux` — `/home/james/VibeCoding/study-lab` remains on the prior maintenance branch with the owner's uncommitted handover unchanged

Node remains exactly 24.22.2 and pnpm 10.32.1 — dependencies, lockfile, engine validation and the Node maintenance policy are unchanged

Implemented the six requested changes: native short-answer controls with deliberate two-Enter checking and safe bold feedback; an original ASD-informed guided report; task-specific radio/checkbox/drop-down controls; save-aware dashboard completion dialog; course-first persistent mistake review with Remove/Undo; and Title Case button labels

### Activity Mapping

| Course        | Existing task ID | Chosen control         | Reason                                                                       |
| ------------- | ---------------- | ---------------------- | ---------------------------------------------------------------------------- |
| English       | action           | Short Answer           | Recall the full spelling                                                     |
| English       | connection       | Short Answer           | Practise spelling rather than selecting it                                   |
| English       | detection        | Short Answer           | Recall the complete word family spelling                                     |
| English       | protection       | Short Answer           | Produce the correct word in context                                          |
| English       | choose-meaning   | Drop-Down              | Choose between fixed meanings without testing spelling again                 |
| English       | repair-spelling  | Short Answer           | Correct the spelling directly                                                |
| English       | own-note         | Multiline Writing      | Writing and language review are the objective                                |
| English       | review-family    | Short Answer           | Retrieve the word from its family                                            |
| Cybersecurity | source-host      | Short Answer           | Recall and cite the observed source                                          |
| Cybersecurity | destination-host | Short Answer           | Identify the destination from evidence                                       |
| Cybersecurity | request-count    | Checkboxes             | Identify every actual request frame, distinguishing requests from responses  |
| Cybersecurity | request-path     | Short Answer           | Extract the exact case-sensitive URI without GET or Host                     |
| Cybersecurity | third-frame      | Short Answer           | Recall an independent evidence reference                                     |
| Cybersecurity | interval         | Short Answer           | Calculate the request interval                                               |
| Cybersecurity | incident-note    | Guided Report          | Check eight evidence fields and explicitly self-review four reasoning fields |
| Cybersecurity | review-limit     | Yes/No Multiple Choice | Decide whether PCAP alone proves malware                                     |

Request-count now assesses frame identification rather than a numeric count — old counts are preserved as previous work, with the new selection requiring assessment

Schema 2 and content version 2 preserve full original JSON snapshots, earlier free-text summaries, attempts, mistakes, hints, solution use and legitimate completion history — changed Cybersecurity activities are reopened, old assistance remains recognised, and old report text never completes the new report

English's existing completion stays current because its learning objectives remain unchanged — option conversions retain the original answer in previous work as well as the mapped stable ID

A review dismissal stores a mistake-count watermark rather than erasing history — a newer wrong check reactivates the item, while refreshing old history does not

The official practitioner webpage, linked December 2024 PDF templates and copyright conditions were reviewed — source/reuse details and the deliberate omission of unsupported severity, impact or compromise claims are in content-and-sources.md and lesson metadata

Actual validation: frozen install; complete repository checks with 9 backend and 7 frontend tests; production build; desktop/phone browser scenarios; isolated real API smoke and schema 2 backup/restore; Compose configuration; actionlint; dependency audit at HIGH; native Gitleaks; and Git whitespace checks — see verification.md for evidence and limits

Docker smoke and container scan were attempted and blocked by the missing daemon socket — the local API smoke is separate evidence, not a claimed Docker result; physical phone/LAN, hosted CI and exact screenshot matching remain unverified

The six reference screenshots were not present among attachments — review the generated desktop/phone report and review screenshots, the request-count design change and the migration/completion policy before adoption

For manual review use the disposable preview procedure in operations.md, which selects a temporary database and port 3011 — do not start this feature against normal learner progress until you have reviewed it and backed up that progress

No commit, push, merge, publishing, PR mutation or live-data migration was performed

Suggested commit message: `feat(study): improve learning controls and preserve progress`

Suggested PR title: `Improve learning controls, guided reporting and mistake review`

Suggested PR description:

> Study activities now use controls suited to their objectives, with deliberate keyboard checking, safely emphasised evidence and a short guided report that separates checked facts from self-reviewed reasoning
>
> Add a save-aware completion dialog and course-based mistake review with persistent dismissal, Undo and reactivation on a new wrong attempt — migrate earlier answers, assistance and completion history without treating an old summary as a completed new report
>
> Validation: repository checks, production build, desktop/phone browser flows, temporary schema 1 migration, real API smoke, schema 2 backup/restore, Compose/actionlint, dependency audit and Gitleaks — Docker smoke and container scanning remain pending because the Docker daemon is unavailable

Manual preview is currently running at http://localhost:3011 with a new temporary learner profile — all 10 final desktop/phone browser tests passed, and the actual API health endpoint returned ok

## Connected Reports And Route Refinements — 5 November 2026

Continued the existing uncommitted implementation on codex/learning-ux in /tmp/study-lab-learning-ux — did not restart from main or change the original checkout and its user edits

All five supplied screenshots were opened through their /mnt/c WSL paths and inspected: issues 1 for the route, issues 2 for the old report, issues 3 for the footer, issues 4 for the brand and issues 5 for the final next button — the desktop client's Windows-path errors did not prevent inspection

Implemented direct, keyboard-accessible Lesson Route buttons with current/completion indicators and phone access — navigation locks immediately, waits for the latest draft and confirmed step save, then scrolls and focuses the opened heading

The report now reads as four connected sections with content-sized inputs, stable-ID selections, two short reasoning prompts and explicit scenario-defined assessment/evidence relationships — there is no required long summary or word-count threshold

My Investigation Notes reads only saved learner findings and distinguishes checked, unchecked and edited answers — Use My Finding copies the actual value with provenance, asks before replacing a different entry and never grants correctness or self-review

Preview Report renders current entries and missing markers safely, stays live while editing and focuses its heading — the completed example remains a separate explicit reveal

The header reads StudyLab in black with its dashboard link and no subtitle — the footer contains exactly 2026 Study Lab once

Next Activity appears only when the lesson's actual activity order has a successor — final activities rely on the existing completion/dashboard controls and their save boundaries

Content migration supports Cybersecurity 1 → 2 → 3 and English 1 → 2, retaining equivalent factual report drafts, original JSON, earlier reasoning/summaries, counters, assistance, completion history and dismissal state — new report relationships and reasoning are not treated as already assessed

Legacy incorrect findings without a reliable checked/edit marker are conservatively shown as Not Checked — new checks and edits explicitly track that state, and copying preserves the status at copy time separately from report assessment

Re-read the official practitioner guidance and relevant templates, linked PDF and reuse conditions — original wording, attribution and the synthetic-evidence boundary are documented in content-and-sources.md

Generated review artifacts are in test-results: route-english-desktop.png, route-english-mobile.png, route-cybersecurity-desktop.png, route-cybersecurity-mobile.png, report-desktop.png, report-mobile.png, learner-preview-desktop.png and learner-preview-mobile.png

The old disposable preview database is retained when the preview is refreshed — the new preview uses its own temporary profile on port 3011, with normal learner data and port 3000 untouched

Suggested commit: feat(study): add connected reports and save-aware lesson routes

Suggested PR title: Improve learning navigation and guided investigation reports

Suggested PR description:

> Replace manual lesson selection with accessible route buttons that save before opening the requested activity, and remove next-activity controls when there is no successor
>
> Assemble guided investigation reports through connected sentences, saved findings, explicit assessment/evidence checks and a safe live learner preview — keep reasoning self-review distinct from objective checking and preserve earlier work, assistance and completion history through versioned migration
>
> Retain course-based mistake review, deliberate keyboard checking and save-aware completion, with simplified black StudyLab branding and the exact 2026 Study Lab footer

No commit, push, merge, publication or live-data migration was performed

Final validation for these refinements: pnpm check passed with 12 backend and 7 frontend tests; production build and all 14 desktop/phone browser scenarios passed; temporary real API completion/backup/restore, Compose config, actionlint, HIGH-threshold dependency audit, Gitleaks and whitespace checks passed — Docker smoke/container scanning were attempted but unavailable, and two moderate dependency findings remain

The refreshed preview health check passed at http://localhost:3011 — its new database path is recorded privately in /tmp/study-refine-preview-path, with the prior disposable /tmp/study-ux-preview.5I3QAy/study.sqlite retained
