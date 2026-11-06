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

Each feature specification must describe its monitoring goal and owner, semantic constants,
log severity, trace boundaries, permitted fields, volume limits, retention and privacy tests,
or justify why instrumentation is unnecessary. Apply [docs/OBSERVABILITY.md](../docs/OBSERVABILITY.md).
Distinguish technical failures, expected validation outcomes, UX and funnel events. Document
what is actually implemented separately from proposed signals and disabled integrations.
