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
