# Roadmap after Milestone 1

Milestone 1 stops at two complete lessons, local progress, mistake retries and a working Docker/CI workflow. It has no sign-in, AI, points, paid services, assessment placement or spaced-repetition scheduler.

Next: content-version migrations with preservation/review rules, a small spaced-repetition scheduler using missed precise answers, and versioned lesson packs. Gradually expand to ten English and ten cyber lessons; do not fill the dashboard with placeholders.

English priorities: spelling/vocabulary; grammar; reading; pronunciation; professional cyber communication; interviews; university writing; everyday conversation; listening; speaking. Add an initial assessment with separate skill results and recommended starts, never unsupported official CEFR certification. Teach sound–spelling links, syllables, families and phonetic symbols gradually. Later support focused-error/all-error writing feedback. Listening and speaking can wait.

Cyber priorities: network-based malware analysis with Wireshark; forensics; network security; cloud/IAM; threat hunting, then incident response, OS security, SOC, web testing, Python automation, AI security and DevSecOps. Prefer evidence, isolated attack-and-fix targets and reports over quiz-only lessons. Cloud exercises begin with local evidence/policies/simulations and no spending.

Feature order after the core: spaced repetition, learning paths, search, daily plan, charts, bookmarks/notes, optional streaks/XP/badges and export. Everything stays unlocked with recommended order and Low/Medium/High difficulty.

Optional AI later: written rubric feedback, mistake explanations and current-lesson Q&A. Keep deterministic marking in normal code. A small server provider boundary can offer disabled/no-AI, separately funded user OpenAI API keys and later a lightweight local provider tested on this 16 GB laptop. Do not install large models now. A ChatGPT subscription does not supply website API credits, and the ChatGPT UI must not be automated as an API substitute.

Future cloud keys stay server-side and outside Git/images/logs. Sending learner text requires a clear user action and content disclosure; provider failures must not lose drafts. AI output is labelled separately from verified answers. A manual Copy for ChatGPT feature may support subscription use with explicit answer/rubric and spoiler controls.

Repository lesson packs come first. Later research-assisted drafts must pass schema/source/key/practical checks and human review before publication; never silently publish generated lessons. Vulnerable targets must be isolated from the app, progress and credentials, with explicit start/stop/reset and no default LAN exposure.
