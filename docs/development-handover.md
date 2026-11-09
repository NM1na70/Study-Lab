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

## Next Milestones — Active Work, 5 November 2026

Durable worktree: /home/james/VibeCoding/study-lab-next-milestones on codex/next-milestones, from origin/main c3765e9 — original main and prior UI worktree are unchanged

Stage 1 defines the two ten-lesson sequences in content/course-sequence.json and docs/course-sequences.md, including objectives, prerequisites, practical work, activity choices, research and review concepts

Stage 2 implements the spelling/reading and DNS/authentication pilot lessons, with original inline materials and downloadable synthetic event projections — the original two lessons retain their versions and grading

At this checkpoint the remaining work was independent evidence validation, scheduling, optional feedback and expansion — the final delivery status below supersedes this checkpoint

Stage 3 checkpoint: persisted five-item review sessions and UTC interval scheduling are implemented, with controlled-time tests covering lateness, independent history, duplicate writes, resume and dismissal/reactivation

Stage 4 checkpoint: optional OpenAI settings and feedback use owner-token plus direct-loopback authorisation, an in-memory API key, explicit request consent, durable daily/minute reservations, bounded context/output, cancellation and provider-error messages — 27 backend tests currently pass using mocked transport only, with no paid calls or real credentials

Pilot findings before Stage 5: the catalogue and review page assumed one lesson per course; report rendering assumed the HTTP field names; evidence downloads were labelled PCAP regardless of format; and review attempts need their own persisted history — the reusable structures are being corrected before expanding the pack

## Next Milestones — Completed Local Delivery, 5 November 2026

This section supersedes the active checkpoint above — all five requested stages are implemented and remain uncommitted on codex/next-milestones

Open /home/james/VibeCoding/study-lab-next-milestones in VS Code — the original main checkout at /home/james/VibeCoding/study-lab and previous /tmp/study-lab-learning-ux worktree were preserved

Delivered 10 English and 10 Cybersecurity lessons, 124 activities, original local teaching materials, nine additional reproducible synthetic evidence packs, independent answer verification, catalogue filters and generic connected report layouts — the original lesson IDs/versions and existing UI requirements remain intact

Pilot findings and expansion decisions are recorded in pilot-findings.md — exact lesson objectives/prerequisites/tasks/sources/completion limits/review concepts are in course-sequences.md and content/course-sequence.json

Review Due shares Mistake Review dismissal semantics, persists UTC schedules and five-item sessions separately from original assessment history, handles assistance/Skip/deduplication and supports Remove/refresh/Undo without erasing learner work

Optional OpenAI feedback uses explicit owner consent, direct-loopback plus capability authorisation, an API key held only in server memory, minimal bounded context, strict text feedback, one operation at a time, three attempts/minute, twenty/day, timeout/cancellation and safe actionable failures — no provider tools, grading or automatic completion

Schema 3 adds review and AI usage/assistance tables while retaining progress and migration archives — actual disposable backup/restore preserved new state and excluded provider credentials, with version 1/2 migration fixtures covered

Final results: pnpm check passed with 36 backend/domain and 7 frontend tests; pnpm build passed; all 56 desktop/mobile browser cases passed; independent evidence regeneration/extraction, backup/restore, HIGH-threshold audit, Gitleaks, actionlint, Compose configuration and whitespace checks passed

Docker smoke and image scanning were attempted but blocked by the missing /var/run/docker.sock — two moderate dependency advisories remain, and live OpenAI, hosted CodeQL/CI and physical-phone connectivity were not tested

Disposable preview: http://localhost:3012 — database /tmp/study-next-preview.u5kMAp/study.sqlite, with the temporary path also recorded in /tmp/study-next-preview-path — the existing preview on 3011 remained healthy

Footer: exactly 2026 | Study Lab — no normal learner data, secrets, Docker volume or unrelated edits were changed

Suggested logical commits and PR descriptions are in delivery-review.md — review and commit only when the owner explicitly requests it

To resume: source scripts/dev-env.sh in this durable worktree — Docker validation remains the infrastructure-dependent follow-up, and real provider evaluation requires explicit owner authorisation/funding

## Course Depth Extension — In Progress

New request: /mnt/c/Users/Xnami/.codex/attachments/36941880-ec6c-432d-8d7e-b1fe9304d815/Pasted text.txt

