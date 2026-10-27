# User Access Mock UI

## Status

Approved by the developer on 2026-10-26 and implemented on branch `feature/user`. The backend will live in a separate repository.

## Objective

Build responsive login and registration layouts with interactive validation and deterministic static JSON mocks. This is a frontend demonstration, without real authentication or a backend.

## Functional Requirements

- Add a user entry point in the existing header and routes `/iniciar-sesion` and `/registro`, using the installed React Router. Preserve the landing page and product catalog.
- Provide navigation between login, registration, and the landing page.
- Login fields: email and password, with an accessible password visibility control.
- Registration fields: full name, email, password, and password confirmation.
- Validate required fields, email format, password length of at least eight characters, and matching confirmation. Trim names and normalize email whitespace and casing; do not trim passwords.
- Show field errors, pending submissions, success feedback, and recoverable mock errors in Spanish. Prevent duplicate submissions while pending.
- Simulate login with an existing active mock user. Unknown users and blocked accounts return controlled failure outcomes.
- A validated password is a form demonstration input only; no password verification, authentication tokens, or security boundary is claimed. Clearly identify the flow as a simulation.
- Simulate registration success for an unused email and a duplicate-email error for an existing email. New registrations are held only in the current in-memory mock session so they can be used by the login demonstration until reload.
- Display a minimal signed-in presentation in the header with a sign-out action after mock success. Sign-out clears the in-memory simulated session.
- No password, token, or submitted personal information is persisted in browser storage or written into fixture files.

## Static Mock Data and Test Scenarios

- Commit an actual static JSON fixture with 1,000 fictional users, unique IDs and emails under `example.test`, names including accents and long values, and active or blocked statuses.
- Keep passwords and tokens out of user fixtures. Provide documented example mock account emails for manual testing.
- Validate fixture shape with Zod and construct an email lookup index once rather than scanning all users on every submission.
- Keep deterministic success, unknown-account, blocked-account, duplicate-email, delayed-response, and service-error scenarios isolated in the mock adapter and test fixtures.
- Inject the adapter through a narrow interface so tests can select outcomes without adding test-scenario controls to the customer interface.
- Use configurable mock delay and fake timers for pending-state tests; avoid random responses, real requests, and timing-dependent assertions.
- Test all 1,000 records for uniqueness and shape and exercise lookup across the full dataset. These are functional volume checks, not a production load-test claim.

## Architecture

- Organize the module under `src/features/user/` with domain contracts, data fixtures and adapter, validation, hooks or state, components, and screens.
- Use Adapter for the mock boundary, Facade for validated use cases, and State behavior objects for the idle, submitting, success, and error transitions.
- Keep UI independent of mock data details through an authentication-demo interface; replace the adapter in future backend work without rewriting forms.
- Use installed React Hook Form and Zod for form handling and validation, without adding dependencies. Integrate Zod explicitly if a resolver is not installed.
- Use Zustand for the minimal shared in-memory user session consumed by the header. Never include password fields in shared state.
- Keep pure normalization and validation utilities separate from effects, timing, and UI state.
- Reuse shared form fields and password controls as appropriate, without building a general-purpose form framework.
- Use the existing semantic tokens, English code and specifications, Spanish interface, and project naming conventions.

## Verification

- Define BDD scenarios and meaningful unit and interaction tests before implementation.
- Cover validation, fixture shape and volume, adapter outcomes, pending states, duplicate-submit prevention, registration-to-login, sign-out, navigation, and long names.
- Reset mock data, timers, and session state between tests; avoid test order dependencies.
- Include new production code in coverage reporting with at least 80% on every metric, following existing project thresholds.
- Verify keyboard navigation, accessible labels and error associations, password visibility, and live feedback.
- Inspect desktop, tablet, and mobile rendering without horizontal overflow and with touch targets of at least 44px.
- Run a consolidated final test, coverage, build, typecheck, lint, and formatting pass. Preserve existing catalog tests.

## Implementation Plan

1. Define domain contracts, JSON fixtures, validation rules, and acceptance tests.
2. Implement the injectable mock adapter and isolated in-memory session.
3. Build reusable form controls and the login and registration screens.
4. Connect routes, header entry, mock success, and sign-out.
5. Run the consolidated verification and browser checks; document how to exercise mock scenarios.

## Out of Scope

Real authentication, authorization, backend integration, protected business routes, password recovery, social login, email verification, legal-policy documents, and deployment.

## Frontend Boundary Contract

The backend repository is independent. These TypeScript ports define frontend needs; they are not an agreed HTTP endpoint specification.

- Login input: `email`, `password`.
- Registration adapter input: `fullName`, `email`, `password`. Password confirmation belongs to frontend validation and is not passed to the adapter.
- Successful result: `{ ok: true, user: { id, fullName, email } }`.
- Failure result: `{ ok: false, code }`, with `invalid-input`, `invalid-credentials`, `account-blocked`, `email-exists`, or `unavailable`.
- A future HTTP adapter must map actual backend DTOs, transport errors, and session policy to this port. The mock does not define production credential verification, authorization, or token handling.

## Manual Mock Scenarios

- Active: `usuario0001@example.test`.
- Blocked: `usuario0010@example.test`.
- Long accented name: `usuario0006@example.test`.
- Unknown: any unused address under `example.test`.
- Duplicate registration: an existing fixture email, including different casing and surrounding whitespace.
- New registration: an unused email; the account lasts until reload and can then be used by the login simulation.
- Enter any fictional password of 8–128 characters. The simulation validates only the form; it never verifies or stores the password.
- Tests inject fresh adapters with `delayMs` and `unavailable` options to exercise pending and service failures. No scenario selector is added to the product interface.
- Run `pnpm test:coverage`, `pnpm build`, `pnpm lint`, and `pnpm format:check`. Use `pnpm dev` to inspect the screens.

## Implemented Verification

- All 56 tests pass, preserving the existing product tests and adding user validation, routing, mock adapter, State behavior, lifecycle, form, and session checks. V8 coverage reports 100% statements, branches, functions, and lines for the configured production files. Production build, TypeScript, ESLint, and formatting checks pass.
- Volume checks run 1,000 concurrent mock lookups against all fixture records without wall-clock timing assertions. A concurrent duplicate-registration check accepts exactly one request.
- Browser checks cover registration-to-login, long accented names in the header, and sign-out from the successful login screen. At 375px, the forms and signed-in header have no horizontal overflow. Login and registration also pass overflow checks at 768px; the desktop view passes at 1280px.
- The JSON dataset, Zod validation, and form dependencies load with the user route through React.lazy; the landing page does not import the mock dataset eagerly.
