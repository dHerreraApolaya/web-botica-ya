# Botica Ya API — Node.js + Express

Node.js >=22.12.0, pnpm >=9 and PostgreSQL. Express serves the catalog using the
existing route, SQL projection, JSON shape, database defaults and port. The backend
runs entirely on Node.js; Maven and Java are no longer required.

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

On Windows PowerShell, use `pnpm.cmd` if execution policy blocks `pnpm.ps1`.
Save the local `.env` before starting the server. Each developer supplies their own
credentials; the file is ignored by Git. A catalog-only account needs `CONNECT`
on `boticaya_dev`, `USAGE` on `public` and `SELECT` on `public.products`.

Express binds to `127.0.0.1:8081` by default. Set `PORT=8082` to use the port from
the operator verification below. Startup checks PostgreSQL; no table creation, seeding or stock reset happens
when the server starts. `dev` builds once and watches the compiled server; rebuild
TypeScript after editing source.

## Catalog verification

On 2026-11-14, the developer ran Node.js + Express on their Windows machine,
connected to their existing `localhost:5432/boticaya_dev` using the dedicated
`boticaya_catalog_app` account. Their browser screenshot of
`http://127.0.0.1:8082/api/products` showed the bare JSON array with
`sku: "BY-0001"`, `availableQuantity: 5` and all eleven expected fields. This is
operator-provided evidence from the original database, separate from the isolated
automated tests. The Java backend files were removed after this verification.

To repeat the read-only contract check against the running Express instance:

```sh
pnpm verify:catalog
```

The command requires a bare array, the original eleven fields and types, and
exactly one `BY-0001` with five units. It only reads the API. For port 8082 in
Windows PowerShell, run in a second terminal inside `api-botica-ya`:

```powershell
$env:BOTICAYA_API_URL = 'http://127.0.0.1:8082'
pnpm.cmd verify:catalog
```

Keep `sql/catalogo-prueba.sql` for isolated tests. Never reset the developer's
stock to manufacture verification evidence. A future order reservation can
legitimately reduce the quantity below five.

## Inventory and order reception

For the chosen local development path, follow [LOCAL-ORDERS.md](./LOCAL-ORDERS.md)
to provision a restricted order account and verify one reservation plus retries.

`GET /api/inventory` reads current availability. After catalog verification, prepare
the order tables explicitly:

```sh
pnpm migrate
```

The migration is transactional and repeatable and does not reset product data.
It refuses to run if `orders.orders` already exists. The Supabase migration now
present on `develop` defines a separate order service with UUID product IDs and
a different lifecycle. This candidate uses the original catalog's text IDs;
reconcile those contracts before connecting order reception to that service.
Set `BOTICAYA_ORDERS_ENABLED=true` and restart to expose `POST /api/orders`.
The catalog-only account cannot receive orders or run migrations. Use a separately
provisioned account with the necessary permissions for order development, while
keeping order reception disabled until its schema and access are configured.
Example request:

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