Continue in /home/james/VibeCoding/study-lab-next-milestones on codex/next-milestones — all earlier milestone changes remain uncommitted and preserved

Implemented initial Daily Quiz selection/refresh/shared question state, combined review navigation and coordinated draft flushing, plus an owner-restricted persisted model defence prototype — schema 4 adds quiz/session history and model/run history, and restore accepts schemas 1–4

The endpoint lesson links to the model, which supports timed synthetic events, fixed inspection/defence commands, pause/resume/reset, history, timeout and a portal-availability safeguard — it is not a host shell or real isolated operating system

The new request is NOT fully implemented — professional three-level course depth, news reading and fresh-news updates, integrated multi-step lab question/completion, final selection metadata and full delivery evidence remain outstanding

Read depth-extension-status.md before continuing — it records the actual boundary, all ten Cybersecurity audit findings and remaining curriculum work without pretending renamed foundations are advanced

Use only temporary databases and a new preview port when validating this extension — preserve the earlier previews and learner data, and do not commit/push/merge/publish

Checkpoint validation: pnpm check passed with 40 backend and 7 frontend tests; production build passed; all 64 desktop/mobile browser cases passed, including failed quiz saves and combined-review compatibility — schema 4 backup/restore and the real HTTP model check passed using temporary data

New preview: http://localhost:3013 — temporary directory /tmp/study-depth-preview.31kMrM, with its private mode-600 owner-token file for local model controls — do not print or publish the token value

Screenshots: test-results/depth-quiz-desktop.png, depth-quiz-phone.png, depth-review-desktop.png, depth-review-phone.png, depth-lab-desktop.png and depth-lab-phone.png — no horizontal overflow was found after fixing the phone quiz navigation/dialog

Security: Gitleaks passed, HIGH-threshold audit passed with two moderate advisories, actionlint/Compose/whitespace passed — Docker smoke and image scanning were attempted but the daemon socket is missing

Next work remains the substantive curriculum/news implementation and versioned catalogue integration for the lab — do not mark this brief complete or describe the prototype as professionally validated training

## Paused At Owner Request — 6 November 2026

The continuation is explicitly paused — do not resume automatically

Read docs/depth-extension-status.md for the authoritative saved implementation, Medium-selection refinement, stopped processes, durable disposable databases, checks and exact restart commands

All file changes remain on codex/next-milestones in /home/james/VibeCoding/study-lab-next-milestones, uncommitted and unpushed — current user/live data and pre-existing services were not modified

## Resumed Completion — 6 November 2026

The owner resumed this work — the pause restriction is superseded, but its backups remain intact

The Medium-selection thin-pool bug is fixed and covered for one, two and three alternatives — all alternatives are considered before repeating the unfinished selection

Current requirement status, source/curriculum review and limits are in depth-extension-status.md and curriculum-depth.md — changes remain uncommitted on codex/next-milestones

Resumed pnpm check passed with 53 backend tests and 7 frontend tests; production build passed — the final browser result is recorded separately in verification.md after completion

The new preview uses a copy of the durable paused state at localhost:3014 — its directory is in /tmp/study-resumed-preview-path, with a private owner-token file; no normal learner database or pause backup was changed

Suggested logical commits: curriculum/provenance and migrations; authoritative model integration; validated news snapshots; metadata selection and regression coverage; final docs/verification — no commits or pushes were performed

## Resumed Final Verification — 6 November 2026

The interrupted pause run was not counted as passing — it was replaced by a completed standalone run on the saved implementation plus the thin-pool fix

- pnpm check passed: formatting, lint, strict types, all content/evidence/depth checks, 53 backend tests and 7 frontend tests
- pnpm build passed
- Standalone pnpm test:browser passed all 66 desktop/mobile cases in 4.2 minutes, including all lesson controls, integrated owner-verified lab completion, news snapshot persistence/failure, quiz sharing/refresh and legacy review behaviour
- The initial resumed combined command ended after 59 cases without a summary — that incomplete result is not the full-suite evidence
- Gitleaks, actionlint, Compose configuration and git diff --check passed; audit passed its HIGH/CRITICAL threshold with two moderate advisories remaining
- Docker smoke and image scan were attempted again and blocked by the missing /var/run/docker.sock — no current Docker image/runtime scan pass is claimed
- Desktop and phone screenshots were captured and checked for horizontal overflow; fresh news and AI automated checks used mocked external responses, with no paid provider call
- Schema 5 migration/backup tests preserved earlier answers, assistance, completion history, review state, quiz selections, news snapshots and model/debrief state without provider credentials

