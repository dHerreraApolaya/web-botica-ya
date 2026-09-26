# Technical Architecture Guidelines

## Architectural Pattern

- **Feature-First Architecture**: Code is organized around business domains.
- **Atomic Design**: Component architecture structured by Atoms, Molecules, Organisms, Templates, and Screens.
- **Clean Architecture Principles**: Separation between UI Layer, Domain/Business Logic, and Data Layer.

## Software Engineering Principles

- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- **KISS**: Keep It Simple, Stupid. Avoid premature abstractions.
- **DRY**: Don't Repeat Yourself.
- **Patterns**: Repository Pattern, Strategy Pattern, Observer Pattern (State management), Atomic Design Pattern.

## Shared & Helper Layer Rules

- **Shared (`src/shared/` or `src/components/ui/`)**: Reusable logic and UI elements shared across multiple features. Do not put domain-specific business logic here.
- **Helpers / Utilities (`*.util.ts` or `*.helper.ts`)**: Must contain strictly **pure functions** (side-effect free, deterministic, no React hooks/state).
  - Scope: Place feature-specific helpers in `src/features/<feature-name>/utils/`.
  - Scope: Place global helpers in `src/utils/`.

## Naming Conventions

- **Directories (Folders)**: `kebab-case` (e.g., `user-profile`, `components/ui/atoms`).
- **Components & Screens**: `PascalCase.tsx` / `PascalCase.screen.tsx` (e.g., `Button.tsx`, `Home.screen.tsx`).
- **Hooks**: `camelCase.hook.ts` starting with `use` (e.g., `useAuth.hook.ts`).
- **Services**: `camelCase.service.ts` (e.g., `apiClient.service.ts`).
- **Configs**: `camelCase.config.ts` (e.g., `api.config.ts`).
- **Utilities / Helpers**: `camelCase.util.ts` or `camelCase.helper.ts` (e.g., `formatCurrency.util.ts`, `validateEmail.helper.ts`).
- **Types & Interfaces**: `PascalCase` (e.g., `UserSession`, `AuthResponse`).
- **Constants**: `UPPER_SNAKE_CASE` or `camelCase` depending on scope (e.g., `API_BASE_URL`).
- **Specs & BDD Files**: `kebab-case.spec.md`, `kebab-case.feature`.

## Code Standards

- **Language**: English for code, variable names, folders, files, and types.
- **UI Language**: Spanish strictly for user interface text and labels.
- **No Comments**: Code must be readable and self-documenting without inline code comments.
- **Strict TypeScript**: Explicit typing required. Usage of `any` is prohibited.

## Responsive Design Policy (Desktop-First with Mobile/Tablet Adaptability)

- **Primary Target:** Web Desktop (1280px+). Design and layout prioritize wide-screen usability.
- **Adaptability:** All interfaces MUST adapt gracefully to Tablet (768px - 1024px) and Mobile (<768px) views.
- **Tailwind Strategy:** Use responsive modifiers (`sm:`, `md:`, `lg:`, `xl:`) for fluid layouts. Touch targets MUST be at least 44x44px on mobile screens.
- **No Overflow Rule:** Horizontal scroll (`overflow-x`) is strictly forbidden on any device viewport.
