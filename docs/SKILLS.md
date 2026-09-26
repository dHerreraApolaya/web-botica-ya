# Tech Stack & Approved Dependencies

## Core Framework

- **Build Tool**: Vite
- **UI Library**: React 18+ (TypeScript)
- **Language**: TypeScript (Strict Mode)

## Routing & Navigation

- **Router**: `react-router-dom` (v6+)

## State Management

- **Global Client State**: `zustand`
- **Server State & Caching**: `@tanstack/react-query`

## Forms & Validation

- **Form Handling**: `react-hook-form`
- **Schema Validation**: `zod`

## Testing (TDD)

- **Test Runner**: `vitest`
- **Component Testing**: `@testing-library/react`
- **DOM Matchers**: `@testing-library/jest-dom`

## Styling

- **CSS Framework**: Tailwind CSS
- **Class Utilities**: `clsx`, `tailwind-merge`

## Constraint Rule for AI Agents

Do NOT install or introduce new state management, routing, or utility libraries without explicit human approval.

## Package Manager Enforcement

- Use **pnpm** exclusively for dependency management.
- Do NOT run `npm install` or `yarn add`. Always use `pnpm add <package>` or `pnpm install`.
