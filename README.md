# 🚀 Web Botica Ya - Frontend Master Index

Frontend web application for **Botica Ya**, built with a strict **Anti-Vibe Coding** discipline (Spec-Driven Development, Test-Driven Development, Behavior-Driven Development) and optimized for seamless collaboration between human engineers and autonomous AI agents.

---

## 📑 Documentation Map & Index

This repository uses a structured documentation architecture. All contributors and AI agents **must consult these documents before proposing or executing code changes**:

| Document                         | Path                                                                             | Description & Purpose                                                                                                                              |
| :------------------------------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Master Governance**         | [`.agent/AGENTS.md`](./.agent/AGENTS.md)                                         | Mandatory governance rules, constraints, package manager rules, engine requirements, and commit conventions.                                       |
| **Agile Execution Workflow**     | [`.agent/WORKFLOW.md`](./.agent/WORKFLOW.md)                                     | Step-by-step task execution protocol: Spec inspection, approval gates, and the SDD → BDD → TDD loop.                                               |
| **Technical Architecture**       | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)                                 | Feature-First architecture, Clean Architecture, Atomic Design, SOLID/DRY/KISS principles, naming conventions, and desktop-first responsive policy. |
| **Design System Guidelines**     | [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md)                               | Atomic design structure (Atoms, Molecules, Organisms, Templates, Screens), design tokens, and UI localization.                                     |
| **Security & AppSec**            | [`docs/SECURITY.md`](./docs/SECURITY.md)                                         | Zero secrets policy, Zod environment/payload validation, OWASP mitigations, SAST scanner rules, and 80% test coverage minimum.                     |
| **Tech Stack & Skills**          | [`docs/SKILLS.md`](./docs/SKILLS.md)                                             | Approved framework libraries, state management, router, styling utilities, and dependency whitelist.                                               |
| **React & Perf Standards**       | [`rules/react-best-practices/AGENTS.md`](./rules/react-best-practices/AGENTS.md) | Vercel React Best Practices rulebook (40+ performance, bundle size, re-render, and hooks optimization rules for agents).                           |
| **Feature Specifications (SDD)** | [`.specs/README.md`](./.specs/README.md)                                         | Single source of truth for business logic, acceptance criteria, and BDD scenario definitions (`.specs/features/`).                                 |

---

## 🛠️ Technology Stack

| Layer                  | Technology                                                        | Specification / Notes                                                  |
| :--------------------- | :---------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Runtime & Engine**   | Node.js `>=22.12.0`                                               | Controlled via [`.nvmrc`](./.nvmrc)                                    |
| **Package Manager**    | `pnpm` `>=9.0.0` (v9.15.4)                                        | Strictly enforced; `npm`/`yarn` are blocked                            |
| **Core Framework**     | React 19 + TypeScript (Strict)                                    | Bundled with Vite                                                      |
| **Client State**       | Zustand (`zustand`)                                               | Lightweight centralized store for global UI state                      |
| **Server State**       | TanStack Query v5 (`@tanstack/react-query`)                       | Asynchronous data fetching, caching, and synchronization               |
| **Routing**            | React Router v7 (`react-router-dom`)                              | Declarative client-side routing                                        |
| **Forms & Validation** | React Hook Form + Zod                                             | Type-safe form validation and runtime schema parsing                   |
| **Styling**            | Tailwind CSS + `clsx` + `tailwind-merge`                          | Desktop-First responsive styling with utility tokens                   |
| **Testing**            | Vitest + React Testing Library + jsdom                            | Unit and component testing (80% minimum coverage target)               |
| **Quality Gates**      | ESLint v10 (Flat Config) + Oxlint + Prettier + Husky + Commitlint | Automated linting, formatting, pre-commit hooks, and commit validation |

---

## 🏛️ Architectural Principles

1. **Feature-First Organization:** Source code is modularized around business capabilities under `src/features/<feature-name>/`.
2. **Atomic Design Hierarchy:**
   - **Atoms (`src/components/ui/atoms/`):** Base UI components (buttons, inputs, typography, icons).
   - **Molecules (`src/components/ui/molecules/`):** Composed atoms (form fields, search bars).
   - **Organisms (`src/components/ui/organisms/` | `src/features/<feature>/components/`):** Complex UI blocks (headers, navigation, cards).
   - **Templates (`src/layouts/`):** Page layout skeletons without hardcoded domain data.
   - **Screens (`src/features/<feature>/screens/`):** Fully connected views with real domain state.
3. **Spec-Driven & Test-Driven Development (SDD / TDD / BDD):**
   - Every feature starts with specification contracts in `.specs/features/<feature>/<feature>.spec.md` and `.feature` files.
   - Unit and integration tests must accompany business logic before implementation is considered complete.
4. **Desktop-First Adaptive Design:**
   - Primary breakpoint is Desktop (1280px+).
   - Fluid adaptation for Tablet (768px - 1024px) and Mobile (<768px). Horizontal scrolling (`overflow-x`) is prohibited.

