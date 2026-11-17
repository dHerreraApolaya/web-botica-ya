# Catalog API integration

## Approved development demo update

On 2026-11-17 the owner authorized loading the project's 500 fictional products, synthetic PEN prices and fictional stock into Supabase development to demonstrate the actual HTTP integration. This supersedes the earlier real-commercial-values-only restriction for this demonstration. No DIGEMID records or external images are reused. The catalog displays a pre-purchase demo notice; checkout confirmation explicitly states the products, prices and quantities are fictional and no charge/delivery occurs. The server remains read-only for the browser and order reception remains disabled. The notices add no monitoring events or new data collection.

## Scope and approved decisions

The browser reads the Express catalog connected to Supabase. The approved fictional development dataset is loaded on the server. Official Peruvian datasets still require verified reuse permission before import and owner-approved commercial values before publication. Imported official-data drafts must remain hidden. Keep the existing local SVG as the product image; never fetch third-party images or fall back to local fictional products on server errors.

The user approved multiple categories, typo-tolerant search, numbered pages and exact totals. The API owns filtering, typo matching, counting and paging across the complete published catalog. The UI never filters one downloaded page to simulate a complete result set. Checkout and user access remain their existing prototypes; catalog integration does not make payment, prescription review or registration production services.

## Contract

- `GET /api/categories` returns active `{id,name,slug}` entries. Category selection uses IDs, not names or a hardcoded mapping. At most six categories can be selected; they are combined with OR by the backend.
- `GET /api/products/catalog` accepts optional `q` (3–128 characters, up to 12 words), `categoryIds` (CSV UUIDs, max six), `featured`, `inStock`, and `page` (1–1000), `pageSize` (1–50). It returns `{items,page,totalPages,total}`. Search page size is 12; featured requests use eight items, `featured=true` and `inStock=true`.
- Products include stable IDs, SKU, category/brand labels and IDs, presentation, price in integer cents, currency PEN, availability, prescription and featured flags, plus nullable image metadata. The frontend validates response types, bounds, currency and page consistency before rendering. Image metadata does not trigger downloads.
- Empty submitted search browses the complete public catalog. Clearing returns to featured products. Typing waits 300 ms; immediate submit cancels the debounce. Changing filters resets page to one and cancels the obsolete request.
- Debounce is trailing: rapid changes less than 300 ms apart issue only the final query. A pause exceeding 300 ms can issue an intermediate query, so `alc`, `alcho`, `alchol` may legitimately produce three distinct requests. Enter and category changes deliberately commit immediately. Regression tests cover both 200 ms and 350 ms pauses; the screenshot alone does not establish actual timing. Stale requests are aborted and their late responses are not displayed.
- Keep exact server totals and totalPages. A bounded five-button page window avoids creating a button for every page. When the technical page-1000 bound is reached and more results exist, ask the user to refine the search instead of truncating the reported total.
- Loading, unavailable and empty are different states. Failures show a generic Spanish message and explicit retry, without local data substitution. Category failures do not substitute the six fictional categories.

## Architecture and configuration

Use the CatalogRepository port and the HTTP adapter, validated by Zod, with AbortSignal and a ten-second timeout. TanStack Query owns transient server state; Zustand continues to own the cart. No browser persistence of search or results is introduced. External payload text is rendered as text, never HTML.

Default endpoint base is same-origin `/api`. Local Vite forwards `/api` to `http://127.0.0.1:8081`. Start the backend separately with its ignored server configuration; no Supabase database credential belongs in React. For a separate deployment, `VITE_API_BASE_URL` may contain an HTTPS API base ending in `/api`, without credentials, query or fragment. HTTP is limited to local development hosts. Configure an exact permitted origin on the server if deployment uses different origins; no permissive CORS change is included here. Production same-origin routing must forward `/api` to Express.

Local fixtures and the existing local repository remain explicit test inputs only. Production composition imports the HTTP adapter and does not import the 500-product dataset. Automated UI tests supply an isolated QueryClient and fixture repository explicitly.

## Observability and privacy

Purpose: detect a final catalog transport failure or an invalid server response. The HTTP adapter emits only the existing immutable PRODUCT_LOGS.ADAPTER_FAILED event at one boundary; cancellation is not a failure. There are no automatic retries multiplying signals. The default logger is NOOP: no capture, destination or retention. The catalog service owner is responsible for any later monitoring configuration, which must use the central permission checks for consent, DNT and GPC. Search text, selected categories/products, response bodies, URLs, exceptions and credentials are never logged.

Successful search and product selection do not require individual signals and could reveal health interests; they are deliberately unlogged. The repository does not currently provide a Tracer port. A separate privacy-reviewed tracing implementation is pending before any trace export; start/end logs are not simulated traces and no external SDK is enabled by this change.

## Verification

Tests cover typed HTTP mapping, query encoding, cancellation, network/schema failure, empty responses, no fallback, category retry, debounce, exact totals, page changes, and cart/checkout regression using explicit fixtures. Run coverage, type checking, build, lint, formatting and security checks together once the change is complete. Real end-to-end evidence requires permitted data, genuine commercial values, authorized publication, server read credentials and a configured running API; an empty Supabase catalog cannot prove that products display.
