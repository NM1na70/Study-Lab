# Architecture

Study Lab is one local learner per installation: a React 19 UI built with Vite 8, a Fastify 5 HTTP server, strict TypeScript 6, Zod 4 boundary validation and Node 24's built-in SQLite. Exact versions are in package.json/pnpm-lock.yaml; Node 24.22.2 and pnpm 10.32.1 match local setup, Docker and CI. TypeScript 6 stays within typescript-eslint's supported range. ESLint 10 is current; accessibility is checked with axe in Chromium rather than an incompatible ESLint plugin.

The default runtime is one non-root container, one HTTP port and one named volume. No separate database service, accounts, AI integration, analytics, CDN or runtime content download. Small synchronous SQLite operations are proportionate to one learner. Node's SQLite API is a built-in dependency; do not enable SQLite extensions.

## Codebase map

| Path                       | Responsibility                                                      |
| -------------------------- | ------------------------------------------------------------------- |
| src/client/App.tsx         | Dashboard, lesson route, review list and mobile evidence view       |
| src/client/TaskCard.tsx    | Inputs, hints, solution disclosure and explicit writing self-review |
| src/client/use-progress.ts | Serialised saves, confirmed persistence and error recovery          |
| src/client/api.ts          | HTTP transport                                                      |
| src/client/style.css       | Local responsive styles and focus treatment                         |
| src/shared/schema.ts       | Lesson, progress and mutation contracts                             |
| src/shared/domain.ts       | Pure marking, completion and mutation rules                         |
| src/shared/lessons.ts      | Parse bundled lesson pack                                           |
| src/server/app.ts          | Validated API, security headers and static serving                  |
| src/server/store.ts        | SQLite schema and transactional persistence                         |
| content/lessons.json       | Two original, versioned lessons and source metadata                 |
| public/evidence/           | Real synthetic PCAP, decoded summary and attribution                |
| scripts/                   | Content/capture validation, hooks, backup and smoke/security checks |
| tests/                     | Domain, HTTP integration, UI and full browser flows                 |
| .github/workflows/ci.yml   | Independent required checks                                         |

## Persistence and assessment

SQLite schema v1 has a progress table keyed by stable lesson ID. Each JSON state records content version, revision, task answers, checked attempt counts, wrong-attempt counts, hint/solution use, current activity, explicit self-review, completion timestamp and update timestamp. Draft keystrokes are not counted as assessed attempts. Each checked precise answer is also retained with its result and timestamp; mistake review displays the last incorrect answer. Draft keystrokes are not an assessment history.

Writes run inside BEGIN IMMEDIATE. The server compares the submitted revision before mutation; stale writes receive 409. The client serialises writes and only displays saved after a successful response. A 350 ms debounce reduces typing writes; checking and normal navigation flush the current answer first. Errors stop the queue and preserve the visible input. Retry is explicit. Other windows/devices must reload after a revision conflict. This prevents an older response from overwriting newer work.

Exact questions accept only declared answers with declared normalisation. Spelling accepts case/outer-space differences, never fuzzy spelling. The URI question preserves case. Writing is never classified as technically correct by the server: the learner compares the rubric/checklist and records self-review. A minimal non-empty-content guard prevents accidental blank reviews; it is not grading. All exact tasks plus written self-reviews are required before explicit completion. Editing assessed work reopens completion. Hints and explicit solution use persist; assisted completion does not imply independent mastery.

All activities are unlocked; order is recommended only. Browser evidence disclosure is labelled as a spoiler. The raw capture is intentionally public learning material.

## Versions and future changes

Do not rename task IDs in place. Before editing content, decide whether answer keys/meaning changed and bump its version. In Milestone 1, mismatched content versions preserve old state and reject edits with 409. An explicit migration/review policy must accompany future packs; do not silently discard or transfer correctness to changed questions. SQLite schema changes need numbered migrations and backup/restore testing. Schema v1 is the only schema currently implemented.

Future AI can sit behind a small server-side provider interface (disabled/no-AI, separately funded user API, later local provider). No provider interface or credentials are installed now. Deterministic assessment remains in domain code. See roadmap.md.
