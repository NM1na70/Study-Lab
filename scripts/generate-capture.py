#!/usr/bin/env python3
"""Generate original harmless Ethernet/IPv4/TCP HTTP traffic; no live network I/O."""
import socket
import struct
from pathlib import Path

# Calculate the Internet checksum used by the IPv4 header and TCP pseudo-header
def checksum(data):
    data += b'\0' * (len(data) % 2)
    total = sum(struct.unpack('!%dH' % (len(data) // 2), data))
    while total >> 16:
        total = (total & 65535) + (total >> 16)
    return (~total) & 65535

# Use documentation-only addresses and collect packet bytes without contacting a network
client, server = '192.0.2.10', '198.51.100.20'
frames = []

# Build one Ethernet, IPv4, and TCP frame with valid checksums and a fixed UTC time base
def packet(time, outgoing, seq, ack, flags, payload=b''):
    src, dst = (client, server) if outgoing else (server, client)
    sport, dport = (49152, 80) if outgoing else (80, 49152)
    tcp = struct.pack('!HHIIBBHHH', sport, dport, seq, ack, 80, flags, 65535, 0, 0)
    pseudo = socket.inet_aton(src) + socket.inet_aton(dst) + struct.pack('!BBH', 0, 6, len(tcp) + len(payload))

    # Include the IP endpoints and TCP length when protecting the transport header and payload
    tcp = tcp[:16] + struct.pack('!H', checksum(pseudo + tcp + payload)) + tcp[18:]
    ip = struct.pack('!BBHHHBBH4s4s', 69, 0, 40 + len(payload), len(frames) + 1, 16384, 64, 6, 0, socket.inet_aton(src), socket.inet_aton(dst))
    ip = ip[:10] + struct.pack('!H', checksum(ip)) + ip[12:]
    ethernet = bytes.fromhex('0200000000020200000000010800')
    frames.append((1793491200 + time, ethernet + ip + tcp + payload))

# Establish the synthetic TCP connection before sending the repeated HTTP requests
packet(0, True, 1000, 0, 2)
packet(0.01, False, 5000, 1001, 18)
packet(0.02, True, 1001, 5001, 16)
cs, ss = 1001, 5001
request = b'GET /checkin?host=lab-01 HTTP/1.1\r\nHost: telemetry.lab.test\r\nUser-Agent: StudyLab-Synthetic/1.0\r\n\r\n'
response = b'HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\n\r\nok\n'

# Simulate three harmless check-ins while advancing sequence numbers by the actual payload lengths
for t in [1, 31, 61]:
    packet(t, True, cs, ss, 24, request)
    cs += len(request)
    packet(t + 0.1, False, ss, cs, 24, response)
    ss += len(response)

# Close the TCP connection and write a standard little-endian Ethernet PCAP
packet(62, True, cs, ss, 17)
packet(62.1, False, ss, cs + 1, 17)
packet(62.2, True, cs + 1, ss + 1, 16)
output = bytearray(struct.pack('<IHHIIII', 0xa1b2c3d4, 2, 4, 0, 0, 65535, 1))
for time, data in frames:
    seconds = int(time)
    output += struct.pack('<IIII', seconds, round((time - seconds) * 1000000), len(data), len(data)) + data
Path('public/evidence/check-in.pcap').write_bytes(output)
print(f'Generated {len(frames)} frames, {len(output)} bytes')
