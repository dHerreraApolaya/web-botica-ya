# Dependency security review — 2026-11-17

The compatible refresh addressed the original lockfile's high/low findings. At PR submission, the updated picomatch advisory now blocks the complete dependency audit: **one high and one moderate finding remain**. No direct dependency was added, no major upgrade was forced, no scanner threshold was weakened and no override or audit suppression was introduced.

## Current blocking finding

[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), reviewed/updated on 2026-11-17, affects picomatch <=4.0.7 and lists no patched version. The npm registry's latest published version was confirmed as 4.0.7. The dependency enters this graph through Vite, Vitest, lint-staged and related development tools. Do not downgrade to another affected version or treat an unreviewed Git snapshot as a released patch.

The production-only dependency audit reported no known vulnerabilities, but this does not exempt development tooling from the mandatory complete audit. `pnpm audit --audit-level high` correctly fails and blocks merge. A supported upstream patch or a separately reviewed toolchain change is required; there is no suppression or temporary exception in this PR. The original correction evidence below describes the earlier compatible refresh, not the current gate result.

## Corrections

| Dependency            | Previous locked version | Corrected version | Evidence                                                                                                                 |
| --------------------- | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Vite                  | 8.3.1                   | 8.3.8             | [Launch-editor advisory](https://github.com/advisories/GHSA-587h-7wmj-h5pm), patched from 8.3.3                          |
| source-map-js         | 1.2.1                   | 1.2.2             | [Source-map denial of service](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)                                        |
| Undici, through jsdom | 8.11.2                  | 8.12.4            | [TLS options bypass](https://github.com/advisories/GHSA-2m5v-pch6-74hx), plus other advisories covered by the same patch |
| Vitest / mocker       | 5.0.2                   | 5.0.3             | [Manual mock registration advisory](https://github.com/advisories/GHSA-qxg6-89mg-rqv8)                                   |
| fast-uri              | 3.1.8                   | 3.1.9             | [URI scheme spoofing](https://github.com/advisories/GHSA-w74x-v6f9-j3xg)                                                 |

Vitest and its existing V8 coverage provider are pinned together at 5.0.3 to preserve their required peer-version match. Other existing version ranges are unchanged; the lockfile refresh selects compatible versions within those ranges.

The official npm metadata requires Node.js >=22.19.0 for patched Undici and ^22.22.2 (or supported newer major branches) for the existing jsdom 30.1.x range. The frontend minimum is therefore raised to >=22.22.2, with Node.js 22.22.2 selected by `.nvmrc`. A portable official Node distribution was downloaded and its archive SHA-256 verified against the publisher before local validation; no system installation was changed. This strengthens the environment requirement instead of ignoring dependency engine checks. `scripts/check-engine.js` reads the minimum from `package.json`; automated tests reject older 22.x versions as well as older major releases. Use `nvm use` before install and validation. The backend minimum is independent and was not changed.

## Other remaining finding

One **moderate** development-tool advisory remains: [minimatch globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249), through ESLint 10.11.0 using minimatch 10.2.6. The advisory identifies minimatch >=11.0.1 as patched. Forcing that major version into ESLint's dependency graph is outside this compatible refresh and has not been attempted. The frontend/maintainer team must track an upstream ESLint release or a separately reviewed migration; this document is not an acceptance or suppression of the vulnerability.

Run `pnpm audit --audit-level high` for the configured severity gate, and review the full audit for this remaining moderate finding. A passing high-severity gate does not mean the full dependency graph is vulnerability-free.

## Verification

Reinstall from the committed lockfile using the selected Node version, frozen lockfile and strict engine checks. Run engine tests, hook tests, frontend coverage, type checking, production build, lint, format checks and secret scanning. Dependency install used `--ignore-scripts` to avoid executing third-party lifecycle scripts; the first-party engine guard and tests run explicitly. The environment guard itself does not replace package-manager engine verification.

Validated with the verified official Node.js 22.22.2 runtime: frozen installation with strict engines, engine guard, TypeScript checks, production build, ESLint, format checks, 194 frontend tests, 12 hook tests, 8 engine tests and 5 sensitive-path tests passed. V8 coverage: statements 99.47%, branches 96.87%, functions 100%, lines 99.69%. Full-history Gitleaks and CI secret scanning passed. Quality checks passed in CI; the current complete dependency audit is blocked by the high picomatch finding and also reports the moderate ESLint/minimatch advisory. The production-only audit passed without weakening the full-audit gate.
