# Personal demonstration integration

pre-develop is the current integration and publication branch while the team joins. main/develop protections remain unchanged. Vercel Production tracks pre-develop; git.deploymentEnabled remains false so publishing is an explicit validated action, not every push.

The published web uses a same-origin /api rewrite to https://boticaya-catalog-service.vercel.app/api before the SPA fallback. There are no database credentials in VITE variables or the browser bundle. The backend uses its dedicated Supabase development reader, TLS verification and forced RLS. Categories, bounded pagination/count and typo search are live; orders and identity remain prototypes. The catalog contains 500 owned fictional products, reference demo prices and demo stock; generic product images are retained. No real purchase is made.

Validate quality, coverage, secret scanning and the complete/runtime dependency policy before publishing. See [the authorized temporary exception](DEMO_SECURITY_EXCEPTION.md); expiry is enforced by future audit runs, not automatic removal of an existing deployment. No paid services or plan upgrades are authorized. The owner confirmed personal/educational non-commercial use for Hobby.

After publishing, verify actual public /api/catalog responses through the web origin, product cards, search and category pagination. Do not accept an HTML 200 from the SPA as API success. Check JSON shape and product IDs. API configuration/migrations/credentials remain in the backend repository. No database reload or checkout schema change is needed.
