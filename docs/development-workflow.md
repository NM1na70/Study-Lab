# Development workflow

AGENTS.md, this workflow and the project brief are Markdown instructions to read and follow, not executable scripts — run example commands only when appropriate to the authorised task

Ordinary study needs Docker Desktop with WSL integration, Git and Docker Compose, not host Node. Development uses Linux-native Node **24.22.2**, pnpm **10.32.1**, Python 3 and Chromium for Playwright. Do not use Windows npm/pnpm from /mnt/c.

## Linux tools

This workstation has checksum-verified Node installed at `$HOME/.local/share/study-lab/node-v24.22.2-linux-x64`; pnpm is installed inside that distribution. From the repository:

```bash
source scripts/dev-env.sh
command -v node pnpm
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm hooks:install
```

On a fresh WSL installation, download the Linux x64 Node 24.22.2 tarball and SHASUMS256.txt from [nodejs.org](https://nodejs.org/dist/v24.22.2/), verify its SHA256 with `sha256sum -c`, extract it into `$HOME/.local/share/study-lab`, then prepend its bin directory to this shell's PATH and run `npm install --global pnpm@10.32.1`. No system Node, global npm config or shell profile edits are needed. For a different Linux-native installation, set STUDY_NODE_BIN before sourcing the helper.

## **Coordinated Node Updates**

Study Lab stays on Node **24.22.2** for this maintenance baseline — `package.json` pins that exact release and `.npmrc` keeps `engine-strict=true`

Dependabot ignores `node` Docker versions `>=25` using the [documented Docker ignore range syntax](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#versions-ignore) — npm packages, GitHub Actions and other Docker dependencies keep their existing update policies

Node 24 Docker updates can still be proposed, but an image-only PR is not ready to merge — even a Node 24 patch release fails the exact engine check until the remaining pins are updated in the same change

| Update together                              | Required action                                                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json` → `engines.node`              | Set the selected exact Node 24 release, rather than widening the allowed engine range                                                                         |
| `.node-version`                              | Use the identical exact version for local tools and CI                                                                                                        |
| Both Dockerfile `FROM node:` lines           | Use the same version in the `bookworm-slim` build stage and the `alpine` runtime stage                                                                        |
| Local Linux Node installation                | Install the checksum-verified selected release and confirm `node --version` after sourcing `scripts/dev-env.sh`                                               |
| `.github/workflows/ci.yml`                   | Keep every Node setup step reading `.node-version` and update any future independent exact reference                                                          |
| Current setup and architecture documentation | Update the Node download URL, user tool directory, version table and other current exact-version examples — keep dated historical verification records intact |

Review Node release/security notes and image availability before choosing a newer Node 24 release — review compatible Node type definitions and pnpm separately instead of changing unrelated dependencies automatically

Keep pnpm's package-manager pin consistent between package.json, Docker and CI if it needs a separate update — never bypass engine validation to make a Node image proposal pass

Use `rg -n --hidden '24\.22\.2|FROM node:|node-version|engine-strict' package.json .node-version .npmrc Dockerfile .github scripts/dev-env.sh README.md docs` from the repository root to review the current references before changing the version

After coordinating the files, use the selected local Node and run frozen installation, `pnpm check`, `pnpm build`, `pnpm test:browser`, the isolated `pnpm docker:smoke` and `pnpm security:container` against the freshly built image — confirm the non-root runtime's Node version during Docker validation and record any unavailable checks

An upgrade beyond Node 24 is a separate compatibility decision that must also deliberately revise the Dependabot limit — the limit is not permission to ignore security fixes within Node 24

## Working procedures

At task start, briefly identify the active AGENTS.md files and relevant rules — read the [project brief](project-brief.md), [current status](depth-extension-status.md), [handover](development-handover.md) and applicable architecture/content/operations guidance

Identify the actual folder, branch and worktrees with Git before editing — continue with the latest implementation and inspect tracked, staged and untracked changes rather than assuming a clean repository

Keep work on a feature branch and preserve every existing edit, including README and untracked files — do not switch to an older checkout, reset/stash away user work or create a replacement project

Resolve routine choices within the authorised scope; clarify genuinely ambiguous material requirements — no extra approval process is required for ordinary authorised work

Capture a task-start baseline when existing uncommitted work makes the diff ambiguous, then compare only this task's changes at completion — Git HEAD alone may include earlier work

Preserve the architecture, reusable controls, accessibility, mobile behaviour, assessment boundaries and saving/navigation semantics — update code comments alongside the implementation and keep plans separate from verified behaviour

Use disposable databases and isolated test resources — never point a test at live progress, delete learner volumes, or stop unrelated services

Before pausing, save the handover with the exact folder/branch, implementation state, outstanding work, actual checks, owned processes and restart commands — preserve necessary disposable state and honour an explicit pause until the user resumes

Historical dated notes are evidence, not new permanent requirements — current status lives in the linked handover/status records, not a workflow-specific temporary port or fixed test count

### Local commands

```bash
source scripts/dev-env.sh
pnpm build
pnpm dev                 # API/static app: http://127.0.0.1:3000
# Optional second terminal, after sourcing scripts/dev-env.sh:
pnpm dev:client          # Vite UI/HMR: http://127.0.0.1:5173
```

Vite proxies /api while preserving the incoming Host header, so its UI can use the same-origin write guard. Production/browser acceptance checks use the built assets. Do not disable the server's origin guard for convenience. The API defaults to a Git-ignored data/study.sqlite; the Docker learner has its own named volume.

```bash
pnpm check
pnpm build
pnpm exec playwright install --with-deps chromium
pnpm test:browser
pnpm docker:smoke
pnpm security:audit
pnpm security:secrets
pnpm security:container
```

`pnpm check` runs format check, lint, both TypeScript checks, lesson/PCAP validation, backend tests and UI tests. Browser tests exercise the implemented catalogue, refresh/resume, mistakes, self-review, hints/solutions, external-request blocking, responsive viewports and axe accessibility. HTTP integration tests reopen SQLite. Docker smoke uses its own named volume/port, checks ordinary assessments and explicit rejection of forged/ownerless lab completion, recreates the container and verifies persisted state and UID. The owner-only model question remains incomplete in Docker; [operations](operations.md#docker-smoke-coverage-and-owner-lab-limits) distinguishes that coverage from legitimate host-process verification. Its EXIT trap deletes **only its own test resources**.

On this WSL host, `scripts/dev-env.sh` reuses the existing user-scoped browser libraries when valid and preserves the caller's LD_LIBRARY_PATH — no second manual export is needed

In a fresh Ubuntu terminal, enter the active repository and run:

```bash
source scripts/dev-env.sh
pnpm test:browser
```

For a fresh supported environment without those libraries, use the installed Playwright version's `pnpm exec playwright install --with-deps chromium` setup — report required privileges or unavailable infrastructure honestly instead of claiming startup works

CI uses Playwright's supported dependency installation — do not assume the workstation-specific library directory is needed elsewhere

## Commits, PRs and checks

The repository-local hooks path is `.githooks`. Shell launchers restore the project Linux tool path, then invoke installed/versioned lefthook. `pre-commit` runs pnpm check; commit-msg validates the whole subject, including `feat!: ...` and `feat(scope)!: ...`. Tests cover valid/invalid subjects. Hooks need installed dependencies and the Linux Node path; required CI quality checks also enforce validation if hooks are absent or bypassed.

Code comments explain source; Git commits record changes — saying “commit” in a code-comment discussion is not by itself authorisation to create a Git commit

Do not commit, push, merge, publish or change remote settings without explicit user authorisation — when authorised, inspect the task-relative diff and include only the reviewed logical scope

Suggest Conventional Commit subjects matching [the validator](../scripts/check-commit-msg.mjs), for example `fix(quiz): preserve unfinished selections` — keep the title concise without a trailing full stop, and do not capitalise `fix` merely because code comments start uppercase

PR descriptions lead with the concrete change, then actual validation and material limitations — never include secrets, API keys, owner tokens, learner data or generated test reports

Current CI configuration and hook validation remain the implementation reference — this document does not mandate new branch protection, merge strategies or additional approvals, and hosted results must be checked before claiming success

PR title is passed through an environment variable, never interpolated into shell code. Workflows use pull_request, not pull_request_target. Hosted CI remains unverified until pushed and completed. See security.md for scanner failure thresholds.

## Code comment examples

The complete short style is in [AGENTS.md](../AGENTS.md#code-comments--complete-short-rules) — apply it while writing or modifying first-party code, rather than performing an unsolicited repository-wide audit

One useful explanation covers each main block needing explanation — imports, an interface/type where useful, related state/refs, important functions/effects and meaningful JSX sections; internal comments explain non-obvious safeguards and ordering

These examples are illustrative Markdown, not a request to modify application code

```tsx
// Import React state tools and the shared progress contract
import { useRef, useState } from 'react';
import type { Progress } from '../shared/schema';

// Describe the confirmed progress and callback supplied by the parent
interface Props {
  progress: Progress;
  onSave: (answer: string) => Promise<boolean>;
}

function AnswerEditor({ progress, onSave }: Props) {
  // Keep the visible draft and pending save separate from confirmed progress
  const [draft, setDraft] = useState('');
  const saving = useRef(false);

  // Save the current draft without starting overlapping writes
  async function save() {
    // Reject a second action while the first write has an uncertain outcome
    if (saving.current) return;
    saving.current = true;
    try {
      await onSave(draft);
    } finally {
      saving.current = false;
    }
  }

  // Present editing controls alongside the confirmed lesson identity
  return (
    <section aria-label={progress.lessonId}>
      {/* Provide a labelled draft field and an explicit save action */}
      <label>
        Answer
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
      </label>
      <button onClick={() => void save()}>Save Answer</button>
    </section>
  );
}
```

TypeScript/JavaScript use `//`; JSX comments inside markup use `{/* */}` — explanatory text starts uppercase, uses sentence case and has no trailing full stop

```css
/* Keep long evidence lines inside their reading panel */
.evidence {
  overflow-wrap: anywhere;
}
```

Shell, Python and YAML support `#` comments — preserve shebangs and machine-sensitive annotations as required

```bash
#!/usr/bin/env bash

# Use the repository's Linux toolchain in this shell
source scripts/dev-env.sh
```

```python
# Retain only records belonging to the requested case
records = [record for record in records if record['case_id'] == case_id]
```

```yaml
# Restrict this job to read-only repository access
permissions:
  contents: read
```

Keep related explanation lines together and place a blank line before each new block's comment except at file start or where syntax requires otherwise — never add a label such as “Functions” or narrate every line

Preserve React, TypeScript, OpenAI, API, HTTP, AFP, ASD, ACSC, ADF and CommBank spelling, plus directives, attribution, licence notices, URLs and tool annotations — prose styling must not change required syntax

### Non-commentable files

Strict JSON receives no inline comments, fake comment fields, JSONC conversion or format change — explain structure and relationships in suitable Markdown

For example, package.json defines scripts and version pins; TypeScript JSON configuration defines compilation boundaries; content/lessons.json holds stable lesson/question IDs, versions, source references and assessment relationships — consult [architecture](architecture.md) and [content provenance](content-and-sources.md)

Exclude dependencies/vendor code, generated output/reports/evidence, lockfiles, binaries and learner databases/backups/exports — explain relevant human-maintained generators and validators instead, and never add comment-count tooling

## Validation by change

| Change                                    | Appropriate verification                                                                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instructions/Markdown only                | Markdown formatting, relative links, consistency and the task-start preservation diff — no whole application suite solely for prose edits                                                         |
| First-party code/configuration            | Review code comments in all new/modified first-party files, run relevant behaviour tests and applicable format/lint/type/build checks                                                             |
| Learning controls, persistence or content | Run affected domain/API/UI/evidence/migration tests and relevant desktop/mobile scenarios, then the full applicable quality/build/browser checks                                                  |
| Docker, CI or security boundaries         | Run applicable configuration/scanner checks and isolated Docker smoke/container scanning when available                                                                                           |
| Later comments-only audit                 | Preserve behaviour and machine-sensitive text; inspect executable changes and run pnpm check/build plus affected browser/script/configuration checks, with isolated Docker checks where warranted |

The command list above is the available validation toolbox, not an instruction to run every command for every Markdown edit — do not weaken required assertions or security thresholds

For a later comments-only task, preserve strings, identifiers, exports, execution order, JSX text/whitespace, CSS values and shell continuations — report unrelated functional findings separately instead of silently fixing them

Before finishing, review scope/preservation, code-comment compliance, applicable checks, documentation accuracy and remaining limitations — report this briefly, including failed/interrupted/blocked checks rather than treating them as passes

Do not claim hosted CI, Docker, physical-phone use or live AI passed without direct evidence — a viewport test or provider mock establishes only its tested scope

## Instruction verification

After significant instruction changes, explicitly reread the revised files in the same conversation and resolve conflicts — do not assume an uploaded Sources copy automatically synchronises with the repository

Repository files are the current development reference, subject to applicable platform/system requirements and later explicit user preferences — uploaded copies are references, not competing rule sets

## Testing Changes To Learning Controls

Use the temporary SQLite fixtures for migrations and browser tests — never point a test or preview at normal learner data

Answer shapes are shared across content, domain validation, API drafts, autosave and review — changing a task's objective or grading requires a content version and deliberate migration, including old assistance and completion history

For short-answer keyboard changes, test keydown, keyup, held repeats and composition events as well as clicks — use real browser tests for native button activation, dialog focus trapping and Escape

After changing question types, update the real API smoke helper and independent PCAP assertions as well as unit tests — restore must accept all supported backup schemas without bypassing integrity checks

## Lesson packs, feedback and current status

Use the worktree containing the latest implementation, as identified from actual Git state — current paths, preview ports, completion, known limitations and restart commands belong in [status](depth-extension-status.md) and [handover](development-handover.md)

Use frozen installation when setting up dependencies, and the relevant checks above — browser fixtures use disposable SQLite data and mocked providers, never real credentials or paid calls

Generate evidence with `python3 scripts/generate-evidence.py`; validate with `pnpm content:validate`, which includes the independent capture, lesson and depth validators — changing both a fixture and its answer is insufficient without checking the extraction rule

Update sequence and source records when objectives, controls or evidence change — preserve stable IDs, explicit versions and historical learner work

See [AI feedback](ai-feedback.md), [Review Due](review-due.md), [curriculum](curriculum-depth.md), [pilot findings](pilot-findings.md) and [operations](operations.md) for their specific boundaries