Preview: http://localhost:3014 — /tmp/study-resumed-preview.22HSwj/study.sqlite, copied from the saved disposable backup rather than live learner data

VS Code folder: /home/james/VibeCoding/study-lab-next-milestones — codex/next-milestones, all changes uncommitted and unpushed

Screenshots: test-results/completed-quiz-desktop.png, completed-quiz-phone.png, completed-reading-desktop.png, completed-reading-phone.png, completed-lab-desktop.png and completed-lab-phone.png

Resource measurements remain the recorded real-time production Node/model run: about 100.4 MiB maximum RSS, 322.790 ms process CPU over 46.399 seconds and 197,024 bytes of temporary SQLite files including sidecars — these are measured samples, not enforced per-VM limits or whole-machine usage

Limitations: the defence environment is a bounded model, not an OS or network range; advanced writing is explicitly self-reviewed; durations are estimates; fresh ingestion is limited to the supported USGS event feed; physical phones, live OpenAI quality/billing, hosted CI/CodeQL and Docker runtime verification remain unverified

The course-depth requirements and requirement-by-requirement status are documented in depth-extension-status.md and curriculum-depth.md — this implementation does not claim agency endorsement, certification or independently verified professional mastery

## Project Instructions Consolidation — 6 November 2026

Step 1 only: consolidated AGENTS.md, created docs/project-brief.md and updated docs/development-workflow.md — essential rules live in the root instructions, detailed examples/procedures in the workflow and durable product direction in the brief

Resolved blanket full-suite requirements for prose-only changes, ambiguous Git command examples and outdated workflow checkpoint/schema wording — current completion, ports and counts remain in the existing status/verification records rather than becoming permanent instructions

Code comments and Git commits are explicitly different; repository instructions do not override platform/system requirements, and later explicit user preferences can update project rules

The repository-wide code-comment audit has NOT started — no application, content, schema, dependency, Docker or live-data changes were made by this instructions task

Validation is limited to Markdown formatting, local links/anchors, instruction consistency and a task-start file-hash/diff comparison — earlier uncommitted implementation work remains intact, and no whole application suite is warranted solely for these Markdown edits

All changes remain uncommitted and unpushed — stop after this setup and wait for the owner's next instruction

Instruction setup results: all four changed Markdown files pass Prettier; 29 local links/anchors pass validation; task-start hashes confirm no other files changed, including earlier untracked implementation files; revised instructions were explicitly reread — no remaining ambiguity for Step 1

## Repository-Wide Code-Comment Audit — 6 November 2026

Worktree: `/home/james/VibeCoding/study-lab-next-milestones` — branch `codex/next-milestones`, HEAD `c3765e9` — all existing implementation and audit changes remain uncommitted and unpushed

Read the root AGENTS.md, project-brief.md and development-workflow.md; no nested AGENTS.md applies — this task explicitly authorised the audit following Step 1, superseding that step's stop point

### Coverage And Changes

The task-start Git inventory included tracked and untracked files — 84 human-maintained commentable code/configuration files were read, excluding the lockfile that the initial extension-based inventory also listed

| Group                 | Inspected | Updated | Scope                                                                                                |
| --------------------- | --------: | ------: | ---------------------------------------------------------------------------------------------------- |
| Frontend              |        16 |      13 | Components, hooks, API/navigation, CSS and the Vite declaration                                      |
| Backend               |         8 |       8 | Routes, SQLite, quiz, reviews, AI, news and the defence model                                        |
| Shared                |         6 |       6 | Domain rules, validation contracts, migration, lab and recall state                                  |
| Scripts               |        16 |       5 | Environment, generators/independent validators, backup/restore, smoke, scanners and hooks setup      |
| Unit/API/UI tests     |        10 |       4 | Full executable fixture and assertion review, including migration and provider mocks                 |
| Browser tests/helpers |         9 |       3 | All desktop/mobile scenarios, disposable server/provider fixtures and native answer controls         |
| Configuration/hooks   |        19 |       0 | Dockerfile/Compose, CI/Dependabot, lint/build/test settings, hook launchers and commentable dotfiles |
| Total                 |        84 |      39 | Unchanged files already had useful explanations or were tiny directive/configuration files           |

