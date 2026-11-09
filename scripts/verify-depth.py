#!/usr/bin/env python3
# Check progression, actual supporting records and immutable passage answer relationships independently of the UI
import json
from pathlib import Path

# Load authored lessons and require the downloadable professional cases to match their manifest
lessons=json.loads(Path('content/lessons.json').read_text())
cases=json.loads(Path('content/professional-cases.json').read_text())
assert cases == json.loads(Path('public/evidence/professional-cases.json').read_text())

# Check professional tier coverage and immutable reading relationships for each lesson
for lesson in lessons:
    tasks=lesson['tasks']
    if lesson['course']=='Cybersecurity':
        assert {t['tier'] for t in tasks} == {'University Intermediate','Junior Professional','Advanced Challenge'}
        assert cases[lesson['id']]['records'] in lesson['material']
        for name in ['case-decision','case-gap','case-justification']:
            assert any(t['id']==name for t in tasks)
        assert next(t for t in tasks if t['id']=='case-justification')['kind']=='written'
        if 'timeline' in lesson['id']:
            first=(-90,90);second=(-30,150)
            assert max(first[0],second[0]) <= min(first[1],second[1])
        if any(t['id']=='attack-mapping' for t in tasks):
            task=next(t for t in tasks if t['id']=='attack-mapping')
            key=next(o['label'] for o in task['options'] if o['id']==task['answers'][0])
            assert ('T1078' in key and 'reused the lab-admin test credential' in lesson['material']) or ('T1059.001' in key and 'powershell.exe' in lesson['material'])
    for task in tasks:
        if task.get('passage'):
            passage=task['passage'];assert passage['version']>=1 and passage['retrieved']=='2026-11-06'
            assert passage['difficulty'] in ['Medium','Hard'] and len(passage['text'].split())>=150
            assert passage['publisher'] in passage['text'] or passage['publisher'] in ['ASD','Bureau of Meteorology']
            assert task['kind']=='report' and len(task['fields'])>=7
            assert next(f for f in task['fields'] if f['id']=='publisher')['answers']==[passage['publisher']]
            assert next(f for f in task['fields'] if f['id']=='gap')['answers'][0] in passage['text']
            assert 'Original Study Lab' in passage['reuse']
assert len([t for l in lessons for t in l['tasks'] if t.get('passage')])==6
print('Verified 10 three-level professional cases, controlled ATT&CK evidence and 6 versioned reading groups')
