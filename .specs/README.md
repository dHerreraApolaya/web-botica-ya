# Spec-Driven Development (SDD) Guidelines

This directory contains the single source of truth for all business logic, requirements, and acceptance criteria of the application.

## Directory Structure

```text
.specs/
├── README.md                  <-- Guidelines and usage (this file)
└── features/                  <-- Domain specifications
    └── feature-name/
        ├── feature-name.spec.md     <-- Technical & business specs
        └── feature-name.feature     <-- BDD acceptance scenarios
```

## Observability acceptance criteria

Use the [observability policy](../docs/OBSERVABILITY.md#criterios-de-revisión-y-pruebas)
to define feature-specific monitoring acceptance criteria; reference shared rules instead of copying them.
