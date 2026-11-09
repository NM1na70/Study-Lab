# Milestone 1 verification — 3 November 2026

This records local observations, not hosted GitHub results. Branch: `codex/milestone-1-study-core`. Original README.md is unchanged. No commits, pushes, merges, publishing or remote-setting changes were performed. New files use intent-to-add so `git diff` shows the complete reviewable change; file contents remain unstaged.

## Checks and evidence

| Check                         | Observed result                                                                                                                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linux tools                   | Checksum-verified Node 24.22.2 and pnpm 10.32.1 under the project-specific user directory; no Windows Node/npm dependency                                                                                                                                |
| Frozen install                | `pnpm install --frozen-lockfile` succeeded                                                                                                                                                                                                               |
| Format, lint, strict types    | `pnpm check` passed formatting, ESLint and both TypeScript configurations                                                                                                                                                                                |
| Lesson/content validation     | Two complete lessons validated, including source references, IDs, answers, hints, examples and all required stages                                                                                                                                       |
| Capture parser                | 12 Ethernet/IPv4/TCP frames; valid lengths/checksums; requests at frames 4/6/8, UTC 00:00:01/00:00:31/00:01:01 on 1 November 2026; host pair, URI and 30-second intervals match keys and summary                                                         |
| Backend/domain/commit tests   | 6 passing tests across 3 files; exact spelling, writing/completion rules, assistance, malformed/stale requests, transactional persistence/reopen and commit subjects                                                                                     |
| Frontend tests                | 4 passing tests; input/check order, feedback/hints/solutions, explicit self-review, load/progress/error states, retained drafts and delayed-save serialisation                                                                                           |
| Browser integration           | 4 passing tests across desktop 1280×900 and mobile 390×844; both full lessons, wrong answers/retries, hints, written example/self-review, completion, refresh, fresh browser context, mistake review, quick edits/navigation and save failure/retry      |
| Accessibility/layout          | Axe reported no violations on the tested dashboard/completed study screens; keyboard skip link and page-width checks passed; screenshots visually inspected. This is not a full accessibility certification                                              |
| External-service independence | The full study browser tests block every non-local HTTP request and observed none. Sources are optional outbound links; app runtime has no AI/cloud call                                                                                                 |
| Production build              | `pnpm build` succeeded; browser tests use the built client served by the actual Fastify app                                                                                                                                                              |
| Docker smoke                  | Built from repository inputs with frozen dependencies, healthy response and real HTML, UID 1000, completed both lessons via HTTP, recreated container and verified answers/current step/content version/hints/solutions/completion from the named volume |
| Backup/restore                | Online SQLite backup exported through exec/stdout, stopped app, one-off UID 1000 restore from stdin, restarted and verified both complete lesson states                                                                                                  |
| Commit hooks                  | Actual commit-msg hook accepted a scoped breaking-change subject and rejected invalid text; Linux path restoration verified with a clean PATH                                                                                                            |
| Configs and diff              | actionlint v1.7.12, `docker compose config --quiet`, executable script modes, `git diff --check` and original README comparison passed                                                                                                                   |
| Dependency audit              | Exit 0 at the declared HIGH/CRITICAL threshold; **2 MODERATE advisories remain**, detailed below                                                                                                                                                         |
| Gitleaks v8.30.1              | Working-tree scan passed, no secrets found; redacted report is ignored under reports/                                                                                                                                                                    |
| Trivy v0.76.1                 | Final Alpine runtime scan passed with **0 HIGH/CRITICAL findings**; JSON report is ignored under reports/                                                                                                                                                |

PCAP SHA256: `1b469cd7b4ba5139045cbf9b97fbc8aaec5be3f55dd3f3c9d13fc2d3bae7a7e8`. It is original, synthetic, 1,362 bytes and contains no executable malware. Validation used the separate byte-level parser, not a claim of manually running Wireshark.

## Remaining limits and advisories

