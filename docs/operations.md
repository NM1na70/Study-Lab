# **Run, Back Up and Use a Phone**

[Back to the setup guides](../README.md#setting-up)

## **Start and Stop**

Open the terminal in the project directory that contains `compose.yaml` — these commands use Ubuntu/WSL on Windows or Terminal on macOS, with Docker Desktop running

For the native Ubuntu/Debian Docker Engine guide, add `sudo` before Docker commands unless your user already has access — keep file redirection and `mkdir` in your normal user shell

```bash
docker compose up --build -d --wait --wait-timeout 120
docker compose ps
```

Open [Study Lab](http://localhost:3000) — the default address is available only on the same computer

The first build needs internet to download images and packages — core study then uses local files and the running server, with optional source links as the only reason to open external learning pages

Stop safely from the same project directory

```bash
docker compose stop
```

Start again with the same Docker installation and project folder

```bash
docker compose up -d --wait
```

After a reviewed code update, use `docker compose up --build -d --wait` to build and start the new image

`docker compose down` also keeps the named data volume — it removes the app container and network, which are recreated on the next start

Keep the same project name — moving or renaming the directory, changing Docker environments or using a different `-p` value can select a different volume and make progress appear missing

The [Compose file](../compose.yaml) stores progress in `study-data`, normally named `study-lab_study-data` by Docker — `docker volume ls` lists volumes without changing them

**Do not use `docker compose down --volumes` for normal operations — it deletes that project's saved progress**

The smoke script uses volume deletion only for its own isolated test project

## **Backup and Restoration**

Backups contain learner text — keep them private and out of Git, and copy important backups off the computer

The following commands create a consistent SQLite backup while the app runs, then stream it from the container into the ignored `backups/` directory

**Ubuntu/WSL or macOS Terminal — from the project directory**

```bash
mkdir -p backups
docker compose exec -T app node scripts/backup.mjs /tmp/study-backup.sqlite
docker compose exec -T app node -e 'process.stdout.write(require("node:fs").readFileSync("/tmp/study-backup.sqlite"))' > backups/study-backup.sqlite
```

For native Linux Engine, put `sudo` before both `docker` commands — `mkdir` and the `>` output file stay under your normal user

Use a different output filename when you want to keep an older backup — do not copy only the live database file because recent writes can be stored in SQLite's sidecar files

Restoration **replaces current progress** with the selected backup — first back up the current state, then stop the app before restoring

**Ubuntu/WSL or macOS Terminal — from the project directory**

```bash
docker compose stop app
docker compose run --rm --no-deps -T app node scripts/restore.mjs < backups/study-backup.sqlite
docker compose up -d --wait
```

For native Linux Engine, put `sudo` before each `docker` command

The restore container reads the backup from standard input, checks database integrity and schema, then replaces the database as the app's non-root user — never restore while another app is writing to the same volume

Open your saved lessons and Review Due after restoration and check their saved state — see [verification](verification.md) for recorded backup/restore results and limits

## **Explicit LAN Option**

LAN means the local network, such as your home Wi-Fi — enable this option only on a trusted network

Everyone who can reach Study Lab can read and change its one learner profile — there is no sign-in or separate phone account

From the project directory, use the command that matches your computer's terminal

**Ubuntu/WSL or macOS Terminal**

```bash
BIND_ADDRESS=0.0.0.0 docker compose up -d --force-recreate --wait
```

**Linux terminal — Docker Engine with `sudo`**

```bash
sudo env BIND_ADDRESS=0.0.0.0 docker compose up -d --force-recreate --wait
```

These commands replace the container while keeping the same named data volume — finish saving work before recreating the app

Find the computer's local Wi-Fi address below, then open `http://COMPUTER-IP:3000` on the phone with the actual address in place of `COMPUTER-IP`

The phone and computer must use the same trusted Wi-Fi — guest networks may prevent devices from reaching one another

The computer and Docker must remain running — `localhost` on the phone points to the phone, not to the computer

Keep the firewall enabled and do not open router ports or expose the app publicly

### **Find the Computer's Address**

| Computer          | Where to look                                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows with WSL2 | Run `ipconfig` in **Windows PowerShell** and find the IPv4 address of the active Wi-Fi adapter — use the Windows address rather than WSL's private address             |
| macOS             | Open **System Settings → Wi-Fi → Details → TCP/IP** for the connected network and find its IPv4 address                                                                |
| Linux             | Open the connected Wi-Fi network's details in the desktop settings and find its IPv4 address — use the Wi-Fi interface rather than a Docker bridge or loopback address |

If using a wired computer on the same trusted home network, use its active network adapter address instead

### **Check Connection and Firewall Settings**

Confirm that the app opens on the computer, then check the phone address and the Compose port mapping with `docker compose ps`

On Windows, if the firewall blocks access, manually create an inbound TCP 3000 rule for the **Private** network profile and limit it to the local subnet — use **Windows Defender Firewall → Advanced settings → Inbound rules → New Rule → Port**

Remove that rule when it is no longer needed — do not disable the firewall or create a Public-profile rule

On macOS or native Linux, review the firewall for your computer and allow only the trusted local network if needed — these platform-specific firewall steps have not been tested here

Docker Desktop and WSL forwarding can affect phone access — check [Docker's WSL integration guide](https://docs.docker.com/desktop/features/wsl/) before changing Windows forwarding settings

No firewall, router or forwarding setting is changed by Study Lab

### **Manual Phone Check**

- Open the dashboard from the phone
- Enter an answer and wait for **Answer saved**
- Refresh on the phone and reload the same lesson on the computer to check the shared answer
- Open the cyber evidence summary and check that the page fits the screen

This physical phone check remains **unverified** — browser viewport tests check the layout, not Wi-Fi connectivity

### **Return to Localhost**

**Ubuntu/WSL or macOS Terminal**

```bash
BIND_ADDRESS=127.0.0.1 docker compose up -d --force-recreate --wait
```

**Linux terminal — Docker Engine with `sudo`**

```bash
sudo env BIND_ADDRESS=127.0.0.1 docker compose up -d --force-recreate --wait
```

Remove any firewall rule you added only for this app — if you put a LAN bind in an optional `.env` file, change it back there too

## **Docker Service and WSL**

These read-only checks help separate a working command from a running Docker service

**Ubuntu/WSL or macOS Terminal**

```bash
docker version
docker compose version
```

Docker Desktop must be open — on Windows also enable Ubuntu under **Settings → Resources → WSL Integration**, then reopen Ubuntu

In **Windows PowerShell**, `wsl -l -v` shows the WSL version for each distribution — follow [Microsoft's WSL guide](https://learn.microsoft.com/en-us/windows/wsl/install) if Ubuntu is not using WSL2

For Docker Engine on the Ubuntu/Debian systems covered by the README, check the service in the **Linux terminal**

```bash
sudo docker version
sudo docker compose version
sudo systemctl status docker
```

If the installed service is stopped, `sudo systemctl start docker` starts it — this is for those native Linux Engine systems, not a second Docker service inside the Windows WSL guide

Do not reset Docker, delete data or change socket permissions as a routine repair

## **Use Another Port**

If another service uses port 3000, keep that service running and choose an available port such as 3001 for Study Lab

**Ubuntu/WSL or macOS Terminal — from the same project directory**

```bash
APP_PORT=3001 docker compose up -d --wait
```

**Linux terminal — Docker Engine with `sudo`**

```bash
sudo env APP_PORT=3001 docker compose up -d --wait
```

Open [http://localhost:3001](http://localhost:3001) — the container still uses port 3000 internally, and the same volume keeps progress

Use the same `APP_PORT` value on later start/update commands, or put `APP_PORT=3001` in your optional `.env` file — `.env.example` lists the available settings, and no key is needed

For phone access, use that chosen port in both the URL and any app-specific firewall rule

## **Five-Minute Walkthrough**

- Open the dashboard and check the two courses, actual progress counts, difficulty and study time
- Open English, read the example, then try `acttion` in the first activity and use the feedback and a hint before retrying `action`
- Wait for **Answer saved**, refresh and check the same answer and position — open **Mistake review** to retry the missed item
- Open Cybersecurity, download the synthetic PCAP and expand the labelled evidence summary — full Wireshark work needs a computer and takes about an hour
- Visit the writing activity and read its rubric and language checklist — completion requires correct precise answers and explicit self-review, and solution use is recorded

## Learning UX Update And Progress Migration

Before adopting this version on your normal installation, create a consistent backup using the commands above — implementation and verification used disposable databases only

Schema 2 retains schema 1 progress and stores each migrated lesson's original JSON in `progress_migrations` — content version 1 → 2 conversion happens on first lesson load and is idempotent

English's existing completion remains saved — Cybersecurity's earlier completion is retained as history, while the new request-frame selection and report require fresh assessment

Previous free-text summaries remain visible inside the report's Saved Work disclosure — their hints, solution use and self-review remain recorded, but they do not automatically reveal or complete the new report

Use Check Answer for report facts and Record Self-Review for its open reasoning — Unknown or Not Established is acceptable when the evidence does not support a conclusion

Back To Dashboard opens the completion choice for an unfinished lesson — Mark It As Completed saves and validates every requirement, while Not Completed Yet saves without completing

Escape cancels the dialog and restores focus — unmet requirements offer Return To Activity actions, and a save failure keeps the learner on the page with Enable Retry

Mistake Review starts with English and Cybersecurity course buttons — Remove hides an active item, Undo restores it, and a new incorrect checked attempt makes it active again without deleting earlier history

Current backups require an app that supports schema 4 — to roll back to older code, restore a separate pre-update schema 1 backup with the app stopped, preserving the newer backup for later recovery

### Disposable Manual Preview

Run a separate port and temporary database from the feature worktree to review without changing normal study progress

```bash
source scripts/dev-env.sh
pnpm build
study_preview_dir="$(mktemp -d /tmp/study-ux-preview.XXXXXX)"
DATABASE_PATH="$study_preview_dir/study.sqlite" PORT=3011 pnpm start
```

Open http://localhost:3011 and stop the preview with Ctrl+C — port 3000 and the normal Docker volume are not used by this preview

Review both courses, check the URI feedback, complete a report with an Unknown reasoning field, try both dialog choices, then remove/undo a mistake and refresh — browser screenshots and automated limits are in verification.md

## Connected Report Update — 5 November 2026

Use the clickable Lesson Route to move between sections — the app saves automatically before navigating, so there is no activity selector or instruction to wait manually

A failed save leaves the activity and draft open — select Enable Retry and try the route again, copying unsaved work before reloading if another browser has caused a revision conflict

The final activity has no Next Activity button — Finish This Lesson remains the place to complete or return to the dashboard, with pending final answers saved first

The Cybersecurity report now uses four connected sections, two short reasoning prompts, Check Report and a separate live Preview Report — the preview marks missing fields and does not check, complete or supply answers

My Investigation Notes is collapsed initially and shows your own saved work — Use My Finding copies even an incorrect answer, asks before replacing a different entry and records where it came from without checking it

Content version 2 → 3 retains equivalent factual report drafts and archives the full earlier report — older reasoning and free-text summaries remain readable, and new evidence relationships and reasoning need fresh checks/review

Hints and examples remain recorded as assistance — copying your own saved notes or opening your own preview does not erase earlier assistance or prove independent mastery

The connected-report checkpoint used SQLite schema 2 — the current milestone upgrades storage to schema 3, so back up before adopting the feature on normal study data, and keep a pre-update backup if you intend to roll back to code that does not support content version 3

## Schema 3 And Optional AI

Schema 3 adds review schedules, resumable sessions, immutable review results, bounded AI usage/cache records and assistance markers — existing lesson progress and content-migration archives remain intact

The same SQLite backup/restore commands include these tables and accept schemas 1, 2 and 3 — stop the app before restore, keep a pre-update backup for rollback to older code, and never test restoration on live learner data

AI keys are held in server memory and owner capabilities in the launching environment — neither is included in a database backup, and reconnecting after restart is deliberate

AI cached advice and written answers are learner data — protect backups accordingly, even though credentials are excluded

For the current isolated preview use port 3012 and a temporary DATABASE_PATH — the existing 3011 preview and normal Docker study volume must remain untouched

See [owner setup](ai-feedback.md) and [Review Due policy](review-due.md)

## In-Progress Quiz And Model Preview

The course-depth extension uses SQLite schema 4 — the normal backup includes quiz references/history and model runs while retaining the credential-exclusion policy, and restore accepts schemas 1–4

The new disposable preview is on http://localhost:3013 — older previews on 3011 and 3012 are not replaced

Its temporary directory is recorded in /tmp/study-depth-preview-path — owner model access uses the random token in that directory's owner-token file, which has mode 600 and is not an OpenAI API key

Read that token locally only when using the owner controls — never include its value in screenshots, Git, logs or reports

To launch your own disposable host preview from the feature folder:

```bash
source scripts/dev-env.sh
pnpm build
study_depth_data="$(mktemp -d /tmp/study-depth-local.XXXXXX)"
read -r -s -p 'Temporary owner token, at least 32 random characters: ' STUDY_OWNER_TOKEN
printf '\n'
export STUDY_OWNER_TOKEN
DATABASE_PATH="$study_depth_data/study.sqlite" PORT=3014 pnpm start
```

The lab is modelled and needs no container image download — start/pause/resume/reset act only on its persisted model, and no arbitrary host terminal exists

See depth-extension-status.md for resource bounds and incomplete integration — the model currently does not grant a catalogue question tick or become a Daily Quiz hard unit

## Completed News And Integrated Model

Owner-only fresh updates and lab controls require a direct localhost connection and STUDY_OWNER_TOKEN of at least 32 random characters — no OpenAI key or paid service is required

Optional Fresh News is available on Daily Quiz — imported, validated USGS snapshots appear in the English evidence-language lesson, while Refresh remains the explicit way to choose a replacement quiz

The endpoint lesson contains the integrated model question — inspect ps, ss, accounts and journalctl after the 45-second event, apply network/identity/endpoint containment and preserve the portal, then choose Verify Lab Question

Help marks assistance; failed checks remain attempts; reset archives the run; historical runs/results are owner-readable — model pause/resume and interruption are persisted, not simulated by changing a browser timer

The model needs no VM image download and cannot execute host commands — its small measured footprint does not establish Docker or physical-device compatibility

Schema 5 backups contain news snapshots and model results, never provider or owner credentials — keep pre-upgrade backups for older-code rollback and restore only with the app stopped

## Docker Smoke Coverage And Owner Lab Limits

The shipped Compose service does not supply STUDY_OWNER_TOKEN — owner lab verification is intentionally unavailable through Docker's published bridge port, which also does not satisfy the direct-loopback socket requirement

Do not add credentials, trust forwarded addresses or broaden the owner guard to make a smoke test complete the model question — legitimate owner model work uses the documented direct-localhost host process

`pnpm docker:smoke` completes ordinary questions through their normal API checks and explicit writing/report self-review — it saves a correct-looking lab draft, requires its ordinary check to return 400 and ownerless verification to return 403, then requires the lab lesson's completion request to fail

The helper explicitly asserts owner controls are disabled, checks rejected lab reads/start/history, and verifies that rejected requests leave progress unchanged — an owner-enabled host is rejected as a different configuration rather than silently treated as a Docker smoke target

Current expected coverage is 19 of 20 lessons completed, all ordinary questions assessed, and defence-lab deliberately incomplete with zero assessed lab attempts — this is an asserted access/completion boundary, not a skipped question or a claim of complete catalogue completion

Recreation and real SQLite backup/restore must preserve both completed ordinary lessons and the unassessed lab draft; runtime health, page content, non-root UID and cleanup of only the disposable smoke project remain required

Host-process lab tests separately cover bridge denial even with a valid fictional owner capability, rejection of supplied success flags, failed/incomplete objectives, successful live model proof and deduplication — they do not establish Docker lab completion support

See [verification](verification.md) for actual smoke results and Docker availability — run only against isolated test data, never a normal learner instance

## Desktop Simulation Controls And Request Limits

Simulation controls are available above the study layout's 720-pixel mobile breakpoint — smaller views show a desktop requirement, preserve saved model/question progress and provide a return link to the endpoint lesson, with ordinary questions still available

The mobile view mounts no model transport, owner token input or terminal — this UI boundary does not replace direct-localhost owner authorisation on the server

Start, pause and background ticks retain an unsubmitted command — a successful command response clears only the exact draft that was submitted, preserving newer typing; failed operations retain the draft

Owner endpoints share a process-local 120-request/minute client-IP limit and return 429 with Retry-After when exceeded — wait for that interval, preserving current work; ordinary lesson saving is not throttled by this owner budget, and paid-feedback caps remain separate

The Docker owner-disabled boundary and isolated smoke behaviour above are unchanged — no new owner credentials or bridged access were enabled
