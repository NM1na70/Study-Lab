# Study Lab project brief

Study Lab is a local learning application for practical English and cybersecurity development — skills improve through explanation, practice, evidence, feedback and review

This brief records durable goals and preferences, not a claim that every capability is implemented or verified — consult the [current status](depth-extension-status.md), [handover](development-handover.md) and [verification record](verification.md) for completion, known limitations, saved previews and restart commands

## English goals

- Australian English, spelling, vocabulary and accurate recall
- Reading comprehension and grammar in practical contexts
- Clear workplace and investigation writing
- Varied controls suited to the objective, keeping typed spelling where selection would bypass the skill
- Medium and Hard reading with appropriate vocabulary support and explicit source/reuse information

## Cybersecurity goals

- Practical investigation and defensive judgement, progressing from guided University Intermediate work through Junior Professional scenarios to Advanced Challenges
- Career relevance prioritising AFP digital investigations, then ASD/ACSC technical defence, then ADF defensive operations
- Public authoritative sources, evidence-supported MITRE ATT&CK mappings and original scenarios without agency endorsement, internal-method claims, recruitment-test claims or certification claims
- Accurate distinctions between observation/inference, event/collection time, indicators/confirmed compromise, integrity/complete legal chain of custody, and proposed/performed actions
- Honest labs — a modelled environment must not be called a real VM or operating-system terminal, and model success must not imply real-world mastery

## Terminology

| Term                | Meaning                                                          |
| ------------------- | ---------------------------------------------------------------- |
| Course              | English or Cybersecurity                                         |
| Lesson              | A learning unit within a course                                  |
| Question            | An activity within a lesson                                      |
| Multi-step question | A larger activity such as reading comprehension or a defence lab |

Lessons may contain more than 10 questions where objectives justify them — do not impose a count cap or pad the catalogue

## Product principles

- Core learning stays usable without AI or an API key
- Deterministic objective checking remains separate from explicit reasoning self-review and optional AI advice
- Hints and solutions are recorded as assistance; assisted completion and self-review are not verified mastery
- Preserve saved drafts, answers, attempts, legitimate progress and relevant historical completion through deliberate migrations
- Daily Quiz and lessons share question state; Daily Quiz selects incomplete questions and replaces its selection only on an explicit request, never automatically by date
- Daily Quiz has accessible English/Cybersecurity tabs with independent question positions and save-aware switching; each new selection aims for seven incomplete task units per course (2 Easy, 3 Medium, 2 Hard), about 60 minutes each / 120 combined
- Prefer the seven-question count and difficulty mix over an exact duration; fill shortages with nearby difficulties from the same course, show every eligible item when fewer than seven remain, and never add completed questions, duplicates or filler
- Exhaust alternatives before repeating unfinished selected questions; show actual counts/durations and course-specific completion, with global congratulations only when both courses have no incomplete questions
- Group existing mixed sessions without changing their saved references; the new policy applies only at the next explicit Refresh, which saves pending work and confirms replacement for both courses
- Scheduled recall is distinct from incomplete-question practice and does not inflate original assessment history
- Research claims and required answers must match actual supporting material; respect permissions and retain source provenance and passage versions
- Preserve accessibility, mobile access to suitable work and save-aware navigation/error recovery
- Keep the single-learner app lightweight, with explicit owner boundaries for privileged operations and isolation from personal files, credentials and uncontrolled targets

## Agreed presentation

- Black StudyLab wordmark without a subtitle
- Footer exactly `2026 | Study Lab`
- Title Case button labels
- Navigation: Dashboard → Daily Quiz → Mistake Review → AI Settings
- Review Due above Mistake Review on the combined page

## Target constraints

Windows with Ubuntu WSL and Docker development, targeting a 16 GB RAM computer — added lab storage must stay below 50 GB, with substantially lower use preferred

Browser-based defence labs may be desktop-only if smaller screens receive a useful explanation and other questions remain accessible — measured resource use and unverified runtime limits must be distinguished

No mandatory paid provider, cloud account or AI service — optional external requests require their documented consent/access boundaries

## Reading and maintaining instructions

Read [AGENTS.md](../AGENTS.md) for essential working rules and the complete short code-comment style, and the [development workflow](development-workflow.md) for procedures and examples

Later explicit user requirements can update project preferences within applicable platform/system requirements — update the repository documents together rather than creating competing rule copies

Repository files are the current development reference — an uploaded Sources copy is only a reference and does not automatically stay synchronised

Do not add private personal history, recruitment outcomes, account details or secrets to this brief
