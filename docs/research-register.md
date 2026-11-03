# Engineering research, 3 November 2026

Consulted official documentation and actual installed package types before use:

- [Node 24 SQLite API](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html): DatabaseSync, prepared statements and online backup.
- [React Quick Start](https://react.dev/learn): components, state and events.
- [Vite guide](https://vite.dev/guide/): local modules, production build and Node requirements.
- [Fastify validation](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/): boundary validation/error conventions. This application uses explicit Zod parsing rather than invented Fastify schema imports.
- [Vitest guide](https://vitest.dev/guide/): installed version/config and test lifecycle.
- [Playwright configuration](https://playwright.dev/docs/test-configuration): initial web fetch failed; installed @playwright/test types and CLI validated config, projects, server management and browser installation.
- [Docker Compose variable interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/): explicit localhost/LAN setting and defaults.
- [GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use): pinned SHAs, least privilege and untrusted PR text handling.
- [Gitleaks upstream](https://github.com/gitleaks/gitleaks): current `dir` scan and redacted JSON output.
- [Trivy image scanning](https://trivy.dev/docs/latest/target/container_image/): image archive input, severity and nonzero finding exit status.

GitHub API and raw upstream action.yml verified checkout v7.0.1, setup-node v7.1.0, upload-artifact v7.0.2 and CodeQL v4.39.1, including annotated-tag resolution. Workflow SHA comments record those versions. Gitleaks v8.30.1 and Trivy v0.76.1 came from upstream release metadata. Actual scanner availability and results are recorded separately in verification.md; release metadata is not proof of a clean scan.

No Context7 tool was available. No third-party source was copied. See content-and-sources.md and lesson metadata for learning-source details.
