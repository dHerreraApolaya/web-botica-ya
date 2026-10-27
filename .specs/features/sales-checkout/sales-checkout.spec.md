# Sales Checkout Prototype

## Status and Branch

Approved by the developer on 2026-10-26 and implemented on `feature/ventas`, created from local `main` at `8ec17b6`. The managed checkout isolates the uncommitted user-access work on `feature/user`; that module is not part of this branch.

## Objective

Complete the interactive design prototype from product search and adding items to the cart through prescription handling, fulfillment, simulated payment, review, and order confirmation. Keep all business data local and all external services mocked.

## User Journey

1. Search or browse the existing catalog and add available products to the cart.
2. Review the cart, change quantities, remove items, and inspect prescription requirements.
3. If any item requires a prescription, complete the mock prescription step.
4. Choose home delivery with an entered location or pickup from a mock pharmacy.
5. Enter minimal contact details and select a demonstration payment method.
6. Review products, quantities, prescription status, fulfillment, contact details, and the full price breakdown; return to edit earlier steps.
7. Confirm the simulated payment and display an order confirmation or a recoverable payment error.

## Catalog and Cart

- Reuse the existing 500 local products, search, categories, and featured cards.
- Add explicit mock `requiresPrescription` and available-quantity metadata. These flags are prototype fixtures, not clinical or regulatory classifications.
- Product cards show prescription requirements and an accessible add-to-cart action. Unavailable items cannot be added.
- Keep the cart in memory using Zustand; show its item count in the header and provide a cart route.
- Combine repeated additions of the same SKU into one line. Enforce integer quantities from one to the mock stock limit, including repeated add attempts.
- Support increment, decrement, line removal, and returning to the catalog. An empty cart offers a clear path to browse products and cannot enter checkout.
- Calculate prices in integer cents and display PEN. Keep subtotal, delivery cost, and total consistent in every step.

## Prescription Prototype

- Only include the prescription step when required by the current cart.
- Identify the items that require a prescription and explain that review is simulated.
- Offer an explicit synthetic sample prescription for manual testing and an optional local JPG, PNG, or PDF file selection with a five-megabyte limit.
- Never upload, persist, parse, or preview real medical documents. Keep only temporary file metadata needed by the mock flow; the interface requests synthetic documents.
- Exercise pending, approved, rejected, and service-error outcomes through an injected mock adapter. A file selection alone does not count as approval.
- Block progression until mock approval. Allow replacement and retry after rejection or failure.
- Invalidate mock approval when prescription-required items or their quantities change. Removing every prescription-required item skips the step and discards obsolete prescription state.

## Fulfillment and Contact

- Provide two explicit choices: home delivery and pharmacy pickup.
- For delivery, collect a mock district, street address, and optional reference. Display a static location illustration or address summary; do not request geolocation or call map services.
- Restrict delivery to fixture-defined districts. Show an actionable validation message for incomplete or unsupported addresses.
- For pickup, select one pharmacy from a static JSON fixture containing fictional names, addresses, schedules, and availability. No pharmacy is selected implicitly.
- Use a fixture-defined delivery fee and free pickup. Changing fulfillment updates the summary and total immediately.
- Required contact fields: full name, email, and phone. Keep them in memory only.
- Support guest checkout; the independent user-access branch is not a prerequisite.

## Payment, Review, and Confirmation

- Provide a mocked payment gateway with labeled synthetic payment options. Never collect real card numbers, CVV, payment credentials, or initiate real charges.
- Select the payment option before the review step. Submit to the mock gateway only after the visitor confirms the complete order summary.
- Use deterministic fixture scenarios for approval, decline, pending processing, and service errors. Inject scenarios in tests without adding developer controls to the customer flow.
- Prevent duplicate submissions and disable edits while the mock payment is processing. A failed or declined attempt preserves the cart and supports retry.
- An approved attempt creates a mock order identifier and a complete immutable order snapshot before clearing the cart.
- Confirmation displays the mock order identifier, products, totals, fulfillment, and payment status. Clearly state that the order is a demonstration.
- A direct route visit or back navigation cannot bypass required steps or submit an incomplete order. After success, revisiting checkout cannot resubmit the confirmed cart.

## Architecture and Design

- Organize domain contracts, JSON fixtures, adapters, application facade, state behavior, utilities, components, and screens under `src/features/sales/`.
- Use Adapter for prescription and payment simulations, Facade for checkout operations, and State for allowed flow transitions. Use Strategy for differing delivery and pickup validation or pricing only where it removes real conditional duplication.
- Keep backend and external payment integration out of this repository. Document frontend ports separately from any future HTTP endpoint agreement.
- Reuse installed React Router, Zustand, React Hook Form, and Zod. No additional dependencies are planned.
- Keep money calculations, quantity rules, validation, and step eligibility in pure utilities. Keep asynchronous mock timing and outcomes inside injected adapters.
- Follow semantic design tokens, existing visual language, English code and specifications, Spanish UI, strict TypeScript, and feature-first naming conventions.
- Preserve the landing page and catalog. Do not import code or uncommitted files from `feature/user`.

