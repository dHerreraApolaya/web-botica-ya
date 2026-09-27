---
trigger: always_on
title: Workflow Efficiency & Batched Validation Protocol
impact: CRITICAL
impactDescription: Drastically minimizes token usage and execution latency by eliminating redundant check cycles
tags: workflow, performance, efficiency, governance
---

# Agent Rule: Workflow Efficiency & Batched Validation Protocol

## 🎯 Objective & Core Rule

To optimize token consumption, execution speed, and tool calling overhead, agents operating in this repository MUST follow the **"Batch & Verify at the End"** protocol.

---

## 🚫 Anti-Pattern: Incremental Validation Per Edit

Running heavy verification commands (`pnpm typecheck`, `pnpm lint`, `pnpm format`) after every single file modification or minor edit is **strictly prohibited**. It creates unnecessary shell processes, wastes context tokens, and degrades developer experience.

### ❌ Incorrect Workflow (Inefficient / Wasteful)

```text
[Task: Implement Feature X]
1. Edit file A.tsx
2. Run `pnpm typecheck`  <-- Prohibited
3. Run `pnpm lint`       <-- Prohibited
4. Edit file B.tsx
5. Run `pnpm typecheck`  <-- Prohibited
6. Run `pnpm lint`       <-- Prohibited
7. Run `pnpm format`     <-- Prohibited
```

---

## ✅ Mandatory Protocol: Batch Modifications First, Validate Once at the End

All code modifications across all relevant files for a task must be authored and applied **first**. Only when all planned file edits are completely written should a single consolidated validation run be executed.

### ✅ Correct Workflow (Efficient / Batched)

```text
[Task: Implement Feature X]
1. Plan changes & identify affected files.
2. Edit file A.tsx
3. Edit file B.tsx
4. Edit file C.tsx
5. Single Final Validation Run:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm format` (or `pnpm format:check` in CI validation)
6. Deliver final summary to user.
```

---

## 📋 Rule Summary & Enforcement

1. **Batch Writes:** Apply all file creations and edits in sequence without interrupting the flow with intermediate typecheck or lint calls.
2. **Consolidated End-of-Task Gate:** Execute verification tools (`typecheck`, `lint`, `format`) exactly **once** at the conclusion of the entire task.
3. **Targeted Remediation:** If the single end-of-task check reveals errors, resolve all reported issues in a single batch before re-verifying once.
