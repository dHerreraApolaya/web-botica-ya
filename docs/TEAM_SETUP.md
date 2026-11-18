# Shared development setup

Use the `develop` branches of the frontend and the two backend repositories:

- [Identity](https://github.com/herrerachristiandev-coder/boticaya-identity-service)
- [Orders](https://github.com/herrerachristiandev-coder/boticaya-orders-service)

The backend Supabase setup guides are included in their review branches and PRs:
[Identity PR 3](https://github.com/herrerachristiandev-coder/boticaya-identity-service/pull/3)
and [Orders PR 2](https://github.com/herrerachristiandev-coder/boticaya-orders-service/pull/2).
Use those branches while the PRs await approval.

## Connect the backends

Configure each backend's private `.env` using its Supabase guide. Use its
own application login, Session pooler, `sslmode=verify-full` and a local
trusted CA certificate path. Application credentials are provisioned by the
project administrator and distributed through a private channel.

The shared project's database is named `postgres`. Identity uses `public`
and Orders uses `orders`. The initial structure and permissions have already
been applied. Do not rerun the initial SQL or provisioning helpers as part
of onboarding. Reconcile the legacy migration ledger before running the
new Identity migration runner against the shared database.

From the Identity repository:

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm start:prod
```

From the Orders repository:

```powershell
pnpm install --frozen-lockfile
pnpm start
```

## Start the web

From this repository:

```powershell
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5173
```

Configure Identity's `CORS_ORIGIN` and Orders' `WEB_ORIGIN` as
`http://127.0.0.1:5173`. Vite routes `/v1/orders` to port 3002 and
the remaining `/v1` routes to Identity on port 3001.

## Current behavior

- Registration and login use the Identity API. Accounts are stored in Supabase
  when the backend is configured for that project.
- Refresh sessions use an HTTP-only cookie. Access tokens remain in memory.
- In development, cart changes use the Orders API and can be restored in the
  same browser. The current cart adapter maps local fixture SKUs to UUIDs.
- Cart synchronization is currently enabled only by Vite development mode.
  Production hosting needs explicit API routing and a reviewed persistence
  configuration.
- The checkout screen still uses demonstration adapters. Completing that
  screen does not create a real order or charge a card.
- Catalog and Inventory integration remains separate work. Do not treat fixture
  availability or the pending Orders API as a confirmed stock reservation.

## Review

Use a fictional account and a unique email under `example.invalid` when
testing registration. It creates a persistent account in the shared development
database. Cart actions also persist in that database. Coordinate shared test
data with the team.
