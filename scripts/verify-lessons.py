#!/usr/bin/env python3
# Recompute evidence-backed answers from independently parsed synthetic records
import json
import hashlib
from datetime import datetime
from pathlib import Path

lessons = {lesson['id']: lesson for lesson in json.loads(Path('content/lessons.json').read_text())}
manifest = json.loads(Path('content/synthetic-evidence.json').read_text())

# Look up keys separately from the evidence extraction performed below
def answers(lesson_id, task_id):
    return next(task['answers'] for task in lessons[lesson_id]['tasks'] if task['id'] == task_id)

# Reject stale evidence copies before recomputing scenario-specific facts
for lesson_id, original in manifest.items():
    evidence = json.loads(Path(f'public/evidence/{lesson_id}.json').read_text())
    assert evidence == original, f'Stale generated evidence: {lesson_id}'
    assert evidence['synthetic'] is True
    assert lessons[lesson_id]['material'].split('\n\nProfessional case — synthetic, case version 1\n')[0] == json.dumps(evidence['records'], indent=2), f'Inline evidence mismatch: {lesson_id}'
    rows = evidence['records']
    assert len({row['id'] for row in rows}) == len(rows)
    if lesson_id == 'cyber-dns-behaviour':
        negative = [row for row in rows if row['rcode'] == 'NXDOMAIN']
        assert answers(lesson_id, 'missing-name') == list({row['name'] for row in negative})
        assert answers(lesson_id, 'dns-records') == [row['id'] for row in negative]
        assert answers(lesson_id, 'negative-code') == [negative[0]['rcode']]
        assert rows[0]['type'] == 'A' and ':' not in rows[0]['answer']
    elif lesson_id == 'cyber-authentication-logs':
        failed = [row for row in rows if row['event'] == 4625]
        success = [row for row in rows if row['event'] == 4624 and row['user'] == failed[0]['user']]
        assert len(failed) == 2 and all(row['source'] == success[0]['source'] for row in failed)
        assert answers(lesson_id, 'failed-event') == [str(failed[0]['event'])]
        assert answers(lesson_id, 'account') == [failed[0]['user']]
        assert answers(lesson_id, 'success-record') == [success[0]['id']]
        assert answers(lesson_id, 'review-success') == [str(success[0]['event'])]
        assert all(row['logonType'] == 3 for row in rows)
    elif lesson_id == 'cyber-phishing-triage':
        message, directory = rows
        assert answers(lesson_id, 'reply-domain') == [message['replyTo'].split('@')[1]]
        from urllib.parse import urlparse
        assert answers(lesson_id, 'destination') == [urlparse(message['linkTarget']).hostname]
        assert urlparse(message['linkTarget']).hostname != urlparse(directory['officialPortal']).hostname
        assert 'password' in message['request'] and '10 minutes' in message['request']
        assert set(answers(lesson_id, 'signals')) == {'password','mismatch','deadline'}
    elif lesson_id == 'cyber-endpoint-correlation':
        # Join by processGuid because the supplied records deliberately reuse a PID
        network = next(row for row in rows if row['event'] == 3)
        process = next(row for row in rows if row['event'] == 1 and row['processGuid'] == network['processGuid'])
        assert answers(lesson_id, 'guid') == [network['processGuid']]
        assert answers(lesson_id, 'image') == [process['image']]
        assert answers(lesson_id, 'joined') == [process['id'],network['id']]
        assert len({row['processGuid'] for row in rows if row['pid'] == 400}) == 2
        assert answers(lesson_id, 'review-event') == [str(network['event'])]
    elif lesson_id == 'cyber-evidence-integrity':
        # Hash the downloadable bytes rather than trusting the digest written into the manifest
        for row in rows[:2]:
            content = Path('public/evidence/' + row['file']).read_bytes()
            assert hashlib.sha256(content).hexdigest() == row['sha256']
        assert rows[0]['sha256'] != rows[1]['sha256']
        assert answers(lesson_id, 'collector') == [rows[2]['collector']]
        assert answers(lesson_id, 'same-bytes') == ['different']
        assert answers(lesson_id, 'hash-name') == ['SHA256']
    elif lesson_id == 'cyber-incident-timeline':
        # Order actual event times with offsets, independently of collector ingestion order
        ordered = sorted(rows,key=lambda row:datetime.fromisoformat(row['eventTime'].replace('Z','+00:00')))
        assert answers(lesson_id, 'first-event') == [ordered[0]['id']]
        assert answers(lesson_id, 'last-event') == [ordered[-1]['id']]
        from datetime import timezone
        assert answers(lesson_id, 'utc-first') == [datetime.fromisoformat(ordered[0]['eventTime']).astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')]
        assert sorted(rows,key=lambda row:row['ingestedAt'])[0]['id'] != ordered[0]['id']
    elif lesson_id == 'cyber-cloud-iam':
        from fnmatch import fnmatchcase
        audit = next(row for row in rows if row['id'] == 'audit-01')
        # Evaluate only the supplied identity-policy subset, with explicit deny overriding matching allows
        matching = [row for row in rows if row.get('effect') and row['action'] == audit['action'] and fnmatchcase(audit['resource'],row['resource'])]
        decision = 'deny' if any(row['effect'] == 'Deny' for row in matching) else 'allow' if matching else 'deny'
        assert answers(lesson_id, 'decision') == [decision]
        assert answers(lesson_id, 'principal') == [audit['principal']]
        assert answers(lesson_id, 'action') == [audit['action']]
        assert answers(lesson_id, 'denial') == [next(row['id'] for row in matching if row['effect'] == 'Deny')]
        assert audit['outcome'] == 'AccessDenied'
    elif lesson_id == 'cyber-threat-hunt':
        focus = rows[0]
        # Require the contrary context record as well as the records supporting the hunt hypothesis
        relevant = [row for row in rows if row['user'] == focus['user'] and row['source'] == focus['source']]
        assert answers(lesson_id, 'hunt-user') == [focus['user']]
        assert answers(lesson_id, 'correlated-records') == [row['id'] for row in relevant]
        assert answers(lesson_id, 'contrary-record') == [next(row['id'] for row in relevant if row['result'] == 'Change window approved')]
    elif lesson_id == 'cyber-investigation-report':
        assert answers(lesson_id, 'case-host') == [rows[0]['host']]
        assert answers(lesson_id, 'case-user') == [rows[0]['user']]
        context = next(row for row in rows if 'scheduled' in row['observation'])
        assert answers(lesson_id, 'context-record') == [context['id']]
        report = next(task for task in lessons[lesson_id]['tasks'] if task['kind'] == 'report')
        fields = {field['id']:field for field in report['fields']}
        assert fields['host']['answers'] == [rows[0]['host']]
        assert fields['account']['answers'] == [rows[0]['user']]
        assert fields['observation']['answers'] == [rows[0]['id']]
        assert fields['context']['answers'] == [context['id']]
    else:
        raise AssertionError(f'No independent evidence checks for {lesson_id}')
print(f'Independently verified {len(manifest)} synthetic evidence packs and their extraction keys')