## Verification Plan

- Define unit and interaction tests before implementation, with at least 80% statements, branches, functions, and lines for new code.
- Test mixed carts, stock limits, duplicate additions, quantity changes, empty carts, prescription invalidation and every mock review outcome.
- Test both fulfillment strategies, delivery-fee changes, unsupported locations, incomplete contact fields, and editing previous steps.
- Test payment success, decline, service errors, pending states, repeated clicks, retries, immutable confirmation, and clearing the cart only after success.
- Exercise the existing 500-product catalog and multi-line carts using deterministic data. Treat this as functional volume testing, not a claim about backend capacity.
- Isolate mock adapters and stores between tests and use fake timers for delayed scenarios.
- Verify keyboard operation, semantic labels, associated errors, live feedback, focus management between steps, and touch targets of at least 44px.
- Inspect desktop, tablet, and mobile layouts without horizontal overflow.
- Batch implementation edits, then run the consolidated coverage, production build, TypeScript, lint, and formatting checks.

## Implementation Plan

1. Define the sales domain, fixtures, checkout transitions, and acceptance tests.
2. Add mock stock and prescription metadata to products and connect cart actions and header count.
3. Implement the cart and conditional prescription flow.
4. Implement delivery, pickup, contact details, and payment selection.
5. Implement the review, mock payment submission, error recovery, and confirmation views.
6. Verify the complete flow and document mock scenarios and frontend integration contracts.

## Out of Scope

Backend implementation, real medical validation, real prescription storage, maps or geolocation integrations, real payments, stock reservations, authentication integration, promotions, invoicing, production delivery promises, and deployment.

## Frontend Ports

- `PrescriptionAdapter.review(document)` accepts synthetic file metadata (`name`, `type`, `size`) and resolves to `approved`, `rejected`, or `error`. The prototype never reads file contents. A future upload and medical review integration requires its own backend contract and workflow.
- `PaymentAdapter.pay(order)` accepts an immutable order draft with items, quantities, contact, fulfillment, payment method, prescription status, and integer-cent pricing. It resolves to approval plus a mock order ID, decline, or error.
- `createCheckoutFacade(store, adapters)` coordinates these ports, guards eligibility, locks concurrent payment requests, ignores obsolete prescription reviews, and creates the confirmed snapshot before clearing the cart.
- `checkout.state.ts` defines step-completion behavior and route eligibility. Fulfillment drafts may be incomplete during editing; runtime schemas prevent progression until valid.
- These are frontend requirements, not agreed HTTP URLs, production DTOs, financial guarantees, inventory reservations, or authorization policies. Backend implementation remains in a separate repository.

## Manual Prototype Guide

1. Run `pnpm dev --host 127.0.0.1 --port 5174` in this checkout and open the catalog.
2. Search for `BY-0001` for a product without a prescription or `BY-0007` for a prescription-required fixture. Both are also initially featured.
3. Add products and open the header cart. Increase, decrease, or remove items, then continue the purchase.
4. For a prescription-required cart, select **Usar receta de ejemplo**. Default review is approved after a short mock delay. Alternatively, select a synthetic PDF, JPG, or PNG up to 5 MB.
5. Choose a mock district and fictional address for delivery, or select an available demo pharmacy for free pickup. The fee updates when switching fulfillment modes.
6. Enter a fictional name, an `example.test` email, and a sample phone number, then choose a synthetic card or wallet.
7. Review the complete order and confirm the demonstration purchase. Confirmation retains the order snapshot and the header cart count returns to zero.
8. Reloading discards all in-memory data. No real prescription, charge, order, or delivery is created.

## Deterministic Failure Scenarios

`createMockCheckoutAdapters` accepts `delayMs`, `prescription` (`approved`, `rejected`, `error`), and `payment` (`approved`, `declined`, `error`). Tests inject fresh adapters and stores; delayed cases use fake timers. The application composition is in `application/checkout.config.ts`. Customer screens do not expose developer scenario controls.

## Completed Verification

- All 48 tests pass, including the existing product suites, catalog-to-checkout interaction, both fulfillment modes, file validation, review retries, stale-review protection, payment failure recovery, processing locks, route guards, and immutable confirmation.
- V8 coverage: statements 99.72%, branches 97.76%, functions 100%, and lines 100%. Pure checkout utilities are fully covered. The existing 80% quality gate passes.
- Production build, TypeScript, ESLint, Prettier, and Git whitespace checks pass. No dependencies were added.
- Browser checks cover a mixed cart, synthetic prescription approval, delivery address entry, free pickup, contact and payment selection, review, and approved confirmation. The console reports no warnings or errors.
- No horizontal overflow was observed in cart and checkout at 375px, or in review at 768px and 1280px. Confirmation also fits a 375px viewport. Step headings receive focus when progressing.
- Functional volume testing adds every available product from the 500-record catalog to an isolated cart; this does not measure backend throughput.
