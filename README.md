# **Study Lab**

Study Lab helps people practise English and cybersecurity skills. Guided lessons, practical exercises, feedback and mistake review help learners write clearly and investigate evidence. Saved progress lets them stop and return later

## **What You Can Do**

| Available now                    | What you practise                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| English — about 25 minutes       | Build and spell useful words with `-tion`, then write and review a short note                    |
| Cybersecurity — about 60 minutes | Investigate a harmless synthetic network capture, check the evidence and write a careful summary |
| Mistake review                   | Retry precise answers you missed and see feedback                                                |
| Saved progress                   | Return to saved answers, your current activity, hints and lesson completion                      |

Both lessons are unlocked, with difficulty and recommended order shown on the dashboard

Writing uses a checklist and your own review, rather than an automatic technical grade — using a revealed solution is recorded and does not prove independent mastery

No sign-in, GitHub account, OpenAI API key or AI connection is required to study — AI feedback, placement assessments, spaced repetition and more lessons are [planned work](docs/roadmap.md)

## **Setting Up**

Close the Windows guide and expand the guide for your computer or phone

You need internet for the first download and build — after that, core study works without external internet while the app and your connection to the computer remain running

| Platform                                           | Verification                                                                                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows x64 with Ubuntu on WSL2 and Docker Desktop | Previously tested for local study and data persistence — a fresh Docker check on 4 November 2026 was blocked because the Docker service was unavailable |
| macOS on Apple Silicon or Intel                    | Expected to work from the image and configuration checks — no Mac installation has been tested                                                          |
| Native Linux on Ubuntu or Debian                   | Expected to work with Docker Engine and Compose — no native Linux installation has been tested                                                          |
| Phone browser on the same Wi-Fi                    | Layout tested at a phone-sized viewport — physical phone access remains unverified                                                                      |

Other computer systems and processor types are not covered by these guides

<details open>
<summary><strong>Windows — Ubuntu on WSL2</strong></summary>

### **Step 0 — Set up**

This Windows guide uses x64 hardware and WSL2 — check the linked Docker Desktop page for supported Windows versions