- GitHub Actions, including CodeQL, has **not run on GitHub**. No branch protection is configured. CodeQL CLI is not installed locally; its pinned hosted job emits SARIF and enforces findings rather than claiming a clean local result.
- Physical phone access over the owner's Wi-Fi and Windows Firewall/Docker Desktop forwarding are **unverified**. Follow the separate manual procedure in operations.md. Viewports test layout, not connectivity.
- `minimatch` 10.2.6 through ESLint: MODERATE [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Patched range reported by audit starts at 11.0.1.
- `glob` 13.0.6 through @fastify/static: MODERATE [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4). Patched range reported by audit starts at 14.0.2.
- These are below the documented HIGH/CRITICAL failure threshold. No vulnerability overrides or scanner suppressions were added. Track upstream compatible upgrades; this is not a statement that the dependency tree has zero vulnerabilities.
- Automated/self-reviewed completion is not proof of independent mastery. Content-version mismatches preserve progress and block editing until an explicit future migration; no migration to changed tasks is claimed.

## Failed approaches corrected during development

- Sandbox shell launcher lacked bwrap. Approved host execution was used for repository/tool work.
- Initial latest TypeScript/ESLint choices had incompatible peer ranges. Installed types were inspected; final pins use compatible TypeScript 6 and ESLint 10, with axe browser accessibility checks.
- Chromium initially lacked WSL shared libraries; user-scoped Ubuntu libraries enabled local tests without sudo/system changes.
- Browser tests initially shared a profile and raced asynchronous activity selection. Each now gets a real isolated HTTP/SQLite instance and waits for the selected activity. Navigation flushes drafts and disables the activity while changing steps.
- Initial mobile secondary text contrast and counter wrapping were fixed and rechecked.
- Debian runtime and bundled npm tooling triggered HIGH/CRITICAL Trivy findings. The final runtime uses exact-version Node Alpine and removes package-manager tooling; scanner thresholds stayed unchanged.
- Docker cp could not export a file from tmpfs on this Docker Desktop installation. The working backup command streams the file through exec; restoration was tested.
- One smoke invocation ended with a termination status despite completing its assertions/cleanup. A final rerun was used to obtain a definitive result; no partial run is presented as clean.

## Learning UX Verification — 4 November 2026

Branch `codex/learning-ux` is based on origin/main `23f2ab9`, in `/tmp/study-lab-learning-ux` — the original checkout's uncommitted handover was preserved and no live learner database or Docker volume was opened

| Check                              | Actual result                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime and frozen install         | Node 24.22.2, pnpm 10.32.1; frozen installation passed without dependency changes                                                                                                                                                                                                                    |
| Repository checks                  | Formatting, ESLint, both strict TypeScript configurations, content validation and independent PCAP validation passed                                                                                                                                                                                 |
| Backend tests                      | 9 passed across domain, server and commit checks, including answer types, factual/reasoning separation, dismissal/reactivation and temporary schema 1 migration                                                                                                                                      |
| Frontend tests                     | 7 passed, including separate Enter presses, held repeat, active IME composition, pending-action duplication, structured autosave and retained drafts after failure                                                                                                                                   |
| Production build                   | Passed; the browser suite uses the built assets served by the actual API                                                                                                                                                                                                                             |
| Browser checks                     | 10 passed across desktop 1280×900 and phone 390×844 — scenarios cover both full lessons, all control types, report resume, saved completion, keyboard activation, accessible dialog choices, Escape/focus, unmet requirements, save failures, course filtering, removal/Undo/reload and reactivation |
| Accessibility and layout           | Axe checks on dashboard, completed lessons, report, review table and dialog; page width checks and generated desktop/phone screenshots — these do not establish full assistive-technology compatibility                                                                                              |
| Local API smoke and backup/restore | Updated smoke helper completed both lessons on a temporary HTTP server; schema 2 backup/restore preserved completion, typed answers, step and assistance                                                                                                                                             |
| Operational configuration          | Compose configuration, actionlint and Git whitespace checks passed                                                                                                                                                                                                                                   |
| Dependency audit                   | Passed the unchanged HIGH threshold; two MODERATE upstream findings remain                                                                                                                                                                                                                           |
| Secret scan                        | Existing pinned Gitleaks 8.30.1 downloaded into /tmp, checked against release SHA256, and run through security:secrets — no leaks found                                                                                                                                                              |
| Docker smoke and image scan        | Attempted; unavailable because /var/run/docker.sock is missing — no image build, health, runtime UID, volume persistence or container-vulnerability result is claimed for this branch                                                                                                                |

The first secret-scan attempt used the Docker fallback and could not run — the native scanner supplied the actual passing result without changing repository tooling or thresholds

Early local test failures came from old button labels and old string-only fixtures, a feedback-token/content mismatch and an import omitted during refactoring — corrected before the final checks, without removing assertions

Review screenshots are generated under `test-results/review-desktop.png` and `test-results/review-mobile.png`; report screenshots under `test-results/report-desktop.png` and `test-results/report-mobile.png` — output is ignored by Git

The six reference screenshots mentioned in the brief were not attached in this chat — implementation follows the supplied written requirements and was inspected using generated screenshots

Physical phone/LAN use, hosted GitHub Actions and a running Docker daemon remain unverified — all app tests and manual preview use separate temporary learner profiles

A separate built preview was started and its health endpoint verified at http://localhost:3011 with a fresh /tmp database — the normal port 3000 installation was not replaced

## Connected Report And Route Refinements — 5 November 2026

Continued the existing uncommitted codex/learning-ux worktree — inspected all five issues screenshots through their WSL paths and verified the previous disposable preview before refreshing it

| Check                               | Actual result                                                                                                                                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime                             | Existing Node 24.22.2 and pnpm 10.32.1 baseline retained; no dependency or lockfile changes                                                                                                                                                                                                            |
| Repository checks                   | pnpm check passed formatting, ESLint, both strict typechecks, content relationships and independent PCAP validation                                                                                                                                                                                    |
| Backend tests                       | 12 passed, including scenario evidence relationships, wrong-finding copies/provenance, stale checked-state invalidation and temporary content-version 2 → 3 migration                                                                                                                                  |
| Frontend tests                      | 7 passed, retaining deliberate Enter, IME/repeat safeguards, serial saves, structured autosave and failed-save draft retention                                                                                                                                                                         |
| Browser tests                       | 14 passed across desktop 1280×900 and phone 390×844, including both full lessons, every input type, route locking/delayed saves, keyboard activation, focus, report/notes/provenance, overwrite consent, missing/live/safely escaped preview text, report-save retry, completion and persistent review |
| Final activity controls             | Both courses assert next-button presence from actual activity order — final edits still flush before route or dashboard departure                                                                                                                                                                      |
| Accessibility and layout            | Axe checks on dashboard, report, completed lessons, review and completion dialog; desktop/phone screenshots visually inspected; report-specific page-width assertion passed after fixing a phone grid overflow                                                                                         |
| Local runtime and backup/restore    | Updated real API smoke completed both lessons and restored schema 2 progress using temporary databases only — separate from Docker validation                                                                                                                                                          |
| Operational configuration           | Compose config, actionlint and Git whitespace checks passed                                                                                                                                                                                                                                            |
| Dependency audit                    | Passed the unchanged HIGH threshold with two MODERATE findings                                                                                                                                                                                                                                         |
| Secret scan                         | Existing checksum-verified native Gitleaks 8.30.1 found no leaks                                                                                                                                                                                                                                       |
| Docker smoke and container security | Attempted, blocked by missing /var/run/docker.sock — no Docker build, runtime health/UID, volume persistence or image vulnerability result is claimed                                                                                                                                                  |
| Preview                             | http://localhost:3011 health returned ok using a fresh temporary profile — the earlier disposable database remains retained and normal port 3000/data were not used                                                                                                                                    |

Initial browser failures were ambiguous test locators for Assessment versus its reasoning field — changed to exact accessible names without dropping assertions

Visual inspection then found a report overflow on phones that the earlier final-activity width check could miss — fixed the grid/inline blank widths and added an assertion on the actual report screen

Generated artifacts: route-english-desktop.png, route-english-mobile.png, route-cybersecurity-desktop.png, route-cybersecurity-mobile.png, report-desktop.png, report-mobile.png, learner-preview-desktop.png and learner-preview-mobile.png under test-results

The reference screenshots are comparisons of the old problems, rather than target mockups — the written specification controls the four-section report, simplified route/header/footer and final-button behavior

Physical devices/LAN, hosted CI and Docker remain unverified — no live learner data was migrated or used for a fixture

## Next Milestones — Final Local Verification, 5 November 2026

Worktree: /home/james/VibeCoding/study-lab-next-milestones on codex/next-milestones, based on origin/main c3765e9 — no commit, push, merge or publication was performed

| Check               | Actual result                                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen installation | pnpm install --frozen-lockfile passed with Node 24.22.2 and pnpm 10.32.1 — no dependency or lockfile changes                                                                                    |
| pnpm check          | Passed format, ESLint, both strict TypeScript configurations, content/evidence validation, 36 backend/domain tests and 7 frontend tests                                                         |
| Lesson validation   | 20 complete lessons, 10 per course, 124 activities and 43 selected review concepts — task/source/key/report relationships passed                                                                |
| Evidence            | Existing 12-frame PCAP parser passed; all nine additional JSON packs and two text files regenerated byte-for-byte; independent extraction/hash/UTC/IAM checks passed                            |
| Production build    | pnpm build passed — local client and server outputs produced                                                                                                                                    |
| Browser suite       | Final pnpm test:browser passed all 56 tests in 3.1 minutes across desktop and mobile viewports, with external requests blocked for core learning                                                |
| Focused regressions | Eight desktop/mobile checks passed for owner feedback, both new reports and review Remove/refresh/Undo/resume/navigation                                                                        |
| Persistence         | Real disposable SQLite backup/restore retained answers, attempts, due schedules, active sessions and AI usage; integrity_check passed and a fake provider credential was absent from the backup |
| Older formats       | Version 1 and 2 temporary fixtures migrated while retaining original JSON, counters, assistance, summaries, self-review/completion history and dismissal markers                                |
| AI boundary         | All provider calls mocked; owner/direct-loopback/forged forwarding/consent/deduplication/context/limits/cancellation/error paths passed, with no real key or paid call                          |
| Dependency audit    | pnpm security:audit passed its HIGH/CRITICAL threshold — two MODERATE findings remain in glob and minimatch, with no suppression or override                                                    |
| Secret scan         | Native Gitleaks 8.30.1 scanned the final working tree and reported no leaks                                                                                                                     |
| Configuration       | Native actionlint, docker compose config --quiet and git diff --check passed                                                                                                                    |
| Docker smoke        | Attempted pnpm docker:smoke — blocked before build because /var/run/docker.sock does not exist                                                                                                  |
| Container scan      | Attempted pnpm security:container — blocked because Docker could not export an image without its daemon                                                                                         |
| Disposable preview  | Health, 20 catalogue cards, exact footer, desktop/mobile report preview and overflow checks passed at localhost:3012 — existing localhost:3011 preview remained healthy                         |

The initial all-lessons browser journey exceeded the unchanged per-test timeout — the original journey retains both original lessons, while each of the 18 added lessons now has a separate full-control completion/reload/accessibility case rather than weakening assertions or raising timeouts

Additional regressions exposed wrapped select labels, report wording that assumed PCAPs, missing HTTP validation entries for Remove/Undo and draft writes from a disabled recorded review card — each was corrected before the final 56-test pass

The footer assertion is exactly 2026 | Study Lab — black StudyLab branding, final-activity controls, original connected reports, saved notes, copy confirmation, self-review separation and persistent Mistake Review removal remain covered

Moderate audit references: [glob cancellation traversal](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) and [minimatch amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249)

Docker image build/runtime persistence, image vulnerabilities and hosted CI/CodeQL remain unverified for this change — rerun pnpm docker:smoke and pnpm security:container after Docker Desktop/Engine is available

Real OpenAI connection/model/account availability, paid feedback quality, physical-phone/LAN connectivity, macOS and native Linux installation remain unverified — mock results and viewport tests do not establish those claims

The optional owner AI boundary is supported on a direct localhost host process — Docker bridge and LAN clients intentionally fail its socket check, as documented in ai-feedback.md

All data-changing validation used disposable databases — normal learner progress, the existing preview profile and Docker volumes were not used

## Course Depth Extension — Partial Checkpoint Verification

This is a tested partial implementation, not confirmation that the new full curriculum/news brief has been delivered — see depth-extension-status.md for explicit outstanding requirements

- pnpm check passed with 40 backend tests and 7 frontend tests, plus formatting, lint, both TypeScript configurations and all existing content/evidence checks
- pnpm build passed — no dependency, lockfile or Node/pnpm pin changes were required
- The final full desktop/mobile suite passed 64 tests in 3.4 minutes, including shared quiz drafts, explicit refresh, failed-save retention, stacked review, old-route compatibility and model owner controls
- Schema 4 real SQLite backup/restore preserved quiz references, model state, review state and ordinary answers, passed integrity checking and excluded the fake provider credential
- A separate real local HTTP run on disposable data started the model, applied all three defensive controls, waited for timed events, collected logs and paused with required service availability retained — this validates the model, not an operating-system or container lab
- Controlled-clock tests covered pause, resume, interruption, reset history, containment, block-all failure, session timeout, arbitrary-command rejection and owner/LAN restrictions
- Gitleaks found no secrets, dependency audit passed its HIGH/CRITICAL threshold with the same two moderate findings, and actionlint, Compose configuration and whitespace checks passed
- Docker smoke and container scanning were attempted and failed because /var/run/docker.sock is unavailable — no current image build or runtime scan pass is claimed
- Desktop/phone screenshots are in test-results/depth-quiz-desktop.png, depth-quiz-phone.png, depth-review-desktop.png, depth-review-phone.png, depth-lab-desktop.png and depth-lab-phone.png — preview overflow checks passed

The phone refresh dialog initially exceeded its viewport and prevented pointer access to its final button — the dialog now scrolls within a bounded viewport, and quiz navigation wraps rather than overflowing

The initial combined-review tests correctly exposed ambiguous controls from two stacked sections — assertions now target labelled Scheduled Review and Recorded Mistakes regions, preserving the original behaviour checks

Preview: http://localhost:3013 using /tmp/study-depth-preview.31kMrM/study.sqlite — previews 3011 and 3012 remained healthy and their profiles were not changed

The four primary quiz/model source modules occupy approximately 24 KB, with no model images or VM downloads added — model-specific peak RAM, CPU utilisation and a real isolated runtime were not benchmarked, so no measured hardware quota compliance is claimed

Professional three-level lesson assessments, news snapshots/updates and catalogue-integrated lab completion remain unimplemented — existing lesson passes must not be presented as validation of those absent requirements

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

## Smoke Helper Completion Boundary Fix — 6 November 2026

Worktree `/home/james/VibeCoding/study-lab-next-milestones`, branch `codex/next-milestones` — prior implementation and comment-audit edits preserved, with no application access-control or completion-rule changes

The old helper treated defence-lab as an ordinary keyed question and failed at the server's correct rejection — the corrected credential-free Docker flow now tests that boundary explicitly

- All ordinary tasks use real draft/check/self-review endpoints; lessons without lab requirements must complete
- A correct-looking lab draft cannot pass an ordinary check (400), and ownerless model verification remains forbidden (403); rejected operations must leave lesson state unchanged
- Completing the lab lesson must fail, and read mode must retain an unassessed lab draft with no correctness tick, self-review or recorded attempts
- Current result is explicitly 19/20 completed lessons with defence-lab incomplete, including after database reopen and real backup/restore
- The helper refuses an owner-enabled target and fails when persisted lab correctness is improperly set; it does not create or forward credentials
- Host-process lab tests separately exercise legitimate owner verification against server state, including incomplete objectives and forged bridge/success claims

Actual results for this fix:

| Check                                         | Result                                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused smoke/API and host-lab regression run | 9 tests passed; the actual helper reported 19/20 complete with defence-lab incomplete and passed read checks after reopening and real backup/restore                                         |
| `pnpm check`                                  | Passed formatting, lint, both type checks, content/evidence/depth validators, 55 backend tests and 7 UI tests; this includes the final bridge/forged-success/incomplete-objective assertions |
| `pnpm build`                                  | Passed production client/server build                                                                                                                                                        |
| Script/configuration checks                   | Bash syntax, Node syntax (after sourcing scripts/dev-env.sh), Compose configuration, actionlint and Git whitespace checks passed                                                             |
| Secret scan                                   | Native redacted Gitleaks passed with no leaks                                                                                                                                                |
| `pnpm docker:smoke`                           | Attempted, exited 1 before build: `/var/run/docker.sock` does not exist; its isolated cleanup also could not reach Docker                                                                    |
| `pnpm security:container`                     | Attempted, exited 1 because the image cannot be exported without the Docker daemon                                                                                                           |

The complete Docker flow is designed to run with the shipped owner-disabled Compose configuration, preserving the existing health/page/UID, isolated volume recreation, backup/restore and cleanup checks — its runtime result remains unverified until Docker is available

The previous helper's lab-check blocker is resolved by explicitly asserting the supported incomplete boundary; before PR sign-off, rerun `pnpm docker:smoke` and `pnpm security:container` with Docker Desktop/Engine running, then inspect hosted CI when authorised to push

No browser application code or controls changed, so the full browser suite was not rerun for this helper-only fix — its preceding audit result remains historical evidence, not a new run; no Docker image health/UID/volume or vulnerability success is inferred from the host CLI tests

The task-start baseline confirms changes are limited to the two smoke scripts, two test files and four documentation files — README, application code, content, lockfile, version pins and all earlier audit changes remain preserved; all data-changing tests used disposable databases and closed their own servers

## PR #6 Hosted CI Remediation — 9 November 2026

Verified worktree `/home/james/VibeCoding/study-lab-next-milestones`, branch `codex/next-milestones` — local HEAD, remote branch and PR head all matched `088fc9f2f5096eaede13ac1c1d5279bddf39aaa6` before editing; the worktree was clean

Evidence came from [run 42581459588](https://github.com/NM1na70/Study-Lab/actions/runs/42581459588), including codeql-reports/javascript.sarif, the full failed-job logs and all three browser trace ZIPs/error contexts/screencast screenshots — temporary copies are under /tmp/study-pr6-evidence, with no learner data used

### Eight CodeQL Findings

All eight are genuine `js/missing-rate-limiting` warnings (security severity 7.5) in src/server/app.ts — these are problem-query results with a related authorisation location, not taint-path results with codeFlows; each incoming request's owner header, socket IP and Host reaches AiService.authorise before the operation

| Finding | Original handler line | Operation                                     | Related authorisation line | Disposition                                                                                          |
| ------- | --------------------: | --------------------------------------------- | -------------------------: | ---------------------------------------------------------------------------------------------------- |
| 1       |                    34 | POST /api/news/update                         |                         35 | Fixed: request budget before owner validation and external fetch                                     |
| 2       |                   125 | GET /api/lab                                  |                        126 | Fixed: request budget before owner validation and state read                                         |
| 3       |                   133 | POST /api/lab                                 |                        134 | Fixed: request budget before owner validation and model mutation                                     |
| 4       |                   157 | GET /api/lab/history                          |                        158 | Fixed: request budget before owner validation and history reads                                      |
| 5       |                   174 | POST /api/lab/verify                          |                        175 | Fixed: request budget before owner validation and server-derived verification                        |
| 6       |                   258 | GET /api/ai/status                            |                        261 | Fixed: token-bearing status validation is covered, along with public status reads                    |
| 7       |                   269 | POST /api/ai/{connect,test,disconnect,cancel} |                        270 | Fixed: all generated control routes share the budget before owner validation                         |
| 8       |                   287 | POST /api/ai/feedback                         |                        288 | Fixed: request budget before owner validation; paid-request reservations/caps still apply separately |

Each related site passes request.headers['x-study-owner'], request.ip and request.headers.host to the same direct-loopback capability check — the existing feedback quota only bounded paid attempts after successful authorisation; it did not throttle rejected capabilities or the other seven handlers

Added exact @fastify/rate-limit 11.2.2, compatible with Fastify 5, and its frozen lockfile entries — owner routes share 120 requests per socket IP per 60 seconds with a bounded 1,000-entry in-memory cache; forwarded headers do not select a different budget, and changing owner route or token does not reset the counter

HTTP 429 includes Retry-After; ordinary lesson reads/writes remain outside this owner-only budget, and there is no localhost exemption, new owner access, durable credential storage or change to paid-request limits

Tests consume the budget using rejected owner credentials, cover every protected route family, reject forwarded-address rotation, confirm no provider/progress side effects, retain core saving, preserve LAN denial and recover deterministically after the window — no false-positive suppression or SARIF threshold/workflow change was used

### Browser Failure Causes And Fixes

| Hosted failure             | Trace evidence and cause                                                                                                                                                                                    | Correction and regression                                                                                                                                                                                                                                                                                                                                              |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop endpoint catalogue | Start returned revision 1, then the first command request contained command:"" and returned 400; persisted history contained every required command except ps, so verification correctly recorded incorrect | Start's unconditional setCommand('') erased ps typed while its response was pending; non-command responses now retain drafts, a successful command clears only its submitted draft, mutations use an immediate in-flight guard/confirmed revision and stale initial reads cannot overwrite newer state; the helper waits for real command history and enabled controls |
| Desktop fresh news         | The post-check self-review prerequisite draft was aborted by page.reload; there was no selfReview POST, and reload correctly showed facts checked but reviewed:false                                        | The test now waits for confirmed Self-review recorded before reload; a controlled-response gate proves no review confirmation appears while its draft save is pending, then persistence is asserted after completion — no application persistence rule was changed                                                                                                     |
| Mobile model               | Same empty-command request after Start; screenshot showed owner controls and terminal despite the intended desktop-only experience                                                                          | The shared draft-race fix applies on desktop; views at 720px or narrower now mount only the desktop explanation/lesson link, with no model transport or controls; mobile catalogue tests assess every ordinary question, assert zero model requests and retain incomplete lab/lesson state, and the standalone mobile case verifies return to ordinary work            |

The hosted browser fixtures were already isolated by database/server — no evidence indicated cross-test learner-state leakage or an incorrect portal output expectation; the mobile issue combined the same application race with a missing responsive boundary

All six original focused cases happened to pass locally before edits, consistent with an intermittent timing race — controlled real-response gates now exercise pending Start, newer typing during a command response and the news draft-before-review ordering without sleeps, retries or timeout changes

### Actual Validation

- Focused API/server/lab/AI regressions passed 28 tests
- Focused desktop/mobile browser scenarios plus the command-draft regression passed 8 cases
- pnpm check passed formatting, lint, both strict TypeScript checks, content/PCAP/synthetic evidence/depth validation, 56 backend tests and 7 UI tests
- Production build passed; full pnpm test:browser passed all 68 desktop/mobile cases in 3.3 minutes
- Frozen install, native redacted Gitleaks, actionlint, Compose configuration and Git whitespace checks passed
- pnpm security:audit passed its HIGH/CRITICAL threshold with two moderate advisories remaining
- Official checksum-verified CodeQL CLI 2.27.4 and codeql/javascript-queries 2.5.0 reproduced the exact eight original rate-limit findings on the untouched baseline; the full default 89-query suite on the fixed source returned zero findings and passed the unchanged check-sarif.py enforcement
- Final source snapshot was re-extracted and the full default suite completed with zero findings; its code files match the final working tree exactly, and check-sarif.py passed on the final SARIF directory
- Local pnpm docker:smoke and pnpm security:container were attempted and blocked by absent /var/run/docker.sock; hosted Docker smoke and container scanning were confirmed successful for the pushed baseline run, but no new image/runtime/scan pass is inferred for this unpushed limiter dependency

Hosted confirmation of these fixes remains pending because changes are intentionally uncommitted and unpushed — repeat Docker build/smoke/container scanning when available and inspect the next authorised CI run

No learner database, live preview or unrelated service was touched; lesson IDs/content, grading rules, Node/pnpm pins, Docker/Compose/CI configuration, SARIF enforcement and the corrected smoke helper remain unchanged

Suggested commit message: fix(ci): throttle owner routes and stabilize browser state checks

## Eight UI/UX Improvements — 9 November 2026

Folder `/home/james/VibeCoding/study-lab`, branch `codex/ui-ux-clarity-course-quiz`, unchanged HEAD/base `acacf0af481b11a9f3693b78a8a30a3ab7189874` (merged PR #6). The branch was created from the clean, fetched main in the original folder. All implementation remains uncommitted and unpushed. Other worktrees, learner profiles and previews were preserved.

### Implemented Outcomes

| Issue                | Result                                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Dashboard        | Your Courses is h1; labelled filters and Continue Studying occupy the left header, actual completion totals stay right, and cards follow below. Removed the three promotional lines and dashboard Review Due shortcut; scheduled review remains on Mistake Review. Mobile stacks without horizontal overflow                                                |
| 2 — Lesson cards     | Reviewed all 20 titles/descriptions and updated sequence/prerequisite references. Examples include Investigate Process And Network Activity, Check And Preserve Digital Evidence, and Put Incident Events In Time Order. IDs, technical depth, order, duration and progress remain intact                                                                   |
| 3 — Question clarity | Reviewed every task across both courses; explicit prompt/instructions/exercise metadata separates contextual exercises through one escaped React renderer. For example, Complete the request with a polite word appears above ___ send the revised list. Longer professional/reading/lab instructions use lists; evidence text is retained                  |
| 4 — Writing examples | Reviewed all written and report reasoning examples. The Jo/Mina email has a greeting, two message-body sentences, and thanks, without an invented sender. Guidance explicitly excludes greeting/closing from the sentence count. Other examples retain their appropriate report/note/steps format                                                           |
| 5 — Solutions        | Shared Full Solution / Example Answer / Example Report headings are 2 px above panel body size. Short factual answers are bold and explanations regular. Explicit common-word display casing leaves accepted keys, commands, URIs, paths and identifiers unchanged; assistance remains recorded                                                             |
| 6 — Example reports  | Model fields use bullets with bold labels and regular answers, grouped by authored report layout or the original capture's explicit evidence sections. Reading/professional reasoning demonstrates supplied evidence, alternatives and limits. Learner previews and drafts never receive model values                                                       |
| 7 — Checked feedback | Each submitted objective field shows Correct, Wrong or Not Answered, with the actual entered value and non-revealing field guidance. Reasoning remains separately self-reviewed. Editing hides stale results and asks for a new check                                                                                                                       |
| 8 — Daily Quiz       | Accessible course tabs retain independent positions, flush pending drafts and show actual course counts/mix/minutes. New sessions target seven incomplete task units per course with 2 Easy / 3 Medium / 2 Hard. Existing mixed sessions remain unchanged until explicit Refresh; failed saves retain drafts/session and revision conflicts remain enforced |

Selection uses same-course nearby difficulty fallback, all available work if fewer than seven remain, and alternatives before unfinished repeats. It never adds duplicates, completed questions or filler and never borrows across courses. Each reading activity/lab counts once with its full metadata duration. Completion messages are course-specific; global congratulations requires neither course to have incomplete work. A single Refresh confirms both selections, listing unfinished items with their course; there is no automatic date-based refresh.

An empty disposable profile actually selects seven questions per course with the preferred 2/3/2 mix: English 74 minutes and Cybersecurity 51 minutes, 125 combined. The interface shows each course's actual estimate and its difference from the 60-minute aim; 120 combined is labelled as the target, not the actual total. No duration metadata was changed to force a target.

### Actual Validation And Recovery

| Check                                                | Actual result                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen dependency installation                       | Passed; package.json, lockfile and Node/pnpm pins unchanged                                                                                                                                                                                                                                                     |
| Focused quiz/UI tests                                | 23 passed                                                                                                                                                                                                                                                                                                       |
| Focused desktop/mobile regressions after heading fix | 38 passed in 1.5 minutes                                                                                                                                                                                                                                                                                        |
| pnpm check                                           | Passed format, lint, both strict TypeScript checks, all 20 lessons and PCAP/synthetic/professional/reading evidence validation; 61 backend and 11 UI tests                                                                                                                                                      |
| pnpm build                                           | Passed production client and server compilation                                                                                                                                                                                                                                                                 |
| Full pnpm test:browser                               | 82 passed, 41 desktop and 41 mobile, in 3.5 minutes; recovered complete final output after the interruption, not inferred from partial progress                                                                                                                                                                 |
| Local CodeQL                                         | CLI 2.27.4, javascript-queries 2.5.0 default code-scanning suite; final source snapshot re-extracted, zero warning/error findings, unchanged scripts/check-sarif.py passed                                                                                                                                      |
| Secret scan                                          | Native Gitleaks 8.30.1 scanned the working directory including new files: no leaks; redacted report in /tmp/study-ui-gitleaks.json. The wrapper's existing reports/gitleaks.json was root-owned/unwritable, so the equivalent native scan used a separate report without changing permissions or scanner policy |
| Dependency audit                                     | Passed HIGH/CRITICAL threshold; recovered and resumed results both report two moderate, zero high and zero critical advisories. No unrelated dependency upgrade applied                                                                                                                                         |
| Configuration/whitespace                             | actionlint, docker compose config --quiet and git diff --check passed                                                                                                                                                                                                                                           |
| Docker smoke                                         | Attempted before and after interruption; blocked by absent /var/run/docker.sock, so no image/runtime/persistence smoke pass is claimed                                                                                                                                                                          |
| Container scan                                       | Attempted before and after interruption; blocked by the same missing daemon; no container vulnerability pass is claimed                                                                                                                                                                                         |
| Visual inspection                                    | Actual Chromium at 1280×900 and 390×844; dashboard/cards, both quiz tabs, separated exercise and Full Solution, paragraph email, structured example report and all three feedback labels inspected; captures check no horizontal overflow                                                                       |

An earlier full browser run returned 78 passed / 4 failed: promoting Your Courses to h1 exposed skipped h3 card headings in axe on both sizes. Cards now use h2 while retaining their styling, and the new dashboard test checks accessibility before filtering cards away. The focused and full final reruns above passed. Initial strict-locator errors in the new report tests were corrected by asserting the complete solution panel across all groups. Initial formatting and CodeQL-without-Node attempts were corrected and rerun, not counted as passes. No assertion, access boundary, timeout, retry policy or scanner threshold was weakened.

The screenshot command immediately before the usage interruption was not executed. Its recorded review response said automatic approval review could not complete, included a usage-limit message, and explicitly said this was not an unsafe-action determination. No separate unsafe-action rejection reason was available. After resumption a new readable temporary script with plain localhost URLs, structured arguments and explicit waits was approved and captured the disposable preview successfully. An earlier executed capture had timed out because its conditional visibility check preceded mounted controls; it supplied only the two initial desktop images and was not treated as complete visual evidence.

Raw local evidence: `/tmp/study-ui-check.log`, `/tmp/study-ui-build.log`, `/tmp/study-ui-focused-browser.log`, `/tmp/study-ui-browser-final.log`, `/tmp/study-ui-codeql-final.sarif`, `/tmp/study-ui-codeql-final-analysis.log`, `/tmp/study-ui-docker-resumed.log`, `/tmp/study-ui-container-resumed.log`, `/tmp/study-ui-audit-resumed.json` and `/tmp/study-ui-secrets.log`. These temporary files are outside Git and may not survive a host reboot. The Playwright HTML report also remains in ignored playwright-report/.

### Preservation And Comment Audit

Compared the complete content against the task-start copy in `/tmp/study-ui-baseline-pjzw96r1`: all 20 lesson IDs/versions, task/field IDs, answer arrays, normalisation policies, options, marking rules, report layouts/mappings, quiz difficulty/duration metadata, source records and evidence passages are unchanged. Only display copy/metadata/examples, prerequisite title references and the email body-count guidance differ. README, dependency pins, Docker/CI configuration, storage/migration code and model/provider access boundaries remain byte-identical. No schema/content-version bump, migration, live database operation or credential was introduced. The footer assertion still expects exactly `2026 | Study Lab`.

The final inventory covers 87 human-maintained code/config/entry files, including the two new untracked code files: 17 client, 8 server, 6 shared, 20 test, 16 script and 20 configuration/entry files. Reviewed existing grouped explanations and the important logical blocks, with particular attention to persistence, assessment, security, stale state, safe rendering and save ordering. Most unchanged files already had useful comments from the prior audit; no redundant comments were added for activity's sake. No comment-count tool was added.

Exact inspected scope:

- Client: Ai.tsx, AnswerControls.tsx, App.tsx, DailyQuiz.tsx, Lab.tsx, News.tsx, QuestionPresentation.tsx, ReportBuilder.tsx, Review.tsx, ReviewDue.tsx, TaskCard.tsx, api.ts, main.tsx, navigation.ts, style.css, use-progress.ts and vite-env.d.ts
- Server: ai.ts, app.ts, lab.ts, main.ts, news.ts, quiz.ts, reviews.ts and store.ts; shared: domain.ts, lab.ts, lessons.ts, migrate.ts, review.ts and schema.ts
- Tests: ai.test.ts, catalogue.test.ts, commit.test.ts, domain.test.ts, lab.test.ts, news.test.ts, quiz.test.ts, reviews.test.ts, server.test.ts and ui.test.tsx; browser: ai.spec.ts, answers.ts, catalogue.spec.ts, daily.spec.ts, fixtures.ts, lab.spec.ts, milestones.spec.ts, news.spec.ts, presentation.spec.ts and study.spec.ts
- Scripts: backup.mjs, check-commit-msg.mjs, check-sarif.py, dev-env.sh, docker-smoke.sh, generate-capture.py, generate-evidence.py, install-hooks.sh, restore.mjs, scan-container.sh, scan-secrets.sh, smoke-progress.mjs, validate-content.ts, verify-capture.py, verify-depth.py and verify-lessons.py
- Configuration/entry files: .dockerignore, .env.example, .gitattributes, both .githooks launchers, .github/dependabot.yml, .github/workflows/ci.yml, .gitignore, .node-version, .npmrc, .prettierignore, Dockerfile, compose.yaml, eslint.config.js, index.html, lefthook.yml, playwright.config.ts, pnpm-workspace.yaml, vite.config.ts and vitest.config.ts

Comments were added/updated with the implementation in DailyQuiz.tsx, QuestionPresentation.tsx, TaskCard.tsx, style.css, quiz.ts, schema.ts, daily.spec.ts, presentation.spec.ts, quiz.test.ts and ui.test.tsx. ReportBuilder.tsx received only a correction to its now-outdated preview explanation. All other modified code files were reviewed for existing useful block comments. Sentence case, acronym spelling, blank-line grouping and valid JSX/CSS syntax were checked; directives, shebangs and executable modes were preserved.

Separately inspected strict JSON configs (.prettierrc.json, package.json and both tsconfig files) without inserting comments. Authored lesson/sequence/case/evidence JSON remains comment-free, with relationships explained in architecture/workflow documentation. Justified exclusions: installed/vendor code, lockfiles, generated build/test/scanner output and public evidence copies, binaries/PCAP/images, learner databases/exports/backups and prose documents from code-comment insertion. Their relevant first-party generators, validators and instructions were reviewed instead.

### Screenshots And Disposable Preview

All eight original issue screenshots were inspected through their WSL paths; the additional clipboard image duplicates issue 6. None is unavailable. After resuming their availability was checked again. Updated full-page, viewport and readable element captures are in `/tmp/study-ui-screenshots/`: dashboard/card, English/Cybersecurity quiz, question, email and report, with desktop/phone variants. In particular, `dashboard-desktop-viewport.png`, `dashboard-phone-viewport.png`, `email-phone-solution.png`, `report-phone-feedback.png` and `report-phone-solution.png` show the agreed changes clearly. The captures use only disposable learner work and contain no owner token or live profile.

Preview: http://localhost:3020/ — binds 127.0.0.1, database `/tmp/study-ui-preview.Hs6Cy2/study.sqlite`, owner capability unset. No external provider/feed was invoked. Chromium phone viewport coverage is not physical-device testing. Hosted CI, real paid AI and Docker runtime/scan confirmation remain unverified.
