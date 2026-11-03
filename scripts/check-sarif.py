#!/usr/bin/env python3
"""Fail on CodeQL error/warning findings, or absent/invalid scanner output."""
import json
import sys
from pathlib import Path

# Require actual SARIF output so a missing scanner result cannot count as a clean scan
files = list(Path(sys.argv[1]).rglob('*.sarif'))
if not files:
    sys.exit('Code analysis produced no SARIF; this is not a clean scan.')

# Inspect each run and use rule defaults when a result does not supply its own severity
findings = []
for path in files:
    report = json.loads(path.read_text())
    assert report['version'] == '2.1.0'
    assert report['runs'], 'No analysis runs'
    for run in report['runs']:

        # Reject reported scanner failures before considering any finding counts
        for invocation in run.get('invocations', []):
            assert invocation.get('executionSuccessful', True), 'Scanner execution failed'
        rules = {rule['id']: rule for rule in run.get('tool', {}).get('driver', {}).get('rules', [])}
        for result in run.get('results', []):
            rule = rules.get(result.get('ruleId'), {})
            level = result.get('level', rule.get('defaultConfiguration', {}).get('level', 'warning'))
            if level in ['error', 'warning']:
                findings.append(result)

# Fail on warning or error findings instead of treating a generated report as a passing scan
if findings:
    sys.exit(f'CodeQL found {len(findings)} warning/error results. Inspect SARIF artifact.')
print('CodeQL SARIF validated; no warning/error findings.')