The browser AI spec update is comment spacing only — no scenario, assertion, answer, timeout, provider mock, command or configuration value changed

Added purpose comments for imports, related state/types, important functions/effects and JSX sections; explained pending finding copies, save-before-departure, revision conflicts, shared quiz answers, explicit refresh, completion/assistance, recall dismissal/undo and historical migration

Backend comments distinguish direct-loopback owner access, memory-only credentials, durable request reservations/count limits, fixed model commands and server-derived proof from operating-system behaviour or mastery — news comments explain fixed-source validation, immutable identities and failure retention

Representative actual comments:

- [TaskCard](../src/client/TaskCard.tsx): “Wait for a pending finding copy before saving the latest draft for departure”
- [Quiz](../src/server/quiz.ts): “Return the persisted selection on ordinary reads, with no date-based replacement”
- [Lab route](../src/server/app.ts): “Derive proof from server-held model state, never from a browser-supplied success flag”
- [AI service](../src/server/ai.ts): “Enforce request counts before reserving work; these limits are not a provider currency budget”
- [Evidence validator](../scripts/verify-lessons.py): “Join by processGuid because the supplied records deliberately reuse a PID”

Corrected the schema-4 storage comment and outdated architecture descriptions — the current implementation is schema 5 with an integrated model question

### Exclusions And JSON Documentation

README.md, all lesson text/JSON, package/version pins and the lockfile retain their task-start bytes — dependencies, vendor files, generated builds/reports/evidence, binaries, databases, backups, exports and learner data were excluded from editing

Validation regenerated ignored build/test reports only; no generated evidence was rewritten and no live learner database or existing preview service was used or stopped

