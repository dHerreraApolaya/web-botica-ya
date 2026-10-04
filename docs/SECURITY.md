# Secure Software Development & Governance Guidelines

This document sets the mandatory security requirements for code generation and dependency management.

## 1. Secrets & Environment Variables Management

- **Zero Hardcoded Secrets**: Never commit API keys, tokens, passwords, or private URLs in code.
- **Environment Schema Validation**: All environment variables (`VITE_*`) must be declared and validated at build-time using `zod` in `src/config/env.config.ts`.
- **Client Exposure Limit**: Only variables prefixed with `VITE_` are accessible on the frontend. Never expose backend database connection strings or master API keys to the React application.

## 2. OWASP Top 10 Frontend Mitigations

- **Cross-Site Scripting (XSS)**:
  - Do NOT use `dangerouslySetInnerHTML` unless explicitly sanitized using DOMPurify.
  - User dynamic input must be sanitized before rendering.
- **Cross-Site Request Forgery (CSRF) & Storage**:
  - Do NOT store sensitive authentication tokens in `localStorage` or `sessionStorage` if accessible to third-party scripts. Prefer `httpOnly`, `SameSite=Strict` cookies or secured in-memory state.
- **Resource Integrity & Injection**:
  - Validate all external API payloads with `zod` schemas before using them in the UI state.

## 3. Static Application Security Testing (SAST) & Scanners Compliance

Code generated must comply with static analysis scanners (Fortify, SonarQube, JFrog Xray, Snyk):

- No usage of deprecated, dangerous, or unsafe functions (`eval()`, `document.write()`).
- All external links must include `rel="noopener noreferrer"`.
- Keep dependencies updated and zero high/critical vulnerabilities (`pnpm audit`).

## 4. Test Coverage & Quality Gates (TDD)

- **Minimum Unit Test Coverage**: **80%** (Statements, Branches, Functions, Lines).
- **Enforcement**: CI pipeline will fail automatically if PR coverage falls below 80%.
- **Core Coverage Targets**:
  - `src/features/feature-name/utils/`: 100% pure function coverage.
  - `src/features/feature-name/hooks/`: 90% logic coverage.
  - `src/components/ui/atoms/`: 100% component render & accessibility coverage.
