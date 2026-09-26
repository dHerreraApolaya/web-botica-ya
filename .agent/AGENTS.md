# AI Governance & Master Context

Strict index for any AI Agent operating in this repository.

## Core Rules

1. **Never Assume**: If a requirement is ambiguous, incomplete, or missing technical specs, stop execution and consult the developer.
2. **Agile & Scoped Execution**: Do not write unrequested features or over-engineer solutions. Stick strictly to the approved task scope.
3. **No Inline Comments**: Write self-documenting code in English with descriptive naming.
4. **UI Localization**: Code, variables, and specs in English. User interface text strictly in Spanish.

## Architectural Principles

- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- **KISS**: Keep It Simple, Stupid. Avoid premature abstractions.
- **DRY**: Don't Repeat Yourself.
- **Patterns**: Feature-First, Clean Architecture principles, Strategy, Observer, Repository Pattern.

## Directory & File Specs

- `.specs/`: Feature contracts and specifications.
- `docs/`: Technical guidelines and design tokens.
- `src/`: Source code.

## Package Manager Enforcement

- Use **pnpm** exclusively for dependency management.
- Do NOT run `npm install` or `yarn add`. Always use `pnpm add <package>` or `pnpm install`.

## Environment & Engine Enforcement

- Strictly required: Node.js >= 22.12.0 and pnpm >= 9.0.0.
- If `pnpm install` fails due to an engine mismatch, DO NOT modify `package.json` or source code.
- Warn the user to update their local Node environment using `.nvmrc`.

## Security & AppSec Rules (Mandatory)

- Read [`docs/SECURITY.md`](../docs/SECURITY.md) before writing network or state handling logic.
- **Zero Secrets Policy**: Never generate hardcoded keys or credentials.
- **OWASP Compliance**: Avoid XSS vulnerabilities (`dangerouslySetInnerHTML` is prohibited).
- **Coverage Requirement**: Ensure new code includes unit tests meeting the **80% minimum coverage** rule.
- **Scanner Preparedness**: Write code compatible with Fortify, SonarQube, and Xray scanners.
