# Local inventory and order verification

Use the existing local `boticaya_dev` for this development stage. Keep the separate
Supabase order service unchanged. The Express order migration refuses databases
where `orders.orders` exists; do not remove that guard to force installation.

## Prepare the database as its owner

In pgAdmin, select `boticaya_dev` and open Query Tool as the database owner.
Open and execute `sql/001-orders.sql`. This creates order tables without seeding,
resetting products or changing their available quantities. Verify Messages reports
success before continuing.

Create a new Login/Group Role named `boticaya_orders_app`. Set its own password in
Definition, enable Can login, leave other privileges disabled and assign no role
memberships. Execute `sql/local-orders-permissions.sql` as the owner in
`boticaya_dev`. The script grants only schema usage, product reads, availability
updates and order/line reads and inserts. It does not grant database creation,
table deletion, product price changes or deletion of order records. It leaves the
existing `boticaya_catalog_app` account unchanged.

The application account cannot run schema migrations. Keep administrative
credentials in pgAdmin rather than the application environment.

## Start Express on Windows

Stop the existing server with Ctrl+C. In the ignored `api-botica-ya/.env`, use
`BOTICAYA_DB_USER=boticaya_orders_app`, the new role's own password,
`BOTICAYA_DB_NAME=boticaya_dev`, `PORT=8082` and `BOTICAYA_ORDERS_ENABLED=true`.
Keep the local host/port settings used for the catalog. Save and close the file.

From `api-botica-ya`:

```powershell
pnpm.cmd start
```

Read current stock at `http://127.0.0.1:8082/api/inventory`.

## Reserve one unit and verify retry behavior

The following development test creates a real pending test order in your local
database. It uses synthetic contact data, charges nothing and reserves one unit of
BY-0001. If its starting quantity is five, it becomes four. The pending reservation
remains after testing; automatic cancellation/release is not implemented.

In a second terminal inside `api-botica-ya`, run:

```powershell
$env:BOTICAYA_TEST_ORDER_KEY = [guid]::NewGuid().ToString()
pnpm.cmd verify:orders
```

The command reads `PORT` from `.env`, checks inventory, submits the order, retries
with the same key and asserts identical responses and unchanged stock on retry.
It prints the order ID, key and before/after quantities, without credentials.
It refuses a non-loopback API URL. For a running server on a different port, set
`BOTICAYA_API_URL` explicitly.

Repeat only `pnpm.cmd verify:orders` in that same terminal to reuse the key: stock
must stay four. Generating a new key deliberately creates another order and
reserves another unit. Use the printed key if you need to retry after a timeout or
in a new terminal; do not generate another key for the same request.

Confirm persistence with these read-only queries in pgAdmin:

```sql
SELECT sku, available_quantity FROM public.products WHERE sku = 'BY-0001';
SELECT id, status, created_at FROM public.orders ORDER BY created_at DESC;
SELECT order_id, product_id, quantity, unit_price_in_cents FROM public.order_items;
```

This is a loopback development workflow. The frontend still uses its demo
adapters, and no payment or prescription approval is implied by receipt.