| Required software                                                                            | Why you need it                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [Ubuntu on WSL2](https://learn.microsoft.com/en-us/windows/wsl/install)                      | Opens a Linux terminal inside Windows            |
| [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) | Builds and runs Study Lab, with Compose included |
| [Git for Linux](https://git-scm.com/install/linux)                                           | Downloads the project into Ubuntu                |
| A recent browser, such as the included Microsoft Edge                                        | Opens the study pages                            |

If Ubuntu is not installed, open **PowerShell as Administrator** and run the following command, then restart Windows if asked

**PowerShell — first-time Ubuntu installation**

```powershell
wsl --install -d Ubuntu
```

Open **Ubuntu** from the Start menu and create its Linux username and password when asked — the password does not appear as you type

Install and open Docker Desktop, choose its WSL2 engine and enable Ubuntu under **Settings → Resources → WSL Integration** — use [Docker's WSL guide](https://docs.docker.com/desktop/features/wsl/) if the setting is missing

Keep Docker Desktop running — use **Ubuntu**, not PowerShell, for all remaining commands in this guide

**Ubuntu/WSL — install Git**

```bash
sudo apt update
sudo apt install git
```

### **Step 1 — Check the tools**

**Ubuntu/WSL**

```bash
git --version
docker version
docker compose version
```

`docker version` must show both Client and Server information — use [Setup Help](#setup-help) if a command fails

### **Step 2 — Download Study Lab**

The commands below create a project folder in your Ubuntu home folder, download Study Lab and enter its directory

**Ubuntu/WSL**

```bash
mkdir -p ~/StudyProjects
cd ~/StudyProjects
git clone https://github.com/NM1na70/study-lab.git
cd study-lab
```

If you already have this project, open its existing `study-lab` directory instead of cloning again

### **Step 3 — Start Study Lab**

No configuration file or API key is needed — run this command from the directory that contains `compose.yaml`

**Ubuntu/WSL**

```bash
docker compose up --build -d --wait --wait-timeout 120
docker compose ps
```

The first build can take several minutes — when the app is healthy, open [http://localhost:3000](http://localhost:3000) in your Windows browser

### **Step 4 — Check it and return later**

- Check that English and Cybersecurity appear on the dashboard
- Open English and choose **Start activities**
- Enter an answer, wait for **Answer saved**, then refresh and check that the answer returns

To stop safely, return to the same project directory in Ubuntu and run this command

**Ubuntu/WSL — stop**

```bash
docker compose stop
```

To return later, open Docker Desktop, open Ubuntu and run these commands

**Ubuntu/WSL — start again**

```bash
cd ~/StudyProjects/study-lab
docker compose up -d --wait
```

Open [http://localhost:3000](http://localhost:3000) again — keep the same project folder so Docker uses the same saved progress

## **Other OS**

</details>

<details>
<summary><strong>macOS — Apple Silicon or Intel</strong></summary>

### **Step 0 — Set up**

| Required software                                                                    | Why you need it                       |
| ------------------------------------------------------------------------------------ | ------------------------------------- |
| [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) | Runs Study Lab, with Compose included |
| [Git for macOS](https://git-scm.com/install/mac)                                     | Downloads the project                 |
| A recent browser, such as the included Safari                                        | Opens the study pages                 |

Open **Apple menu → About This Mac** and check whether the computer has an Apple chip or an Intel processor — choose the matching Docker Desktop download

Install Docker Desktop, open it from Applications and wait until its engine is running

Open **Terminal** from Applications → Utilities — install Git using an option on the linked Git page, or accept the Command Line Tools installation if macOS offers it when you run `git --version`

Both pinned Docker base images list `linux/arm64` for Apple Silicon and `linux/amd64` for Intel — the project has no forced processor setting, but the Mac setup remains untested

### **Step 1 — Check the tools**

**macOS Terminal**

```bash
git --version
docker version
docker compose version
```

`docker version` must show both Client and Server information — use [Setup Help](#setup-help) if a command fails

### **Step 2 — Download Study Lab**

Choose a project folder in your Mac home folder and enter the downloaded project

**macOS Terminal**

```bash
mkdir -p ~/StudyProjects
cd ~/StudyProjects
git clone https://github.com/NM1na70/study-lab.git
cd study-lab
```

If you already have this project, use its existing directory instead of cloning again

### **Step 3 — Start Study Lab**

No `.env` file or API key is needed

**macOS Terminal — inside `study-lab`**

```bash
docker compose up --build -d --wait --wait-timeout 120
docker compose ps
```

The first build can take several minutes — when the app is healthy, open [http://localhost:3000](http://localhost:3000)

### **Step 4 — Check it and return later**

- Check that both courses appear
- Open English, choose **Start activities** and enter an answer
- Wait for **Answer saved**, refresh and check that the answer returns

**macOS Terminal — stop from the project directory**

```bash
docker compose stop
```

Keep the project folder — later, open Docker Desktop and run these commands

**macOS Terminal — start again**

```bash
cd ~/StudyProjects/study-lab
docker compose up -d --wait
```

Return to [http://localhost:3000](http://localhost:3000)

## **Other OS**

</details>

<details>
<summary><strong>Linux — Ubuntu or Debian</strong></summary>

### **Step 0 — Set up**

The package commands in this guide cover **Ubuntu 24.04 LTS and Debian 12 or 13** — use the official instructions for your distribution rather than copying these install commands onto another system

Use a 64-bit AMD/Intel (`amd64`) or ARM (`arm64`) computer — other processor types are not covered

| Required software                                                                                                                                        | Why you need it                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [Docker Engine for Ubuntu](https://docs.docker.com/engine/install/ubuntu/) or [Docker Engine for Debian](https://docs.docker.com/engine/install/debian/) | Runs Study Lab — follow the official repository installation, including Buildx and the Compose plugin |
| [Git for Linux](https://git-scm.com/install/linux)                                                                                                       | Downloads the project                                                                                 |
| A recent browser, such as [Firefox](https://www.mozilla.org/firefox/new/)                                                                                | Opens the study pages                                                                                 |

Open your distribution's **Terminal**, install Docker using the matching linked guide and make sure its service is running — Docker Desktop is not required for this Linux guide

**Linux terminal — Ubuntu 24.04 or Debian 12/13**

```bash
sudo apt update
sudo apt install git
```

This guide uses `sudo` for Docker Engine commands — if Docker is already configured for your user, the same Docker commands can run without `sudo`

### **Step 1 — Check the tools**

**Linux terminal**

```bash
git --version
sudo docker version
sudo docker compose version
```

Docker must show Client and Server information — use [Setup Help](#setup-help) if it cannot connect

### **Step 2 — Download Study Lab**

Use your own home folder for the source files — do not run `git clone` with `sudo`

**Linux terminal**

```bash
mkdir -p ~/StudyProjects
cd ~/StudyProjects
git clone https://github.com/NM1na70/study-lab.git
cd study-lab
```

If the project is already downloaded, enter its existing directory instead

### **Step 3 — Start Study Lab**

No `.env` file or API key is needed

**Linux terminal — inside `study-lab`**

```bash
sudo docker compose up --build -d --wait --wait-timeout 120
sudo docker compose ps
```

When the app is healthy, open [http://localhost:3000](http://localhost:3000) in the browser on that computer

### **Step 4 — Check it and return later**

- Check that English and Cybersecurity appear
- Open English and enter an answer in an activity
- Wait for **Answer saved**, refresh and check that the answer returns

**Linux terminal — stop from the project directory**

```bash
sudo docker compose stop
```

Keep the project folder and run these commands when you want to study again

**Linux terminal — start again**

```bash
cd ~/StudyProjects/study-lab
sudo docker compose up -d --wait
```

Return to [http://localhost:3000](http://localhost:3000)

## **Other OS**

</details>

<details>
<summary><strong>Phone — browser on the same Wi-Fi</strong></summary>

### **Step 0 — Set up**

Study Lab runs on a computer — the phone opens its pages in a browser and does not need Git, Docker or a copy of the repository

Set up Study Lab on a computer first, connect both devices to the same trusted Wi-Fi and keep that computer and its Docker service running

Full Wireshark investigation needs a suitable computer — the phone can show the lesson, quizzes and browser evidence summary

### **Step 1 — Allow access from your Wi-Fi**

Read [the LAN instructions and firewall guidance](docs/operations.md#explicit-lan-option) before changing access — everyone who can connect uses the same learner profile

From the project directory on the computer, use the command for its terminal

**Ubuntu/WSL or macOS Terminal**

```bash
BIND_ADDRESS=0.0.0.0 docker compose up -d --force-recreate --wait
```

**Linux terminal — Docker Engine with `sudo`**

```bash
sudo env BIND_ADDRESS=0.0.0.0 docker compose up -d --force-recreate --wait
```

Find the computer's local Wi-Fi address using [the operations guide](docs/operations.md#find-the-computers-address) and open `http://COMPUTER-IP:3000` on the phone, replacing `COMPUTER-IP` with that address

Do not use `localhost` on the phone — that refers to the phone itself

### **Step 2 — Check shared progress**

- Open a lesson on the phone and wait for its pages to load
- Enter an answer and wait for **Answer saved**
- Refresh on the phone, then reload the same lesson on the computer and check the shared answer

Actual phone connectivity has not been verified — use [Setup Help](#setup-help) if the page cannot open, and use the operations guide to return to localhost access when finished

</details>

VS Code, Codex, host Node, pnpm and Python are optional developer tools, not requirements for Docker-based study — [Wireshark](https://www.wireshark.org/download.html) is an optional desktop lab tool needed for full PCAP investigation

## **How It Works**

The server runs in Docker on your computer — your browser connects to that computer, even when you use a phone

| Part                          | What it does                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| React and TypeScript frontend | Provides the pages, answer boxes and feedback in your browser                                   |
| Fastify backend and API       | Serves the pages and handles requests to load or save study work                                |
| SQLite                        | Stores answers, attempts, current activity, hint and solution use, self-review and completion   |
| Bundled lessons and evidence  | Supply the teaching, answer keys, source information and synthetic capture from this repository |
| Docker named volume           | Keeps the SQLite database outside the replaceable app container                                 |

The database is `/app/data/study.sqlite` inside the container, stored in Compose's `study-data` volume — Docker normally prefixes the volume name with the project name

There is **one learner per installation and no sign-in** — all permitted browsers and phones can read and change the same profile, without separate private accounts

Safe stop/start commands keep this volume — see [operations and backups](docs/operations.md) before changing project names, restoring data or updating the app

See [the architecture diagram and code map](docs/architecture.md) for more detail

## **Documentation**

| Topic               | What you will find                                  | Guide                                                |
| ------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| Architecture        | Browser, server, storage and code map               | [How the app fits together](docs/architecture.md)    |
| Operations          | Start, stop, back up, restore and phone access      | [Run Study Lab safely](docs/operations.md)           |
| Content and sources | Lesson origins, source links and capture validation | [Content provenance](docs/content-and-sources.md)    |
| Security            | Local access boundaries and scanner checks          | [Security guidance](docs/security.md)                |
| Development         | Linux tools, quality checks, Git and comment style  | [Development workflow](docs/development-workflow.md) |
| Verification        | Recorded checks and their limits                    | [Milestone 1 results](docs/verification.md)          |
| Roadmap             | Planned lessons and later features                  | [Future work](docs/roadmap.md)                       |

## **Setup Help**

Run checks from the directory that contains `compose.yaml` — use Ubuntu/WSL on Windows, Terminal on macOS, or your Linux terminal, with `sudo` before Docker commands if your Linux setup needs it

| What you see                                                         | Likely cause                                                                  | What to do next                                                                                                                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker shows Client information but cannot connect to its service    | Docker Desktop is closed, or Docker Engine is stopped                         | Open Docker Desktop and wait, or check `sudo systemctl status docker` on the Ubuntu/Debian Engine setup — see [service help](docs/operations.md#docker-service-and-wsl) |
| The terminal cannot find `docker`, or `docker compose version` fails | Docker or the Compose plugin is not installed in that environment             | Return to Step 0 for your platform and use the official installation guide — Docker Desktop includes Compose                                                            |
| Docker works in Windows but fails in Ubuntu                          | Ubuntu is not connected to Docker Desktop                                     | Open Docker Desktop → Settings → Resources → WSL Integration, enable Ubuntu and reopen its terminal                                                                     |
| Compose cannot find its configuration                                | The terminal is in the wrong directory                                        | Run `pwd` and `ls`, then enter the `study-lab` directory that contains `compose.yaml`                                                                                   |
| The application cannot use port 3000                                 | Another program or Study Lab copy uses that port                              | Run `docker compose ps` and see [the alternate-port option](docs/operations.md#use-another-port) — do not stop an unknown service                                       |
| Image or package downloads fail                                      | Internet access, a proxy or the download service is unavailable               | Check the connection and Docker Desktop proxy settings if used, then retry the same build command — keep the data volume                                                |
| The first start takes a long time                                    | Docker is downloading images and building the app                             | Wait for the build output to finish — use `docker compose logs --tail 50 app` if the app starts but is not healthy                                                      |
| The computer works but the phone does not connect                    | Localhost binding, the address, Wi-Fi isolation or the firewall blocks access | Follow [the LAN checks](docs/operations.md#explicit-lan-option), use the computer's Wi-Fi address and keep both devices on trusted Wi-Fi                                |

Do not delete volumes, reset Docker, change socket permissions or delete project data to fix ordinary setup problems

## **Using Study Lab**

Check the save status before leaving an activity — **Unsaved edits**, **Saving…** or **Save error** means you must not assume the latest text is stored

| During study                                      | Safe next step                                                                                                                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A save fails                                      | Keep the page open and copy unsaved text somewhere safe — for a network error, restore the local connection, choose **Enable retry**, then use **Check answer** or **Save and next activity** again |
| A message says progress changed in another window | Copy unsaved text before reloading — another browser may have saved a newer revision                                                                                                                |
| Saved progress seems missing                      | Check that you opened the same running installation and kept the same Compose project — consult [operations](docs/operations.md) before changing or restoring data                                  |
| Lessons do not load                               | Keep unsaved text safe, check `docker compose ps`, then use **Retry loading** if it is shown — check the local URL and app logs if the error remains                                                |

This section will expand as development continues
