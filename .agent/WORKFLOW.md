# Agile Execution Protocol

## Task Protocol

1. **Read Specs**: Inspect `.specs/` and `docs/`.
2. **Consult First**: If scope or design constraints are unclear, present options to the developer before proceeding.
3. **Draft Plan**: Create a task breakdown.
4. **Wait for Approval**: Obtain human confirmation.
5. **Execution Loop**: SDD -> BDD -> TDD -> Clean Code -> Batch all modifications -> Single consolidated validation run at the end (`pnpm typecheck && pnpm lint && pnpm format`).

## Boundaries

- Do not create unrequested files.
- Do not add third-party dependencies without explicit developer consent.
- Do not execute incremental lint/typecheck runs per individual file edit.
