# Backend repository separation

Catalog backend: https://github.com/dHerreraApolaya/boticaya-catalog-service

The Java API, Maven configuration, SQL development seed, and backend tests now belong to that repository. This frontend continues to use its existing local product repository; no HTTP integration is introduced by this change.

Original API source commit: `6a8c2558eda8ecd3528e4d23a44fd2bf69ad206c`. The backend extraction retains original authorship and source attribution, replacing fixed datasource credentials before constructing its independent history. Existing frontend Git history is unchanged. Rotate any original credentials that were real or reused.

Review and merge the backend import before merging the frontend removal. Backend database environment variables stay on the server; only the public API base URL belongs in `VITE_API_BASE_URL` when HTTP integration is implemented. Supabase schema and data are unchanged by this separation.

Validation: standalone backend packaging succeeded with tests skipped; integration tests require an isolated PostgreSQL environment. Frontend typecheck, lint, formatting, 159 application tests, 12 hook tests, coverage, and production build passed. No frontend source code or dependencies changed.
