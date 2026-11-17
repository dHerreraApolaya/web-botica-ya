# Backend separation

The current backend is Express 5 + TypeScript on Node.js 22 with PostgreSQL, not Java. Repository: https://github.com/dHerreraApolaya/boticaya-catalog-service

It owns products, inventory, optional local order reception, SQL, API tests and backend CI. Frontend source, mocks and HTTP integration remain unchanged. No Supabase changes are applied.

Regularization source: web-botica-ya `faaa5e6`. PR #17 removed Java only after Express had been added concurrently; this follow-up removes the remaining Express files and moves its CI to the service. The missing catalog fixture is restored in the service from `6a8c255`. Backend PR #1 must merge before this removal.

The import branch no longer uses Java. Its earlier sanitized Java commits remain in history for traceability. No original credential-bearing blobs were imported. Rotate any real credentials previously committed to the original frontend history.
