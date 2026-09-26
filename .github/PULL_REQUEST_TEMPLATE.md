## Description

Summary of the changes introduced in this PR.

## Architecture & Quality Checklist

- [ ] Follows SOLID, KISS, and DRY principles.
- [ ] No inline code comments included.
- [ ] All code, files, and variable names are in English.
- [ ] All UI text is in Spanish.
- [ ] Scope was confirmed with the developer prior to implementation.
- [ ] Feature-First directory structure respected.

## Security & Testing Checklist

- [ ] No API keys, secrets, or credentials are hardcoded.
- [ ] Environment variables are validated in `src/config/env.config.ts`.
- [ ] Code passes OWASP XSS/CSRF guidelines (no unsafe DOM manipulation).
- [ ] Passes SAST scan principles (Fortify / SonarQube / Xray clean).
- [ ] Unit test coverage meets or exceeds **80%**.
- [ ] Executed `pnpm audit` with 0 high/critical vulnerabilities.
