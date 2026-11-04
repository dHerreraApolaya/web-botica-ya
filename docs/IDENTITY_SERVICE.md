# Identity API integration

The identity backend is maintained in its own repository:

https://github.com/herrerachristiandev-coder/boticaya-identity-service

Clone it alongside this frontend and follow its README to configure PostgreSQL,
run migrations and start the API on port 3001.

For local development, run `pnpm dev` in this frontend. Vite proxies `/v1` to
`http://127.0.0.1:3001`. In production, configure the reverse proxy to route `/v1`
to Identity on the same site so refresh cookies retain their security policy.

The PostgreSQL database remains `boticaya_identity`. Extracting the source code
does not migrate or delete database records. Secrets and user data are not
stored in either Git repository.
