# Express backend migration

## Scope

The requested replacement for the initial Spring Boot catalog is Node.js + Express
with PostgreSQL. This backend is colocated in `api-botica-ya` as explicitly requested;
the previous frontend-only specifications continue to describe the mock UI.

## Catalog compatibility and cutover gate

- `GET /api/products` returns HTTP 200 and a bare JSON array ordered by `id`.
- Preserve the existing SQL aliases, numeric cents, numeric available quantities,
  boolean flags and all eleven product fields. Do not add an envelope or pagination.
- Default to PostgreSQL `localhost:5432/boticaya_dev` and server port 8081.
  Continue accepting `BOTICAYA_DB_USER` and `BOTICAYA_DB_PASSWORD`; keep credentials
  exclusively in the backend environment. Allow an explicit remote host, port and
  database override, with certificate-verified TLS when requested.
- Database failure must return a generic JSON 503. Never silently serve fixture data.
- Before removing Java, verify `BY-0001` has `availableQuantity: 5` through Express
  against the developer's existing `boticaya_dev`. Use `verify:catalog`; when Spring
  is still available on a separate port, compare the complete JSON with
  `BOTICAYA_SPRING_URL`.
- A disposable PostgreSQL test database seeded from `catalogo-prueba.sql` proves
  behavior but does not prove access to the developer's existing database. Retain
  Java and keep the migration in draft until that distinction is resolved.

## Initial inventory and order API

- `GET /api/inventory` returns product ID, SKU, available quantity and derived
  in-stock flag in ID order. Inventory reads do not change stock.
- Prepare `POST /api/orders` behind `BOTICAYA_ORDERS_ENABLED=false` by default.
  Enable only after catalog cutover, order schema migration and operational review.
- Accept validated contact, pickup/delivery details and 1–100 unique product lines,
  with positive integer quantities limited to 1000 per line. Reject unknown fields.
- Require a UUID `Idempotency-Key`. Repeating the same canonical request returns the
  original response with HTTP 200; the first success returns HTTP 201. Changed
  content with the same key returns HTTP 409 without another reservation.
- Calculate prices from locked database rows. Never accept client totals or claims
  of payment or prescription approval. Return only a subtotal in integer cents;
  delivery fees, payments and fulfillment are not implemented in this stage.
- Persist each order as `pending` and reserve quantities by reducing
  `products.available_quantity` in the same transaction. Keep line price snapshots.
- Lock product rows in consistent ID order. Insufficient stock and unknown products
  return HTTP 409. A failed order must leave no rows or stock changes behind.
- Prescription products remain pending for manual review; no automatic medical
  approval occurs. Reservations persist until a future explicit fulfillment or
  cancellation workflow; this stage does not implement automatic expiry or release.
- Keep the frontend demo unchanged. Authentication, staff inventory adjustments,
  payments, file uploads, order listing and lifecycle transitions need separate
  contracts. Bind to loopback by default; this stage is a development API.

## Verification

Unit and real-PostgreSQL integration tests enforce the catalog contract, empty
catalog, ordering, stock availability, input boundaries, concurrent orders,
idempotency, prescription review flags and transaction rollback. Integration tests
must use an explicitly provided disposable database ending in `_test`; they refuse
`boticaya_dev`. Enforce at least 80% statements, branches, functions and lines for
backend business code. CI runs backend checks separately from frontend checks.
