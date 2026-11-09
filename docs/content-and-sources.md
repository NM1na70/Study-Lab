# Content provenance and validation

The original English lesson narrows to four -tion word families: act/action, connect/connection, detect/detection, protect/protection. Its 25 minutes comprise teaching, six precise practice tasks, independent writing and review. It assumes comfortable everyday speech without claiming equivalent spelling ability. It uses Australian spelling conventions and no Chinese translation, dictation or listening claims. Connection's syllable model comes from the Cambridge UK pronunciation page, explicitly not an Australian accent standard. No audio is required or bundled.

The original 60-minute cybersecurity lesson assumes networking/Linux knowledge. It teaches Wireshark filters, stream reading, evidence versus inference, independent frame/time analysis and a written report with technical and language checklists. The supplied PCAP is a harmless simulation of repeated HTTP polling. It does not establish a real malware incident. Documentation IPs and .test names are used; no target is contacted. The original synthetic PCAP and decoded summary are dedicated to the public domain under CC0-1.0; attribution is in public/evidence/README.txt.

Every lesson source has title, URL, access date, support statement and reuse/attribution notes in content/lessons.json. All explanations and exercises are independently written; no source audio, graphics, courses, boilerplate code or datasets are copied. Reference material is linked, not bundled as copyrighted course content.

Verified pages on 3 November 2026:

