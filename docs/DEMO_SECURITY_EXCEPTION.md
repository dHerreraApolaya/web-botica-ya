# Temporary demonstration dependency exception

Owner: dHerreraApolaya. Explicitly authorized in the project conversation on 2026-11-17. Scope: pre-develop personal/educational demo only. Expires at the end of 2026-11-24 in America/Lima (2026-11-25T05:00:00Z). Main and develop retain a strict high/critical dependency gate; repository branch protections are unchanged.

Only GHSA-fc5q-39xc-vjpf in picomatch 4.0.7 is accepted, exclusively through direct development dependencies and only when a separate runtime audit confirms it is absent from runtime dependencies. There is no official patch at authorization time. The app accepts no user-supplied glob patterns; builds/tests must use trusted repository inputs. This reduces exposure but does not repair the package or establish zero risk.

The gate prints complete and runtime audit reports and fails closed on registry errors, malformed or incomplete results, any other high/critical finding, critical escalation, unexpected package/version/path, runtime exposure or expiry. No global pnpm ignore list is used. No security check is disabled. The owner must update to an official fix and remove the exception when available; otherwise publication must be suspended at expiry. Expiry blocks future validation/deployments but does not automatically take down an existing Vercel deployment.

Demo controls: fictional product data only, read-only reader credentials, verified TLS, no orders, no identity access, no secrets in the browser or Git, scans and tested bounded API routes. Do not run public Vite/Vitest development servers. Low/moderate findings remain visible for follow-up. No paid service is authorized.

Advisory: https://github.com/advisories/GHSA-fc5q-39xc-vjpf . This exception is an owner risk decision, not a vulnerability remediation or an independent security certification.
