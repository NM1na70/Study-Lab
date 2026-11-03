# Study Lab engineering rules

- Work in the opened repository on a feature branch. Preserve user edits and README.md. Never push, merge, publish or change remote settings without explicit user instruction.
- Keep the local single-learner app lightweight. No required AI, cloud services, runtime downloads or paid dependencies. Keep learner data and secrets out of Git and images.
- Use strict TypeScript, input validation, parameterised SQL and focused modules. Explain important persistence, assessment and security boundaries in comments.
- Content lives in content/lessons.json. Keep stable task IDs and explicit versions. Research reputable sources; record page support/access/licence; validate practical evidence against bundled assets. Never auto-publish generated lessons.
- Precise marking is deterministic. Writing uses explicit self-review. Hints precede explicit solutions; record assistance. Never equate self-review or assisted completion with verified mastery.
- Run pnpm check, pnpm build, pnpm test:browser, pnpm docker:smoke and applicable security scans. Fix failures, report unavailable infrastructure honestly. Do not weaken required checks.
- Keep scripts executable, LF endings, a frozen lockfile and consistent Node/pnpm pins. Use Linux tools in WSL.
- Keep docs/development-handover.md accurate when pausing or finishing. See docs/architecture.md and docs/development-workflow.md for procedures.

## Code comment style

- Explain each main logical block in simple English with one useful comment for a related group, rather than one comment per line. Use meaningful purpose descriptions and accurate safeguard explanations, not labels such as “Functions” or “Handle logic”. Add a short internal comment when important non-obvious logic needs more detail
- Start explanatory comment text with a capital letter, use normal sentence case, and omit the final full stop. Preserve names and acronyms such as React, TypeScript, GitHub, API, SQLite, AFP and CommBank
- Put one blank line before a new main block's comment, except at the beginning of a file or where syntax requires otherwise. Keep the comment directly above its code and keep consecutive lines explaining the same block together without blank lines
- Follow the grouped examples in docs/development-workflow.md: one comment above related imports, one above related state/ref declarations, and a precise internal comment above a safeguard. Preserve and improve useful nearby comments rather than adding duplicates; update them whenever behaviour changes
- Apply these rules to first-party frontend/backend/shared code, tests, CSS, scripts, Docker/Compose, GitHub Actions, hooks and configuration formats that support comments. Use valid syntax, including JSX comments inside JSX; do not force comments into tiny obvious files
- Preserve shebangs, licence notices, compiler directives, tool annotations, URLs, and other machine-sensitive text. Do not add comments to strict JSON, lockfiles, generated files, build output, dependencies, reports, evidence summaries, PCAPs, images, databases or other binary files. Explain important non-commentable configuration in existing documentation; never add comment-count tooling
