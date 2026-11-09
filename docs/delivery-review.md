# Next Milestones Review

Worktree: /home/james/VibeCoding/study-lab-next-milestones

Branch: codex/next-milestones from origin/main c3765e9 — all changes remain uncommitted and unpushed

Open the folder above in VS Code — the original main checkout and prior learning-UX worktree are unchanged

## Suggested Logical Commits And PR Descriptions

These are review groupings, not commits already made — shared report/schema changes should accompany the first content that uses them

| Suggested commit                                                    | PR title                                                    | Suggested description                                                                                                                                                                                                                      |
| ------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| docs(content): define ten-lesson course sequences                   | Define English and Cybersecurity learning sequences         | Record stable lesson IDs, objectives, prerequisites, activity choices, practical materials, sources, completion limits and review concepts for two unlocked ten-lesson courses                                                             |
| feat(content): add spelling, reading, DNS and authentication pilots | Add four complete pilot lessons                             | Add original teaching, guided/independent/review tasks and reproducible synthetic DNS/authentication evidence, with source and independent-key validation                                                                                  |
| feat(review): add persistent due scheduling and review sessions     | Add Review Due without changing original assessment history | Schedule selected learned concepts and mistakes with deterministic UTC intervals, five-item resumable sessions, immutable results and shared persistent Remove/Undo semantics                                                              |
| feat(ai): add optional owner-only OpenAI writing feedback           | Add bounded owner AI feedback with explicit consent         | Keep provider credentials in server memory, require direct loopback plus owner capability for settings and paid calls, bound context/output/usage and preserve deterministic grading through mocked failure/privacy tests                  |
| feat(content): expand both courses to ten complete lessons          | Expand local evidence lessons and connected reports         | Apply the pilot findings to generic report layouts, multi-lesson review and catalogue filters, then add fourteen complete lessons, independently verified evidence, migration/backup checks and offline desktop/mobile completion coverage |

For one combined PR, use: Implement twenty-lesson courses, Review Due and optional owner AI feedback

Suggested combined description:

> Expand Study Lab to ten complete English and ten Cybersecurity lessons with original local materials, authoritative reference metadata and independently verified synthetic evidence
>
> Add selected-concept UTC review scheduling and resumable sessions without inflating original assessment history, retaining persistent removal, Undo and reactivation on a new mistake
>
> Offer optional consent-based owner OpenAI feedback with memory-only credentials, a direct-loopback capability boundary, bounded usage and mocked provider verification — core study remains independent of AI
>
> Preserve existing UI choices and learner history through schema 3 migration/backup support, with all application and desktop/mobile checks recorded in docs/verification.md — Docker smoke and image scanning remain blocked by the unavailable local daemon

Read course-sequences.md for all 20 objectives, pilot-findings.md for the expansion decisions, review-due.md for scheduling, ai-feedback.md and ai-evaluation.md for the optional provider boundary, and verification.md for actual outcomes and limitations

## Course Depth Extension Review

Suggested PR title: Deepen both courses and integrate validated reading, defence and daily study

Suggested description:

> Add original incomplete-evidence professional cases to all ten Cybersecurity lessons, with guided foundations, supported decisions, independent reasoning and evidence-limited ATT&CK mappings
>
> Add six versioned Medium/Hard reading groups and explicit fixed-source USGS snapshot updates, retaining earlier offline content on failure and keeping factual checking separate from reasoning self-review
>
> Integrate the owner-only modelled defence scenario into shared lesson/quiz progress through server-verified investigation, containment and portal availability — preserve failed checks, assistance and historical debriefs
>
> Select incomplete catalogue work with metadata-based duration/difficulty balance and strict alternative-first refresh, including thin-pool regression cases, without copying answers or replacing sessions by date
>
> Preserve earlier learner work through versioned migrations and schema 5 backup/restore — actual final checks and infrastructure limits are recorded in verification.md

Suggested logical commits:

- feat(content): add professional evidence cases and versioned reading groups
- feat(lab): verify model outcomes in shared lesson progress
- feat(news): import immutable validated fixed-source reading snapshots
- fix(quiz): prefer all alternatives before repeating unfinished work
- test(study): cover migrations, snapshots, authoritative lab grading and thin pools
- docs(study): record curriculum, operation and verification boundaries

No commits, pushes, merges or publication were performed — educational levels and model success are not professional certification or verified real-world mastery