---

## 📁 Repository Directory Structure

```text
web-botica-ya/
├── .agent/                    # AI Agent governance and task protocols
│   ├── AGENTS.md              # Master rules and execution index
│   └── WORKFLOW.md            # Agile execution steps and boundaries
├── .github/                   # CI/CD Workflows
│   └── workflows/ci.yml       # Automated quality gate (Typecheck, Lint, Format)
├── .husky/                    # Git hooks (pre-commit, commit-msg)
├── .specs/                    # Spec-Driven Development contracts
│   ├── README.md              # SDD guidelines
│   └── features/              # Feature specs and BDD scenarios
├── docs/                      # Engineering and design documentation
│   ├── ARCHITECTURE.md        # System architecture & naming standards
│   ├── DESIGN_SYSTEM.md       # Design system & Atomic Design tokens
│   ├── SECURITY.md            # AppSec & coverage quality requirements
│   └── SKILLS.md              # Approved library stack whitelist
├── public/                    # Static assets
├── rules/                     # Engineering and performance rulebooks
│   └── react-best-practices/  # React performance & optimization standards
├── scripts/                   # Tooling and engine verification scripts
├── src/                       # Application source code
│   ├── assets/                # Images, SVGs, and brand assets
│   ├── components/            # Global atomic UI components
│   │   └── ui/                # Atoms, Molecules, Organisms
│   ├── config/                # Environment and app configuration
│   ├── features/              # Feature modules (Domain-driven)
│   ├── layouts/               # Page templates and layout wrappers
│   ├── utils/                 # Global pure utility functions
│   ├── App.tsx                # Root application component
│   ├── main.tsx               # Entry point mounting React DOM
│   └── index.css              # Global styles and Tailwind directives
├── .nvmrc                     # Pinned Node.js version
├── commitlint.config.js       # Conventional commit validation rules
├── eslint.config.js           # ESLint v10 flat configuration
├── package.json               # Dependencies and build scripts
├── pnpm-lock.yaml             # Pinned dependency lockfile
├── tsconfig.json              # TypeScript root configuration
└── vite.config.ts             # Vite build and plugin configuration
```

---

## 🚦 Strict Rules of Engagement (Agents & Contributors)

1. **Never Assume:** Consult the developer whenever requirements, specifications, or edge cases are unclear.
2. **Strict Language Separation:**
   - **Code, Variables, Types, Comments, and Specifications:** Strictly in **English**.
   - **User Interface (UI) Text, Labels, and Messages:** Strictly in **Spanish**.
3. **No Inline Comments:** Write self-documenting code with clear naming instead of redundant inline commentary.
4. **Strict TypeScript:** Explicit types are mandatory. `any` is forbidden.
5. **Pure Utilities:** Functions in `*.util.ts` or `*.helper.ts` must be deterministic, pure, and free of side effects/React state.
6. **Zero Secrets & Validated Environments:** Validate all environment variables through Zod schemas in `src/config/env.config.ts`.
7. **Conventional Commits:** All commit messages must follow the standard format:
   - `<type>(<scope>): <subject>` (e.g., `feat(auth): implement login form with zod schema`)
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

---

## ⚡ Quickstart & Development

### Prerequisites

- **Node.js:** `>=22.12.0` (Switch using `nvm use` or `nvm use 22`)
- **pnpm:** `>=9.0.0` (v9.15.4 recommended)

### Installation & Setup

```bash
# 1. Install dependencies using pnpm
pnpm install

# 2. Configure environment variables (copy example template when available)
cp .env.example .env

# 3. Start local development server
pnpm dev
```

### Available Scripts

| Command             | Action                                                         |
| :------------------ | :------------------------------------------------------------- |
| `pnpm dev`          | Starts local Vite development server with HMR                  |
| `pnpm build`        | Compiles TypeScript declarations and creates production bundle |
| `pnpm preview`      | Serves local production build preview                          |
| `pnpm typecheck`    | Executes TypeScript type checking (`tsc --noEmit`)             |
| `pnpm lint`         | Runs ESLint analysis across codebase (`--max-warnings 0`)      |
| `pnpm format`       | Auto-formats source code using Prettier                        |
| `pnpm format:check` | Verifies formatting compliance in CI                           |

---

## 🛡️ CI/CD Quality Gates

Every Pull Request and push to `main` or `develop` triggers the automated CI Quality Gate in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):

1. **Node.js Engine Verification:** Confirms Node version compatibility.
2. **TypeScript Compilation Check:** Ensures zero type errors (`pnpm typecheck`).
3. **Static Analysis & Linting:** Validates code against ESLint rules (`pnpm lint`).
4. **Code Formatting Validation:** Checks Prettier styling (`pnpm format:check`).
5. **Security & Coverage Threshold:** Requires passing test suites with an **80% minimum code coverage** gate.
