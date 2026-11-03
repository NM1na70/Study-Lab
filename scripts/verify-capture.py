#!/usr/bin/env python3
"""Independent byte-level parser verifies PCAP, IPv4/TCP integrity and lesson keys."""
import datetime
import hashlib
import json
import socket
import struct
from pathlib import Path

# Verify the bundled Ethernet PCAP header before decoding its records independently of the generator
raw = Path('public/evidence/check-in.pcap').read_bytes()
assert struct.unpack('<IHHIIII', raw[:24]) == (0xa1b2c3d4, 2, 4, 0, 0, 65535, 1)
position, frames, requests = 24, [], []

# Fold the checksum words so valid headers and pseudo-headers sum to all one bits
def valid_checksum(data):
    padded = data + b'\0' * (len(data) % 2)
    total = sum(struct.unpack('!%dH' % (len(padded) // 2), padded))
    while total >> 16:
        total = (total & 65535) + (total >> 16)
    return total == 65535

# Check captured lengths and IPv4 and TCP integrity before extracting request payloads
while position < len(raw):
    sec, usec, captured, original = struct.unpack('<IIII', raw[position:position + 16])
    position += 16
    packet = raw[position:position + captured]
    position += captured
    assert captured == original == len(packet)
    assert packet[12:14] == b'\x08\x00'
    ip = packet[14:]
    assert ip[0] == 69 and ip[9] == 6 and valid_checksum(ip[:20])
    assert struct.unpack('!H', ip[2:4])[0] == len(ip)
    src, dst = socket.inet_ntoa(ip[12:16]), socket.inet_ntoa(ip[16:20])

    # Include the pseudo-header in the TCP checksum and respect the declared TCP header length
    tcp = ip[20:]
    pseudo = ip[12:20] + struct.pack('!BBH', 0, 6, len(tcp))
    assert valid_checksum(pseudo + tcp)
    payload = tcp[(tcp[12] >> 4) * 4:]
    row = {'frame': len(frames) + 1, 'utc': datetime.datetime.fromtimestamp(sec + usec / 1e6, datetime.timezone.utc).isoformat(), 'epoch': sec + usec / 1e6, 'source': src, 'destination': dst, 'payload': payload.decode('ascii')}
    frames.append(row)
    if payload.startswith(b'GET '):
        requests.append(row)

# Compare the decoded frame numbers, UTC times, endpoints, requests, and responses with the lesson scenario
assert len(frames) == 12
assert [r['frame'] for r in requests] == [4, 6, 8]
assert [r['epoch'] for r in requests] == [1793491201, 1793491231, 1793491261]
assert all(r['source'] == '192.0.2.10' and r['destination'] == '198.51.100.20' for r in requests)
assert all(r['payload'].startswith('GET /checkin?host=lab-01 HTTP/1.1\r\nHost: telemetry.lab.test\r\n') for r in requests)
assert [r['payload'] for r in frames if r['payload'].startswith('HTTP')] == ['HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\n\r\nok\n'] * 3

# Derive expected task answers from captured evidence rather than trusting the lesson key alone
lesson = next(l for l in json.loads(Path('content/lessons.json').read_text()) if l['course'] == 'Cybersecurity')
answers = {t['id']: t['answers'] for t in lesson['tasks']}
for key, expected in {'source-host': requests[0]['source'], 'destination-host': requests[0]['destination'], 'request-count': str(len(requests)), 'request-path': requests[0]['payload'].split(' ')[1], 'third-frame': str(requests[2]['frame']), 'interval': str(int(requests[1]['epoch'] - requests[0]['epoch']))}.items():
    assert answers[key] == [expected], (key, expected)

# Refuse a stale evidence summary and create it only when it does not already exist
summary = {'synthetic': True, 'licence': 'CC0-1.0: original Study Lab synthetic evidence dedicated to the public domain.', 'sha256': hashlib.sha256(raw).hexdigest(), 'frames': frames}
expected = json.dumps(summary, indent=2) + '\n'
summary_path = Path('public/evidence/summary.json')
if summary_path.exists():
    assert summary_path.read_text() == expected, 'Evidence summary differs from capture; regenerate explicitly.'
else:
    summary_path.write_text(expected)
print(f'PCAP verified: 12 frames; HTTP at 4/6/8; 30s intervals; checksums and lesson answers match. SHA256 {summary["sha256"]}')
