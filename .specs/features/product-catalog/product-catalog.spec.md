# Local Product Catalog

## Status

Approved by the developer on 2026-10-26. Implemented on `codex/local-product-catalog`.

## Objective

Connect the existing landing search and add a featured products section using exactly 500 fictional local products. Preserve the current visual language, Spanish UI, semantic design tokens, and desktop-first responsive layout.

## Functional Requirements

- Generate a deterministic catalog of exactly 500 products with unique IDs and SKUs, meaningful Spanish names, categories, fictional brands, presentations, positive prices in PEN, availability, and an explicit featured flag.
- Reuse the six existing landing categories. Keep the catalog and its prices fictional. Preserve the developer change hiding the demonstration notice in the landing screen.
- Display eight available featured products on the landing page, using the same product card as search results.
- Submit the existing search form using its button or Enter. Match all query terms against name, brand, category, presentation, and SKU, ignoring case, accents, and extra whitespace.
- Connect the existing category buttons to category filtering. Do not infer medical diagnoses or treatment recommendations from symptoms.
- Show search results with their total count and twelve products per page. Reset pagination when submitting a query or selecting a category.
- Treat an empty or whitespace-only submitted query as browsing the full catalog. Provide a clear action to restore the initial featured view.
- Provide an accessible empty-results message and a way to clear the search.
- Display price, presentation, category, brand, and availability in each product card. No purchase action is required for this scope.

## Architecture

- Add a `src/features/products/` module with domain types and a narrow read-only repository contract.
- Keep deterministic fixtures and the local repository implementation in the data layer. Do not introduce network requests, artificial latency, persistence, or additional dependencies.
- Keep normalization, filtering, and pagination in pure feature utilities, separate from React and data generation.
- Compose a reusable product card, featured section, and results section. Keep orchestration at the landing screen and pass search callbacks to the existing hero.
- Use the simplest local React state appropriate for this screen. No server state or cross-screen state is introduced by this task.
- Follow the existing file naming conventions, English code, strict TypeScript, and Spanish UI.

## Non-Functional Requirements

- Keep keyboard access, visible input labels, live result announcements, semantic headings, and touch controls of at least 44px.
- Render only the current results page, not all 500 cards. Avoid unnecessary effects and premature memoization.
- Adapt to desktop, tablet, and mobile without horizontal overflow.
- Use existing design tokens and local presentation assets; do not require remote image services.
- Add meaningful unit and component tests with at least 80% coverage for new code and full coverage of pure utilities.
- Run one consolidated final verification after all implementation edits: tests, TypeScript build, lint, and formatting checks. Report any tooling limitations accurately.

## Implementation Plan

1. Define the product domain contract and acceptance tests for fixtures, search, featured selection, and pagination.
2. Implement the local catalog and repository with deterministic data and pure query utilities.
3. Implement product cards, featured products, and accessible paginated search results; connect the existing hero and category controls.
4. Add interaction tests for search submission, categories, pagination, empty states, and resetting to featured products.
5. Run consolidated verification and inspect responsive rendering.

## Out of Scope

Backend integration, authentication, cart behavior, checkout, product detail routes, medical recommendations, dependency upgrades, and deployment.

## Verification

- Sixteen unit and component tests cover deterministic fixtures, normalized matching, category filters, pagination boundaries, empty results, resetting the view, and product card content.
- V8 coverage includes the products module and both connected landing components. The configured quality gate requires at least 80% statements, branches, functions, and lines; measured coverage is 100% across all four metrics.
- Production build, ESLint, and Prettier checks pass.
- Browser checks confirm keyboard submission and no horizontal overflow at 375px, 768px, and 1280px. Product grids use one, two, and four columns respectively.
- CI runs `pnpm test:coverage`. The developer approved adding the matching `@vitest/coverage-v8` development dependency.
- Run `pnpm dev` for local development, `pnpm test` for tests, or `pnpm test:coverage` for the coverage gate.

- During final verification, the developer committed the implementation and hid the demonstration notice. The initial-view test now verifies the visible featured section without requiring that notice.