- [BBC Learning English suffixes PDF](https://downloads.bbc.co.uk/learningenglish/intermediate/unit24/b2_u24_6min_vocab_tian_sion_tion.pdf): suffixes, word families and multiple spellings for a shared ending. The lesson's four specific exercises are original.
- [Cambridge connection pronunciation](https://dictionary.cambridge.org/pronunciation/english/connection): the UK syllable model. The main dictionary definition pages returned 403; no unsupported claims are attributed to those pages.
- [Wireshark display filters](https://www.wireshark.org/docs/wsug_html_chunked/ChWorkBuildDisplayFilterSection.html): HTTP/IP fields and filter semantics.
- [Wireshark streams](https://www.wireshark.org/docs/wsug_html_chunked/ChAdvFollowStreamSection.html): Follow TCP Stream behaviour.

The brief's external Garage reference was treated as engineering ideas, not copied source or authority. The web fetch of its repository failed; independent implementation used the detailed supplied review. No licence-dependent code reuse was necessary.

`pnpm content:validate` parses the Zod schema and checks duplicate lesson/task/source IDs, task-source and teaching-source references, exact answer/example consistency, hints, explanations and required activity stages. Finding mappings reference other tasks in the same lesson and report fields; content validation resolves these identities, while domain logic bounds current-position numbers. The separate capture parser verifies the file header, packet lengths, IPv4/TCP checksums, HTTP payloads, frame numbers, UTC timestamps, host addresses, request intervals, decoded summary and actual answer keys. No generated answer is accepted merely because it looks plausible.

```bash
python3 scripts/generate-capture.py
# Only when intentionally changing evidence, remove the old generated summary first.
python3 scripts/verify-capture.py
pnpm content:validate
```

The byte-level parser is the equivalent parser used for required validation; no Wireshark UI execution is claimed. Generator and parser are separate code. Existing summary mismatches fail rather than being silently regenerated. Future content needs human review plus evidence tests and explicit content migrations.

## Guided Report Research — 4 November 2026

Reviewed the [ASD practitioner guidance](https://www.cyber.gov.au/publication/cyber-security-incident-response-planning-practitioner-guidance), its linked [December 2024 PDF](https://www.cyber.gov.au/sites/default/files/2026-10/Cyber%20security%20incident%20response%20planning%20%E2%80%93%20Practitioner%20guidance%20%28December%202024%29.pdf) and [website copyright conditions](https://www.cyber.gov.au/copyright) on 4 November 2026

The relevant PDF sections are Documentation and Evidence Collection And Preservation, printed pages 20–21; Appendix D Situation Report Template, page 32; and Appendix H incident summary, pages 38–39 — PDF page indexes are 23–24, 35 and 41–42 respectively

These support dated, evidence-based reporting — Study Lab's original adaptation separates observable facts, possible interpretation, unknowns and next checks, with all network-specific fields derived independently from its synthetic capture

The real templates include organisational matters that this capture cannot establish — the exercise omits required severity, impact, root cause, containment and confirmed compromise rather than inviting invented findings

Attribution: Australian Signals Directorate, © Commonwealth of Australia 2024 for the PDF and © Commonwealth of Australia 2026 for the website, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) subject to their stated exceptions — the adaptation uses original learner wording, reproduces no protected symbols or official form and implies no government endorsement

Exact source URLs, access dates, support and reuse notes are also recorded with the lesson — sources are optional links and introduce no runtime network dependency

The version 2 report had eight deterministically checked factual fields and four explicitly self-reviewed reasoning fields, without a word-count requirement — checking facts alone does not complete or technically grade the reasoning

Content validation now checks unique option/field IDs, valid key references, checkable examples, reasoning without answer keys and literal emphasis tokens — the PCAP parser separately verifies selected request frames and all factual report examples against the decoded evidence

## Connected Report Refinement — 5 November 2026

Re-read the official practitioner webpage's Documentation, Evidence Collection And Preservation, Investigation Questions and Appendices D, E, F and H, together with the linked December 2024 PDF and the copyright page linked above — source metadata records this access date

The four learning sections use original wording and retain dated observations, evidence, uncertainty and proposed next checks — they do not claim to be an official ASD, ACSC or AFP form, an endorsed product or an incident-submission service

The current report has twelve objective fields and two short reasoning fields — facts, option IDs and claim-to-evidence relationships are assessed from explicit scenario data, while reasoning remains explicitly self-reviewed

Automated polling, possibly benign polling, potentially suspicious polling and inconclusive purpose are qualified choices — regular request timing and the repeated URI support an automated pattern, while missing endpoint context supports uncertainty about purpose

Frame relationships are verified against the bundled PCAP rather than accepting any existing frame — GET remains the method, /checkin?host=lab-01 the URI and Host a separate header

The limitations include malware status, process identity, theft, compromise and attribution — next steps are recommendations for more evidence, never claims that an action has already been performed

The original adaptation and attribution/reuse notes above still apply — no government logos or official form assets are reproduced

## Expanded Pack — 5 November 2026

The catalogue contains 10 English and 10 Cybersecurity lessons — course-sequences.md records the intended progression and pilot-findings.md explains changes learned from the six-lesson checkpoint

New teaching, workplace briefs and all nine additional cyber datasets are original — reference pages are linked, no passages or third-party datasets are copied, and no agency endorsement is implied

Synthetic .test hosts, documentation addresses, fictional users and inert records require no contact with live systems — comparison text files are real downloadable bytes with independently checked SHA256 digests

- [Australian Government Style Manual: Spelling](https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/spelling) — accessed 2026-11-05; Relevant section: Dictionary consistency and spelling guidance — Choose one dictionary for consistency; original Australian English word practice; reference only, no source material copied
- [Australian Government Style Manual: Plain language and word choice](https://www.stylemanual.gov.au/writing-and-designing-content/clear-language-and-writing-style/plain-language-and-word-choice) — accessed 2026-11-05; Relevant section: Plain language and word choice guidance — Use everyday words and active voice; original workplace examples; reference only, no source material copied
- [RFC 1035: Domain names — implementation and specification](https://www.rfc-editor.org/rfc/rfc1035.txt) — accessed 2026-11-05; Relevant section: Sections 3.2.2 A, 4.1.1 RCODE and 4.1.3 resource records — Sections 3.2 and 4.1: A records, questions and response codes; synthetic DNS events; reference only, no source material copied
- [Microsoft Learn: Event 4625](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4625) — accessed 2026-11-05; Relevant section: Event description, account information, logon type and network information — Event description and TargetUserName, IpAddress and LogonType fields; synthetic simplified event projection; reference only, no source material copied
- [Microsoft Learn: Event 4624](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4624) — accessed 2026-11-05; Relevant section: Event description and logon types — Successful logon and type 3 network logon; original simplified event records; reference only, no source material copied
- [Australian Government Style Manual: Verbs](https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/types-words/verbs) — accessed 2026-11-05; Relevant section: Verb tense and subject–verb agreement — Verb choices and active voice; original tense exercises; reference only, no source material copied
- [Australian Government Style Manual: Punctuation](https://www.stylemanual.gov.au/grammar-punctuation-and-conventions/punctuation) — accessed 2026-11-05; Relevant section: Sentence punctuation and apostrophe guidance — Full stops, commas and apostrophes; original sentence-editing practice; reference only, no source material copied
- [ASD: Learn about phishing scams](https://www.cyber.gov.au/guidance/learn-about-phishing-scams) — accessed 2026-11-05; Relevant section: Recognise phishing and verify through trusted channels — Warning signs and separate verification; original harmless message and .test URLs; reference only, no source material copied
- [Microsoft Sysinternals: Sysmon](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) — accessed 2026-11-05; Relevant section: Events 1 Process creation and 3 Network connection — Event IDs 1 and 3, ProcessGuid and hashes; original simplified process/network records; reference only, no source material copied
- [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final) — accessed 2026-11-05; Relevant section: Section 3.1 Collection and data integrity — Collection, examination, analysis and reporting; original evidence-register exercise; reference only, no source material copied
- [RFC 3339: Date and Time on the Internet](https://www.rfc-editor.org/rfc/rfc3339.txt) — accessed 2026-11-05; Relevant section: Sections 4 offsets and 5.6 Internet date/time format — Section 5.6: offsets and UTC timestamps; original timeline records; reference only, no source material copied
- [ASD: Best practices for event logging and threat detection](https://www.cyber.gov.au/publication/best-practices-for-event-logging-and-threat-detection) — accessed 2026-11-05; Relevant section: Event log quality, centralisation and correlation — Event correlation and investigation context; original synthetic scenarios; reference only, no source material copied
- [AWS IAM: Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html) — accessed 2026-11-05; Relevant section: Explicit deny overrides allow; identity-based policy evaluation — Explicit deny overrides allows in the simplified identity-policy exercise; not a complete AWS authorisation simulator; reference only, no source material copied
- [MITRE ATT&CK: Valid Accounts T1078](https://attack.mitre.org/techniques/T1078/) — accessed 2026-11-05; Relevant section: Description and detection context for valid account use — Hypotheses about account misuse require corroboration; original local hunt exercise; reference only, no source material copied

Run python3 scripts/generate-evidence.py to recreate all nine JSON packs and both comparison files — python3 scripts/verify-lessons.py independently parses the records, recomputes extraction keys and verifies hashes, UTC ordering and bounded IAM evaluation

The JSON evidence is a simplified teaching representation rather than raw Windows XML, production mail headers or a complete AWS authorisation simulation — each lesson states the limits of the supplied record set

## Completed Depth And News Extension — 6 November 2026

Professional case records are original and downloadable in evidence/professional-cases.json, reproduced from content/professional-cases.json — verify-depth.py checks tier coverage, exact case inclusion, time-uncertainty overlap, mapping evidence and reading keys

The original small foundations were retained as guided practice — new professional questions assess coverage, alternative explanations and qualified decisions rather than transferring old completion to different requirements

Primary references accessed on 6 November 2026 include ASD incident-response practitioner guidance and logging guidance, MITRE T1078 and T1059.001, Bureau of Meteorology climate-impact reporting, NASA preliminary lunar-science publication, and the official USGS GeoJSON summary contract and public-domain reuse policy

- https://www.cyber.gov.au/publication/cyber-security-incident-response-planning-practitioner-guidance — documentation/evidence boundaries, original cases only
- https://attack.mitre.org/techniques/T1078/ — valid-account misuse, supported only by explicit controlled evidence
- https://attack.mitre.org/techniques/T1059/001/ — PowerShell execution mechanism, not attribution
- https://www.bom.gov.au/news-and-media/el-nino-strength-doesnt-always-match-impact-on-australia — issued 15 September 2026, climate drivers versus local outcomes
- https://science.nasa.gov/feature/artemis-ii-preliminary-lunar-science-report/ — 7 October 2026 preliminary records, edited/unedited material distinction
- https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php — supported event fields, fixed weekly significant-event feed
- https://www.usgs.gov/faqs/are-usgs-reportspublications-copyrighted — USGS-produced facts are public domain; third-party media is not assumed reusable

Each bundled passage records its publisher, URL, date, retrieval, reuse basis and version — Study Lab summaries and fictional teaching analysis are labelled separately, with no publisher multimedia or full articles reproduced

Fresh snapshots preserve event occurrence separately from report-update/retrieval time, explicitly state unknown publication time and never infer local impact from magnitude alone — questions use the exact stored values rather than a changing live page

The AFP careers page attempted during research returned 404 and is not relied on as a verified current source — agency career emphasis is not an endorsement or a claim of access to internal methods
