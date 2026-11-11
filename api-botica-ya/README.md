# Botica Ya API — Express candidate

Node.js >=22.12.0, pnpm >=9 and PostgreSQL. The Express catalog keeps the Spring
route, SQL projection, JSON shape, database defaults and port. Java is retained
until the existing developer database has been verified through Express.

## Start the catalog

```sh
cd api-botica-ya
pnpm install --frozen-lockfile
cp .env.example .env
```

Set `BOTICAYA_DB_USER` and `BOTICAYA_DB_PASSWORD` in the ignored `.env` or secret
environment. Defaults are `localhost:5432/boticaya_dev`. Override the host when the
database is on another machine; this environment's localhost is not your laptop.
Set `BOTICAYA_DB_SSL=true` if the server requires TLS with a trusted certificate.
No `VITE_` variable may contain database credentials.

```sh
pnpm build
pnpm start
```

Express binds to `127.0.0.1:8081` by default. Use another `PORT` while Spring occupies 8081. Startup checks PostgreSQL; no table creation, seeding or stock reset happens
when the server starts. `dev` builds once and watches the compiled server; rebuild
TypeScript after editing source.

## Verify the cutover before removing Java

Against the existing `boticaya_dev`, with order reception still disabled:

```sh
pnpm verify:catalog
```

The command requires a bare array, the original eleven fields and types, and
exactly one `BY-0001` with five units. It only reads the API. To compare both full
responses while Spring remains on 8081 and Express runs on 8082:

```sh
BOTICAYA_API_URL=http://127.0.0.1:8082 BOTICAYA_SPRING_URL=http://127.0.0.1:8081 pnpm verify:catalog
```

Only after that succeeds against the original database, remove `pom.xml`, Maven
wrappers, `.mvn`, `src/main`, `src/test` and Java-specific ignore/attribute files.
Keep `sql/catalogo-prueba.sql` for isolated tests, but do not run it to manufacture
cutover evidence in the existing database. Record which instance was verified
without publishing credentials, then mark the migration PR ready for review.
Do not merge automatically.

## Inventory and order reception

`GET /api/inventory` reads current availability. After catalog verification, prepare
the order tables explicitly:

```sh
pnpm migrate
```

The migration is transactional and repeatable and does not reset product data.
Set `BOTICAYA_ORDERS_ENABLED=true` and restart to expose `POST /api/orders`.
Keep it disabled until the cutover gate is satisfied. Example request:

```http
POST /api/orders
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "contact": {
    "fullName": "Cliente de prueba",
    "email": "cliente@example.org",
    "phone": "999888777"
  },
  "fulfillment": { "type": "pickup", "pharmacyId": "botica-1" },
  "items": [{ "productId": "product-0001", "quantity": 2 }]
}
```

For delivery use `type: "delivery"`, `district`, `address` and optional `reference`.
First receipt returns 201 with `id`, `status: "pending"`, `subtotalInCents`,
`requiresPrescriptionReview` and product/price snapshots in `items`. A retry using
the same UUID and payload returns the same response with 200. Reordering item lines
does not create a new request. Reusing the key with changed details, requesting an
unknown product or exceeding stock returns 409; invalid data returns 400.

Receiving an order reserves stock atomically. The catalog immediately reflects the
remaining quantity. Orders stay pending, with no charge, dispatch or prescription
approval. Reservation expiry, cancellation/release, staff authentication and stock
adjustments are future contracts. This API binds to loopback for development;
the frontend still uses its existing demo adapters.

## Tests

```sh
pnpm typecheck
pnpm test
pnpm build
```

Integration and coverage tests require a disposable PostgreSQL database whose name
ends in `_test`, with its URL supplied through `BOTICAYA_TEST_DATABASE_URL`. Tests
truncate only this explicitly selected database's catalog/order tables. They reject
`boticaya_dev`. CI supplies a local PostgreSQL 18 service for these checks.

```sh
pnpm test:integration
pnpm test:coverage
```

The backend gate enforces 80% statements, branches, functions and lines. Server and
migration entry points are exercised by build/start and migration smoke checks.
An isolated test database seeded from `catalogo-prueba.sql` proves implementation
behavior; it does not establish access to the original `boticaya_dev`.
