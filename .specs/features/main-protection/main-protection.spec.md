# Main Branch Protection

## Status

Approved on 2026-10-27. Implementation branch: `codex/protect-main`, based on remote `main` commit `9f6cd5bb520e95a66ace4ec79c164d7f8a890029`. Feature branches under review remain separate.

## Policy

- All changes to `main` must pass through a pull request.
- One eligible reviewer other than the author must approve. New commits invalidate stale approvals.
- Review conversations must be resolved before merge.
- The branch must be up to date and the GitHub Actions check `Typecheck, Lint & Format Check` must succeed.
- No roles, users, or applications may bypass the ruleset. Administrators retain the technical ability to edit repository rules; this policy does not remove repository administration access.
- Force pushes and branch deletion remain blocked by the existing `main-1` ruleset with no bypass actors.

## Local Enforcement

- Keep Husky. The pre-push hook invokes a POSIX shell guard.
- Inspect the destination ref from every stdin update. Block `refs/heads/main`, regardless of the local source, remote name, or update type.
- Block deletion, branch creation, `HEAD:main`, source-feature-to-main refspecs, and multi-ref pushes that include `main`.
- Allow ordinary feature and tag updates. Do not impose a force-push policy on feature branches.
- Local hooks are an early warning and can be bypassed. GitHub remains the authoritative enforcement layer.

## CI

- Preserve the exact existing job name because it is a required status check.
- Run hook tests through both `pnpm test` and `pnpm test:coverage`; CI already invokes the latter.
- Add `pnpm build` to compile the application TypeScript project and create the production bundle.
- No additional dependencies or hook managers are introduced.

## Verification

- Test ref destinations directly through stdin without performing a real push.
- Install Husky in an isolated temporary Git repository and invoke its generated pre-push wrapper. Verify blocking and allowed refs, without a remote repository or network operation.
- Run the applicable tests, coverage gate, production build, lint, formatting, and whitespace checks as a consolidated pass.
- Read back the saved GitHub rulesets and verify enforcement, target, bypass list, review settings, required checks, and force-push/deletion rules.

## Remote Change

Update ruleset `main-2` (25965840) in place. Preserve `main-1` (25965839) and leave obsolete ruleset `main` (25964855) disabled. Do not introduce `Restrict updates`, which would prevent normal PR merges without a bypass exception.

## Local Verification Results

- Twelve offline hook tests pass: eleven destination-ref scenarios and one isolated Husky installation/wrapper test. No real push was attempted.
- All sixteen existing application tests pass. The configured application V8 coverage remains 100% for statements, branches, functions, and lines; shell hook coverage is verified by the separate behavioral scenarios, not included in that V8 percentage.
- Production build, ESLint, source formatting, changed-file formatting, and Git whitespace checks pass.
- Husky wrappers were refreshed with `pnpm prepare`. The maintenance branch has no upstream tracking relationship to `origin/main`.
- The owner completed GitHub Mobile identity confirmation. The remote update was saved and read back through the API on 2026-10-27: `main-2` is active with no bypass actors, one required approval, stale-review dismissal, resolved conversations, and the GitHub Actions check bound to integration 15368 with strict up-to-date enforcement. The authenticated administrator's bypass permission is `never`.
- `main-1` was verified separately as active with no bypass actors and unchanged deletion/non-fast-forward restrictions. The obsolete `main` ruleset remains outside this change.
- The new local files and CI build step are ready for review on `codex/protect-main`; they have not been committed, pushed, or merged into remote `main` by this task.
