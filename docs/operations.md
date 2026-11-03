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

Open both lessons after restoration and check their saved state — see [verification](verification.md) for recorded backup/restore results and limits

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
