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

`pnpm content:validate` parses the Zod schema and checks duplicate lesson/task/source IDs, task-source and teaching-source references, exact answer/example consistency, hints, explanations and required activity stages. This model has no cross-task references: current-position numbers are bounds-checked by domain logic. The separate capture parser verifies the file header, packet lengths, IPv4/TCP checksums, HTTP payloads, frame numbers, UTC timestamps, host addresses, request intervals, decoded summary and actual answer keys. No generated answer is accepted merely because it looks plausible.

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
