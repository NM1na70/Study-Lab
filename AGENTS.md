# Study Lab project instructions

Study Lab is a lightweight local application for practical English and cybersecurity learning through explanation, practice, evidence, feedback and review — read the [project brief](docs/project-brief.md) for durable goals

## Before editing

- Identify the actual working folder, branch and worktrees; inspect Git status, including untracked files, and all applicable AGENTS.md files
- Briefly identify the active instruction files and relevant rules; read the project brief, relevant [workflow](docs/development-workflow.md), [current status](docs/depth-extension-status.md) and [handover](docs/development-handover.md)
- Inspect the existing implementation; continue in the worktree with the latest work on a feature branch, preserving all user edits and untracked files — do not replace the project or switch to an older checkout
- Resolve routine choices within the authorised task; ask only when a material requirement is genuinely ambiguous
- Later explicit user requirements can update project preferences, subject to applicable platform/system requirements — repository instructions do not override those requirements

## During development

- Keep changes focused; follow established architecture, naming and reusable components, strict TypeScript, validated input, parameterised SQL and focused modules without unnecessary abstraction
- Preserve accessibility, mobile behaviour, two-Enter checking, autosave, save-aware navigation and assessment boundaries
- Keep core learning usable without AI, cloud services, runtime downloads or paid dependencies; keep secrets, owner tokens and learner data out of Git, images and reports intended for sharing
- Use disposable test databases and isolated test resources; never reset learner progress, delete learner volumes or stop unrelated services
- Keep stable lesson/question IDs and explicit content versions; record authoritative sources, access/support/reuse information and validate evidence-backed answers — never silently publish generated lessons
- Keep deterministic factual checks separate from explicit reasoning self-review and AI advice; record hints/solutions as assistance, without claiming verified mastery
- Add/update code comments with the code they explain; keep documentation accurate and distinguish plans, implementation and actual verification
- Use Linux tools in WSL, executable scripts, LF endings, frozen lockfiles and consistent Node/pnpm pins

## Code comments — complete short rules

- Add one useful code comment above each main logical block needing explanation — group related imports, useful interface/type definitions, related state/refs, important functions/effects and meaningful JSX sections
- Explain purpose or reasoning in simple, accurate English; add internal code comments for non-obvious guards, save ordering, concurrency, persistence, assessment and security boundaries
- Do not comment every line, duplicate useful nearby explanations or add generic labels that merely repeat names; do not force commentary into tiny obvious files
- Begin explanatory text with an uppercase letter, use normal sentence case and omit the final full stop; preserve React, TypeScript, OpenAI, API, HTTP, AFP, ASD, ACSC, ADF, CommBank and other established names/acronyms
- Put a blank line before a new block's code comment, except at file start or where syntax requires otherwise; place it directly above its code and keep consecutive explanations of the same block together without blank lines
- Use valid syntax: `//` in TypeScript/JavaScript, `{/* */}` inside JSX, `/* */` in CSS and `#` in shell/Python/YAML where supported
- Preserve directives, shebangs, licence notices, attribution, URLs and tool-specific comments exactly where machine-sensitive — never restyle required syntax as prose
- Never add comments, fake comment fields or JSONC conversions to strict JSON; explain fields/relationships in Markdown instead
- Exclude dependencies/vendor code, generated build output/reports/evidence, lockfiles, binaries and learner databases/backups/exports — explain relevant human-maintained generators/validators instead
- See [workflow examples](docs/development-workflow.md#code-comment-examples); do not create comment-count tooling

## Before finishing

- Review every new/modified first-party code file within the task for code-comment compliance; this is not permission to begin an unrelated repository-wide audit
- Verify relevant behaviour, run applicable checks using the [validation guidance](docs/development-workflow.md#validation-by-change), and inspect the task-relative diff for unintended changes
- Update the handover before finishing or pausing; report scope/preservation, code-comment review, actual checks, documentation accuracy and remaining limitations briefly
- Report failures and unavailable infrastructure honestly; never claim hosted CI, Docker, physical-phone use or live AI passed without actual verification, or weaken assertions/security checks
- After significant instruction changes, explicitly reread the revised instruction files in the current conversation
- Repository files are the current development reference; uploaded Sources copies may be stale and do not automatically synchronise

## Git commits and PRs — separate from code comments

A code comment explains source code; a Git commit records a repository change — clarify context if the user says “commit” while discussing comments, without treating that wording alone as Git authorisation

- Do not commit, push, merge, publish or change remote settings without explicit authorisation; leave changes uncommitted and unpushed by default
- When requested, suggest accurate Conventional Commit messages matching repository validation, with concise titles and no trailing full stop — code-comment capitalisation does not apply to prefixes such as `feat` or `fix`
- Keep logical scope and exclude unrelated files, secrets, API keys, owner tokens, learner data and generated test reports
- PR descriptions explain the concrete change, actual validation and material limitations; no additional approval process is implied

See [architecture](docs/architecture.md), [operations](docs/operations.md), [content provenance](docs/content-and-sources.md) and [verification](docs/verification.md) when relevant
