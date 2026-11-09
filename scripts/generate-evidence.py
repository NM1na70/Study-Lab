#!/usr/bin/env python3
# Generate inert evidence files from the original scenario manifest without contacting any host
import json
from pathlib import Path

# Load the reviewed manifest and require each emitted pack to be explicitly synthetic
manifest = json.loads(Path('content/synthetic-evidence.json').read_text())
for lesson_id, evidence in manifest.items():
    assert evidence['synthetic'] is True
    Path(f'public/evidence/{lesson_id}.json').write_text(json.dumps(evidence, indent=2) + '\n')

# Recreate comparison files with their exact final newline before independent hash verification
for record in manifest['cyber-evidence-integrity']['records']:
    if 'content' in record:
        Path('public/evidence/' + record['file']).write_bytes(record['content'].encode('utf-8'))
print(f'Generated {len(manifest)} original synthetic evidence files')

# Copy the authored professional case manifest without changing its reviewed formatting
Path('public/evidence/professional-cases.json').write_bytes(Path('content/professional-cases.json').read_bytes())
