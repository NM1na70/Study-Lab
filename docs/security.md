# Security boundaries and scanning

This is an unauthenticated local shared profile. Localhost is the default host bind. LAN exposure is a deliberate owner option; anyone allowed to connect can read and change the same progress. Origin checks reduce cross-site writes; they are not authentication. Do not expose the service to the public internet.

HTTP accepts bounded JSON and Zod-validated mutations; task IDs must resolve against bundled lessons. Database statements are parameterised. Static assets have a restrictive CSP, nosniff, no-referrer and frame denial. No application route executes host commands, opens captures, runs lab targets or runs autonomous tools. Core study requires no credentials; optional owner-only AI feedback uses a fixed HTTPS endpoint without tools. Container runs UID 1000 with a read-only image, dropped capabilities, no-new-privileges, a small /tmp and a writable named data volume; no Docker socket or DB port. Development API logging does not record learner answer bodies.

Security checks have concrete failure criteria:

- `pnpm security:audit`: HIGH or CRITICAL dependency advisories fail, including development dependencies. Registry/network errors fail; they do not mean clean.
- `pnpm security:secrets`: Gitleaks scans the working tree with default rules and redacted JSON; any detected secret fails. No baseline or broad allowlist. Binary capture is harmless synthetic data. Reports are ignored.
- `pnpm security:container`: Trivy scans an exported image archive for HIGH/CRITICAL OS and language dependency vulnerabilities; findings or scanner errors fail. No `--ignore-unfixed` or blanket exclusions. It does not mount the Docker socket. Scanner needs an initial vulnerability database download.
- CI CodeQL runs JavaScript/TypeScript analysis, emits SARIF and fails on warning/error results through scripts/check-sarif.py. Missing/invalid SARIF or scanner execution failure also fails. Results are kept for seven days, not silently treated as passing. CodeQL is an analysis job, not a locally claimed scan.

No `continue-on-error` or scanner exception is configured. Scanner container tags and official action SHAs were resolved from upstream during development on 3 November 2026. Dependabot updates npm groups, GitHub Actions and Docker base images weekly. Scanner image versions in scripts need manual review too. Review upgrades and run checks; a dependency audit alone is not a complete security assessment. Docker base image uses the exact Node runtime tag; lockfile pins package resolution.

No intentionally vulnerable target is included. Future targets need separate networks, volumes and lifecycle commands, with no default LAN exposure or access to learner data, the Docker socket or optional AI credentials.
