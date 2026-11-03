# Study Lab engineering rules

- Work in the opened repository on a feature branch. Preserve user edits and README.md. Never push, merge, publish or change remote settings without explicit user instruction.
- Keep the local single-learner app lightweight. No required AI, cloud services, runtime downloads or paid dependencies. Keep learner data and secrets out of Git and images.
- Use strict TypeScript, input validation, parameterised SQL and focused modules. Explain important persistence, assessment and security boundaries in comments.
- Content lives in content/lessons.json. Keep stable task IDs and explicit versions. Research reputable sources; record page support/access/licence; validate practical evidence against bundled assets. Never auto-publish generated lessons.
- Precise marking is deterministic. Writing uses explicit self-review. Hints precede explicit solutions; record assistance. Never equate self-review or assisted completion with verified mastery.
- Run pnpm check, pnpm build, pnpm test:browser, pnpm docker:smoke and applicable security scans. Fix failures, report unavailable infrastructure honestly. Do not weaken required checks.
- Keep scripts executable, LF endings, a frozen lockfile and consistent Node/pnpm pins. Use Linux tools in WSL.
- Keep docs/development-handover.md accurate when pausing or finishing. See docs/architecture.md and docs/development-workflow.md for procedures.
