# Design Guidelines & Constraints

## UI/UX Rules

- **Language**: All user-facing text must be strictly in Spanish.
- **Design Tokens**: Colors, typography, spacing, and grid definitions must be centralized in the framework configuration.
- **Accessibility**: Support screen readers, proper touch targets, and contrast compliance.

## Atomic Design Methodology

All UI components must be organized following Atomic Design principles:

1. **Atoms**: Basic UI building blocks (e.g., `Button.tsx`, `Input.tsx`, `Text.tsx`, `Icon.tsx`). Located in `src/components/ui/atoms/`.
2. **Molecules**: Combinations of atoms acting as a unit (e.g., `SearchField.tsx`, `FormField.tsx`). Located in `src/components/ui/molecules/`.
3. **Organisms**: Complex UI components composed of molecules and/or atoms (e.g., `Header.tsx`, `LoginForm.tsx`). Located in `src/components/ui/organisms/` or `src/features/<feature-name>/components/`.
4. **Templates**: Page-level layouts defining structure without domain data. Located in `src/layouts/`.
5. **Pages / Screens**: Specific instances of templates filled with real domain data and state. Located in `src/features/<feature-name>/screens/`.

## Component Location Rules

- Generic/Global Atomic Components (Atoms, Molecules, global Organisms): `src/components/ui/`
- Domain-Specific Components/Organisms: `src/features/<feature-name>/components/`
