# Curriculum Depth And Assessment Review

All 20 lessons remain unlocked — question tiers describe the work, not certification or guaranteed mastery

## Cybersecurity

### 1 — Investigate a suspicious HTTP check-in

ID: cyber-network-investigation · version 4 · 11 questions · about 82 minutes

Objectives: Identify hosts and isolate HTTP requests with display filters.; Follow a TCP conversation and cite frames and timestamps.; Complete a short, self-reviewed report that separates observed traffic from unproven claims; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: Proxy P1 shows GET /status at 01:00:00 and 01:00:30; capture N1 covers only 01:00:00–01:00:20; asset register A1 lists a monitoring agent on the host; endpoint E1 is unavailable

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

### 2 — Investigate DNS behaviour

ID: cyber-dns-behaviour · version 2 · 9 questions · about 62 minutes

Objectives: Distinguish DNS questions, answers and NXDOMAIN; Correlate repeated queries with resolver responses; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: Resolver D1 logs 40 NXDOMAIN replies from WS4 in 5 minutes; baseline B1 shows 2 per day; deployment C1 changed the search suffix at the same minute; D2 queries for the old suffix stop after rollback; no process telemetry was collected

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

### 3 — Investigate authentication events

ID: cyber-authentication-logs · version 2 · 10 questions · about 69 minutes

Objectives: Correlate failed and successful network logons cautiously; Build an account-focused authentication finding; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: A1 shows lab-admin authentication from a new source at 02:00; A2 shows a service ticket from the same source; change record C1 authorises automation but names a different source; MFA records cover interactive sign-ins only; no credential acquisition evidence is supplied
A3 scenario-controller record: the authorised exercise actor reused the lab-admin test credential outside the approved automation scope; this is known simulated misuse, not a conclusion inferred solely from a successful logon

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

### 4 — Triage a suspicious message

ID: cyber-phishing-triage · version 2 · 9 questions · about 62 minutes

Objectives: Inspect sender, destination and requested action safely; Triage a harmless synthetic message without opening links; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: M1 has an external Reply-To and password request; gateway G1 records SPF pass for the external sender domain, not the internal display name; G2 records a blocked link click; identity I1 has no sign-in data for the interval

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

### 5 — Correlate endpoint activity

ID: cyber-endpoint-correlation · version 2 · 11 questions · about 99 minutes

Objectives: Link process creation to network activity by stable identifiers; Compare process and network events; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: P1 records process GUID g-a, PID 400, updater.exe at 03:00; N1 connects GUID g-a at 03:01; P2 reuses PID 400 with GUID g-b at 04:00; C1 authorises updater.exe but supplies no hash; H1 has a hash only for g-b
P3 script-block record: a powershell.exe child with GUID g-c executes Start-Process probe; the exercise controller records this as unauthorised scripted execution inside the fictional scenario

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

### 6 — Preserve and compare evidence

ID: cyber-evidence-integrity · version 2 · 9 questions · about 62 minutes

Objectives: Use hashes, collection records and scope limits correctly; Verify two original synthetic evidence files; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: Acquisition Q1 records source disk S1, examiner Jo and digest aa11; transfer Q2 repeats digest aa11 but omits receiving person; working copy Q3 has digest bb22 after annotation; no retained pre-annotation copy is supplied
The ledger digest strings are abbreviated labels, not complete hashes — the full acquisition manifest is unavailable for this professional case

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

### 7 — Build an incident timeline

ID: cyber-incident-timeline · version 2 · 9 questions · about 67 minutes

Objectives: Normalise UTC offsets and distinguish event from ingestion time; Order a mixed-offset timeline; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: T1 authentication has event time 10:00+10:00 with uncertainty ±90 seconds; T2 connection has event time 00:01Z with uncertainty ±90 seconds; T3 collector received T2 before T1; clock synchronisation history is unavailable

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

### 8 — Investigate cloud permissions locally

ID: cyber-cloud-iam · version 2 · 9 questions · about 67 minutes

Objectives: Evaluate explicit deny and correlate policy with audit evidence; Evaluate a bounded synthetic IAM policy case; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: Policy I1 permits GetObject on lab/_; I2 explicitly denies lab/private/_; request R1 targets lab/private/a and is AccessDenied; request R2 targets lab/public/a and succeeds; the supplied records omit bucket/resource policies and session constraints

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

