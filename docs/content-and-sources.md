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
