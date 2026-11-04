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