Authored JSON received no comments, fake fields or JSONC conversion — inspected configuration/content structures and existing documentation; added [Authored JSON Contracts](architecture.md#authored-json-contracts) for migration versions, quiz metadata, passages, report fields/layout/rules, finding mappings, review concepts, manifests and build configuration

The content-provenance document now correctly acknowledges cross-task finding references — no new external research or source claims were introduced

### Preservation Evidence

Task-start copies, status and inventory are outside the repository at `/tmp/study-comments-baseline-6s4rglia` — temporary comparison scripts/results and the task-relative diff are also under `/tmp`, with no permanent archive or tracking tooling added to the project

Compared against this baseline, not HEAD: TypeScript parser structures match for all 57 TS/TSX/JS/MJS files; all 12 TSX files also produce equivalent React JSX runtime output, including literal text and meaningful whitespace; PostCSS structures preserve all selectors/declarations/values; Python ASTs match for all six scripts, including unchanged docstrings

All 20 remaining non-Python/code inventory entries match byte-for-byte, preserving shell commands, continuations, configuration values and HTML — tool directives and code file modes were checked separately; all other baseline files remain byte-identical except the three intentional Markdown updates (architecture, content provenance and this handover)

Reviewed the task-relative unified diff for unintended executable or content changes — no naive comment-stripping comparison was used

### Validation

- `pnpm check` passed: formatting, lint, both strict TypeScript checks, all content/PCAP/synthetic evidence/depth validation, 53 backend tests and 7 UI tests
- `pnpm build` passed for the production client and server
- Standalone full `pnpm test:browser` passed all 66 desktop/mobile cases in 3.3 minutes, including report notes and the exact `2026 | Study Lab` footer assertion; no interrupted run was counted as passing
- Bash syntax for all shell scripts and both hooks, Python syntax/AST checks, actionlint, `docker compose config --quiet` and Git whitespace checks passed
- `pnpm security:secrets` passed using the installed Gitleaks scanner with redacted output
- `pnpm security:audit` passed the configured HIGH/CRITICAL threshold; two moderate advisories remain, with no dependency changes made
- `pnpm docker:smoke` and `pnpm security:container` were attempted and exited 1 because `/var/run/docker.sock` is absent — no Docker build/runtime/image scan pass is claimed

### Functional Finding Left Unchanged

`scripts/smoke-progress.mjs` submits ordinary example drafts/checks for every task, including `defence-lab`; `src/server/store.ts` correctly rejects that check without owner-authorised live model proof

A separate diagnostic ran the real smoke helper against a disposable in-memory HTTP app on an ephemeral loopback port — it exited 1 with “Verify the live lab objectives using owner controls before checking this question” at the helper's assertion; the temporary server was closed afterwards

Therefore restoring Docker alone will not make the existing smoke flow pass — a separate functional task must coordinate the smoke helper with the lab's authorised verification lifecycle, without weakening that boundary; this comments-only audit deliberately does not fix it

### Exceptions And Review State

Preserved the Vite triple-slash reference, TypeScript/Vitest directives, shebangs, Python module docstrings and version/tool annotations exactly — prose styling does not override those machine-sensitive or executable forms

No known remaining explanatory-comment style exceptions were found in the inspected inventory — tiny obvious files were not padded with comments, and descriptive test names were retained without duplicating them line by line

No hosted CI/CodeQL, live OpenAI, live USGS ingestion, physical-phone or Docker success is claimed from mocked providers, viewport tests or parser checks

Existing preview information and restart commands above remain applicable — this audit started no persistent preview and changed no remote settings; stop after reporting results and wait for owner review

## Smoke Helper Fix — 6 November 2026

Worktree `/home/james/VibeCoding/study-lab-next-milestones` — current branch `codex/next-milestones`; this explicitly requested functional follow-up resolves the smoke-helper finding recorded by the preceding comment audit

Changed scripts/smoke-progress.mjs, scripts/docker-smoke.sh, tests/server.test.ts and tests/lab.test.ts, plus operations/workflow/verification and this handover — all earlier uncommitted and untracked work remains intact

Compose intentionally supplies no owner capability and Docker bridge access cannot satisfy direct-loopback owner authorisation — no application code, credentials, Docker access settings, answer keys or completion rules were changed

The helper now asserts the disabled-owner boundary, rejected model reads/start/history, rejected ordinary checks for a correct-looking lab draft, rejected ownerless verification and rejected full completion of the lab lesson; failed requests must preserve progress exactly

It still checks all ordinary questions normally and explicitly reports 19/20 lessons complete with defence-lab incomplete — write/read assertions retain the unassessed lab draft, ordinary progress, hints, solutions, step and versions through the existing container recreation/backup/restore flow

Regression tests run the actual CLI helper over a temporary HTTP server, reopen its SQLite file, stream the real backup/restore commands, reject improperly persisted lab credit and fail closed on owner-enabled targets — host lab tests also reject bridge access with a valid fictional capability and a forged verification success flag, while incomplete objectives remain incorrect and legitimate model proof still succeeds

The new full-catalogue CLI integration has its own 20-second deadline because it performs hundreds of real HTTP writes and multiple subprocess/reopen/restore operations; existing suite/application/browser timeouts are unchanged — an initial response-only badge comparison error was fixed, and the initial default-deadline run was not counted as passing

Code-comment compliance was reviewed for all four modified code/script files: grouped imports/setup, API revision ordering, owner/completion safeguards, response-only metadata and disposable fixture lifecycle are explained in sentence case without terminal full stops; shell cleanup and commands remain intact apart from the truthful smoke success message

Final check results and infrastructure limits are recorded in verification.md — all changes remain uncommitted and unpushed, no live learner data or unrelated preview/service was used or stopped

Smoke-fix final results: pnpm check passed (55 backend and 7 UI tests, plus format/lint/types/content/evidence); production build, focused CLI/lab regressions, Bash/Node syntax, Compose configuration, actionlint, whitespace and native secret scan passed — Docker smoke and container scanning were attempted but blocked by missing /var/run/docker.sock

The intended supported Docker flow has no known remaining helper blocker; actual image/runtime/UID/volume/scan evidence remains unavailable until the daemon is running — rerun pnpm docker:smoke and pnpm security:container before PR sign-off, with hosted CI still unverified and no full browser rerun warranted for unchanged application code

Task-relative preservation check confirmed exactly eight changed files, with application code, README, content, package/lockfile/version pins and all other earlier changes byte-identical to this task's start — no new persistent services or preview processes remain from these tests
