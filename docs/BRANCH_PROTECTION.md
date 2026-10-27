# Main Branch Protection

`main` receives changes through pull requests. Work on a feature or maintenance branch, publish that branch, open a PR targeting `main`, wait for the required CI check and another eligible reviewer's approval, and resolve review conversations before merging.

## GitHub Rules

The policy below was saved and verified through the GitHub API on 2026-10-27 after the owner's GitHub Mobile identity confirmation. Both rulesets are active and report no bypass actors; the authenticated administrator's bypass permission is `never`.

| Ruleset                                                                   | Responsibility                                                                                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [main-1](https://github.com/dHerreraApolaya/web-botica-ya/rules/25965839) | Block deletion and non-fast-forward pushes without bypass actors.                                                                                 |
| [main-2](https://github.com/dHerreraApolaya/web-botica-ya/rules/25965840) | Require a PR, one approval, dismissal of stale approvals, resolved review conversations, and the required GitHub Actions check; no bypass actors. |

The required check is `Typecheck, Lint & Format Check`, bound to the verified GitHub Actions integration (15368), with an up-to-date branch required. Keep this job name stable in `.github/workflows/ci.yml`. The existing disabled ruleset `main` is not used.

The intended `main-2` configuration is versioned in `.github/rulesets/main-2.json`. GitHub does not automatically apply this file: an authorized administrator must save the matching repository ruleset and verify it through the GitHub API. The existing additional-approval setting for unattributed Copilot PRs is preserved.

The PR author cannot supply their own required approval. A repository administrator cannot bypass the active rules during a push or merge, but can still edit repository settings.

## Local Hooks

Run `pnpm install` with development dependencies to install Husky through the existing `prepare` script. For an existing checkout, `pnpm prepare` refreshes the generated wrappers.

`.husky/pre-push` invokes `scripts/prevent-main-push.sh`. The guard checks every remote destination supplied by Git, rather than checking the current local branch. It blocks all pushes targeting `refs/heads/main`, including refspecs, deletions, and mixed pushes.

Local hooks can be skipped or changed, so they are not a security boundary. The server rules apply to every contributor's checkout and remain the authoritative protection. See [Git hook inputs](https://git-scm.com/docs/githooks#_pre_push) and [Husky hook behavior](https://typicode.github.io/husky/how-to.html).

## Verification and Recovery

- Run `pnpm test:hooks` for offline guard and Husky installation tests. The tests create only a disposable local repository and do not push any refs.
- Both `pnpm test` and `pnpm test:coverage` include hook tests. CI additionally verifies the production build.
- A rejected push to `main` should be published to its own branch and submitted as a PR.
- If the required check is missing, verify the workflow triggers, job name, Actions integration, and the PR's current head. Fix workflow configuration through a PR.
- If repository administration recovery is necessary, use the repository Settings UI and review the rule change explicitly. Do not disable protection as a routine merge workflow.

## Rollout

GitHub rules take effect when saved. Local hooks, documentation, and the extra build gate become shared project behavior after the maintenance branch is reviewed and merged; each checkout must have Husky installed. Preparing the files locally does not mean they are already present on remote `main`.
