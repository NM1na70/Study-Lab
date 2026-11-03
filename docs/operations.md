# Run, back up and use a phone

## Start and stop

From the repository root in Ubuntu/WSL with Docker Desktop integration enabled:

```bash
docker compose up --build -d --wait --wait-timeout 120
docker compose ps
```

Open [Study Lab](http://localhost:3000). The default is localhost only. Images/dependencies need internet for the initial build. After installation, all teaching, quizzes, evidence and progress work over the local connection without external internet; source links are optional reading. This is not an offline PWA. Stop safely with:

```bash
docker compose stop
# Or remove the app/network while keeping the named data volume:
docker compose down
```

Start again with `docker compose up -d --wait`. After reviewed code updates, use `docker compose up --build -d --wait`. Keep the same checkout/project name so Compose selects the same volume. Renaming the directory or using `-p` selects another profile/volume. Inspect with `docker volume ls`. Do not use `docker compose down --volumes` for normal operations: **it permanently deletes that project's learner progress**. The smoke script uses this only on its isolated test project.

## Backup and restoration

Backups contain private learner text. Keep them out of Git; `backups/` is ignored. The SQLite online backup API includes WAL state safely; do not copy only a live database file.

```bash
mkdir -p backups
docker compose exec -T app node scripts/backup.mjs /tmp/study-backup.sqlite
docker compose exec -T app node -e 'process.stdout.write(require("node:fs").readFileSync("/tmp/study-backup.sqlite"))' > backups/study-backup.sqlite
```

Copy the backup off the laptop as appropriate. Use a distinct dated destination to retain older backups. For restoration, first back up the current state, then:

```bash
docker compose stop app
docker compose run --rm --no-deps -T app node scripts/restore.mjs < backups/study-backup.sqlite
docker compose up -d --wait
```

Restoration replaces current progress with the selected backup; it is an intentional overwrite. The one-off restore container runs as the app's UID, reads the backup from standard input and replaces the database only after integrity/schema verification. Never restore while another app container is writing to that volume. Check both lessons after restoration. See verification.md for actual backup/restore validation.

## Explicit LAN option

All visitors share this one unauthenticated learner. Use a trusted home LAN only. No separate accounts/privacy or encrypted remote service is provided. Do not forward this port on the router.

```bash
BIND_ADDRESS=0.0.0.0 docker compose up -d --force-recreate --wait
```

In Windows PowerShell, `ipconfig` shows the active Wi-Fi adapter's IPv4 address (for example 192.168.x.x). On the phone, connect to the same Wi-Fi and open `http://<Windows-Wi-Fi-IPv4>:3000`. Use the Windows address, not WSL's NAT address. Docker Desktop, Windows firewall and WSL networking versions affect reachability; a responsive viewport test does not establish it.

If Windows Firewall blocks access, manually permit inbound TCP 3000 for the **Private** network profile, scoped to the local subnet; remove the rule when no longer needed. Use Windows Defender Firewall → Advanced settings → Inbound rules → New Rule → Port. Do not disable the firewall or create a Public-profile rule. If Docker Desktop cannot forward WSL-published ports to the LAN, inspect its WSL integration/networking documentation before changing Windows port forwarding. No settings are changed automatically.

Manual owner check (still unverified): open the dashboard from the phone; edit an answer; wait for Saved; refresh; verify the desktop sees the same answer after reload; open the cyber browser evidence table; confirm no page-width overflow. Then return to localhost:

```bash
BIND_ADDRESS=127.0.0.1 docker compose up -d --force-recreate --wait
```

## Five-minute walkthrough

1. Open the dashboard: two courses, actual activity counts, Low/Medium difficulty and estimated time.
2. Open English, read the word-family example, start activities and deliberately try `acttion`. Check the feedback and reveal a hint before retrying `action`.
3. Wait for Answer saved, refresh and see the answer and current activity resume. Open Mistake review and retry the missed item.
4. Open Cybersecurity, download the 1.4 KB synthetic PCAP and expand the labelled evidence summary. Desktop Wireshark work takes about an hour; mobile supports reading/review.
5. Visit the written activity: see the rubric, separate language checklist and explicit self-review. Completion stays unavailable until every required activity is met; solution use is recorded.