### 9 — Test an account-misuse hypothesis

ID: cyber-threat-hunt · version 2 · 9 questions · about 72 minutes

Objectives: Use corroborating and contrary evidence in a local hunt; Triage a small account activity dataset; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: H1 records service-account access outside the usual hour; C1 authorises an emergency job but does not name the observed source; H2 shows the same source on an unrelated host; coverage V1 excludes the preceding day; the analyst hypothesis is stolen credentials

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

### 10 — Assemble an investigation handover

ID: cyber-investigation-report · version 2 · 9 questions · about 77 minutes

Objectives: Connect claims to records and recommend proportionate next checks; Build a connected report from a combined local evidence pack; Investigate incomplete professional evidence and compare competing explanations; Justify an independent, proportionate decision while preserving evidence and service availability

New professional evidence: Witness W1 recalls a transfer at 12:00; sensor S1 shows a connection at 12:02 but no payload; collection C1 occurred at 14:00; asset A1 identifies a shared host; no user-to-process/session join exists

Assessment: supported case decision → specific evidence gap → independent justified interpretation using named records, a competing explanation and a discriminating next check — foundational keys remain unchanged, while new requirements need fresh assessment

## English

### 1 — Build words with -tion

ID: english-word-families · version 2 · 8 questions · about 25 minutes

Objectives: Spell four useful -tion nouns without fuzzy matching.; Connect act, connect, detect and protect with their noun forms.; Use the nouns in a short, self-reviewed security note.

Control purpose: exact, select, written — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

### 2 — Recall useful spelling patterns

ID: english-spelling-patterns · version 1 · 6 questions · about 25 minutes

Objectives: Recall difficult words and notice sound–spelling limits; Repair a short maintenance note

Control purpose: choice, exact, written — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

### 3 — Read for actions and constraints

ID: english-reading-actions · version 2 · 7 questions · about 43 minutes

Objectives: Extract who, when and conditions from a short notice; Turn a maintenance notice into an action summary

Control purpose: choice, exact, multiple, report, written — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

Reading: Cybersecurity logging announcement · Medium · stored snapshot news-cyber-medium v1

### 4 — Make time and actions clear

ID: english-verb-time · version 1 · 6 questions · about 25 minutes

Objectives: Choose tense and agreement in practical updates; Write a clear before-and-now update

Control purpose: choice, exact, written — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

### 5 — Build clear sentences

ID: english-sentence-boundaries · version 1 · 6 questions · about 25 minutes

Objectives: Join or separate ideas without comma splices; Edit a short handover paragraph

Control purpose: choice, exact, select, written — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

### 6 — Choose precise workplace words

ID: english-precise-vocabulary · version 2 · 7 questions · about 43 minutes

Objectives: Distinguish similar words and reduce vague wording; Repair ambiguous status messages

Control purpose: choice, exact, report, written — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

Reading: Artemis II science records released · Medium · stored snapshot news-international-medium v1

### 7 — Write useful workplace emails

ID: english-workplace-emails · version 2 · 7 questions · about 48 minutes

Objectives: State purpose, action and a realistic deadline; Write a short request with useful context

Control purpose: choice, exact, multiple, report, written — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

Reading: Climate patterns and local impacts · Medium · stored snapshot news-australia-medium v1

### 8 — Express evidence and uncertainty

ID: english-evidence-language · version 2 · 7 questions · about 52 minutes

Objectives: Separate observation, interpretation and missing information; Rewrite an overconfident finding

Control purpose: choice, exact, multiple, report, select, written — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

Reading: Cybersecurity logging announcement · Hard · stored snapshot news-cyber-hard v1

### 9 — Write steps and short summaries

ID: english-instructions · version 2 · 7 questions · about 52 minutes

Objectives: Sequence safe actions and preserve important constraints; Write a short operational instruction

Control purpose: choice, exact, report, select, written — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

Reading: Climate patterns and local impacts · Hard · stored snapshot news-australia-hard v1

### 10 — Write a concise evidence handover

ID: english-report-handover · version 2 · 7 questions · about 57 minutes

Objectives: Assemble findings, uncertainty and a useful recommendation; Complete a short workplace report

Control purpose: choice, exact, report — typing is retained where recall/spelling is the objective; reasoning is explicitly self-reviewed

Reading: Artemis II science records released · Hard · stored snapshot news-international-hard v1
