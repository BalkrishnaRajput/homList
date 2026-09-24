# HomeList — Household Shopping List Generator

Next.js 16 App Router, TypeScript, Drizzle ORM, PostgreSQL, and Supabase Auth. Phase 1 multi-user database isolation is preserved; Phase 2 replaces the temporary development identity with a single server-side Supabase authentication boundary.

## Data model (unchanged)

| Data | Tables | Access |
| --- | --- | --- |
| Immutable starter source | `src/lib/catalog-data.ts` (`SEED_CATALOG`) | Application code only |
| Archived pre-isolation catalogue | `categories`, `products` | Declared for migration/recovery only; no runtime API reads or writes |
| Per-user editable catalogue | `user_categories`, `user_products` | Every query includes `user_id = users.id` |
| Per-user selections, quantities, notes, history | `shopping_lists` | Every query includes `user_id = users.id` |
| Identity mapping | `users` | `auth_subject` is unique and maps Supabase Auth to the existing numeric `users.id` |

There is no second authentication or application-user table. The retained `development_key` column is legacy Phase 1 data and is not read or written by application code. All three Drizzle migrations and their journal checksums remain unchanged.

The composite `(category_id, user_id)` foreign key still prevents a product from referencing another user's category. `initializeUserCatalog(userId)` still copies `SEED_CATALOG` exactly once under a row lock for every newly authenticated identity.

## Authentication flow

```text
Google / email magic link / guest
        ↓
Supabase Auth (identity provider)
        ↓
verified Supabase user.id (UUID)
        ↓
users.auth_subject (unique)
        ↓
users.id (existing numeric application ID)
        ↓
user_categories / user_products / shopping_lists
```

`src/lib/auth.ts` is the only identity boundary:

1. It creates a request-scoped `@supabase/ssr` server client.
2. It calls `supabase.auth.getUser()` for cookie sessions, or `supabase.auth.getUser(jwt)` for a verified `Authorization: Bearer` token.
3. It never reads `userId` from JSON, query strings, URL parameters, client state, or development cookies.
4. `mapAuthenticatedUser()` selects or inserts exactly one row by unique `auth_subject`. Concurrent first logins reuse the same numeric ID.
5. It calls `initializeUserCatalog(userId)`.
6. Private Route Handlers use `withAuth(handler)`, which returns HTTP 401 before parsing the body or querying PostgreSQL when authentication is missing or invalid. Configuration/provider failures return HTTP 503.

Supported sign-in UI: email magic link, Google OAuth, and anonymous/guest sign-in. `/auth/callback` safely exchanges the PKCE code or email token and redirects only to same-origin relative paths. `/api/auth/sign-out` clears and revokes the session.

## API security audit

| Route | Classification | Owner resolution |
| --- | --- | --- |
| `GET /api/catalog` | Private | `withAuth` → current `users.id` |
| `GET/POST /api/categories` | Private | `withAuth` → current `users.id` |
| `PATCH/DELETE /api/categories/[id]` | Private | `withAuth` + ID AND owner |
| `GET/POST /api/products` | Private | `withAuth` → current `users.id` |
| `PATCH/DELETE /api/products/[id]` | Private | `withAuth` + ID AND owner |
| `GET/PUT /api/list` | Private | `withAuth`; submitted product IDs validated against the owner's `user_products` |
| `GET/POST /api/lists` | Private | `withAuth`; snapshot owner comes only from the server |
| `GET/PATCH/DELETE /api/lists/[id]` | Private | `withAuth` + ID AND owner; foreign IDs return 404 |
| `GET /api/health` | Public | No user data |
| `POST /api/auth/sign-out` | Public/idempotent | Clears the caller's Supabase cookies |
| `GET /auth/callback` | Public | Exchanges provider-verified code/token |
| `/api/dev/user`, `/api/dev/switch-user` | **Deleted** | No development identity endpoints exist |

There is **no `ADMIN_EMAILS` or admin catalogue feature** in either the specified repository or this workspace. The Settings category/product operations remain private per-user operations; they do not expose or mutate archived/global catalogue data. A future global admin catalogue would require separate tables/routes and must not reuse `user_categories` or `user_products`.

The React shell has no User A/User B selector or development authentication control. The sidebar and Settings show the authenticated account label and Sign out only. Shopping-list, PDF, and existing visual design remain unchanged except for that authentication control.

## Environment configuration

Copy `.env.example` to an uncommitted `.env`.

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_SUPABASE_KEY
# Optional for migration tooling only:
# DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
```

- `NEXT_PUBLIC_SUPABASE_URL` must be the project **base URL**, not `/rest/v1`. The config validator rejects non-HTTPS URLs (except localhost), path suffixes, query strings, and fragments.
- Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or the older `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Only public browser values use `NEXT_PUBLIC_*`.
- `SUPABASE_SERVICE_ROLE_KEY`, database passwords, `DATABASE_URL`, and `DIRECT_URL` are never sent to the browser or returned by an API.
- `drizzle.config.ts` prefers `DIRECT_URL` for migrations when supplied and otherwise uses `DATABASE_URL`. Application runtime always uses `DATABASE_URL`.
- Do not run `drizzle-kit push` against an existing legacy database without reviewing its diff.

No database schema change or new migration is required for Phase 2.

## Tests

```sh
npm install
npm run typecheck
npm run lint
npx tsx scripts/test-multi-user-isolation.ts
npm run build
npm run build_and_start   # platform-managed preview + health check
TEST_BASE_URL=https://YOUR_PREVIEW npx tsx scripts/test-api-isolation.ts
```

`scripts/test-multi-user-isolation.ts` creates temporary identities through `mapAuthenticatedUser()` and cleans up only its own rows. `scripts/test-api-isolation.ts` uses no development cookie: it checks deleted dev endpoints, all unauthenticated 401 responses, forged identity inputs, real Supabase session cookies, cross-user catalogue/list operations, foreign product rejection, sign-out, repeated mapping, and independent catalogues. Authenticated HTTP tests require valid public Supabase configuration and the anonymous sign-in provider; otherwise the script exits with an explicit `BLOCKED` result rather than claiming success.

For an isolated HTTP contract run before real project credentials exist, `scripts/test-only-mock-supabase-auth.mjs` implements only the three GoTrue endpoints used by the suite (anonymous signup, verified user lookup, logout). It is a **test harness, not a Supabase replacement**; run it only against a temporary local server with test-only public values, then shut it down. A passing harness proves the application boundary and ownership behavior but does not verify a real Supabase project, provider settings, redirect allow-list, or database connection strings.

## Known deployment prerequisites/blockers

1. This workspace currently has **no** `NEXT_PUBLIC_SUPABASE_URL` or public Supabase key, so live login and authenticated HTTP E2E tests cannot run until real values are supplied.
2. The local `DATABASE_URL` is `127.0.0.1`, not a verified Supabase database. `DIRECT_URL` is absent. Do not guess a Supabase region/host; supply the actual project connection strings before claiming provider migration.
3. Enable the intended Supabase providers: Email (magic link templates), Google OAuth (correct OAuth credentials and redirect allow-list), and Anonymous sign-ins if guest access/tests are wanted.
4. Add `/auth/callback` to the Supabase redirect URL allow-list for each deployed origin.
5. The three existing rows with `development_key` values have no `auth_subject`; they remain quarantined and cannot be selected by the application. Do not silently attach them to real accounts.
6. Automated authenticated tests create temporary anonymous Supabase users; this workspace cannot delete those provider-side identities without a service-role key, which must remain server-side and out of application code.

## Phase 2 completion checklist

- Development selector and `/api/dev/*` removed from application source.
- `src/lib/auth.ts` resolves only verified Supabase identity.
- All private routes return 401 when unauthenticated.
- Existing numeric ownership constraints and migrations preserved.
- Private catalogue/list isolation tests pass.
- `npm run typecheck`, lint, and production build pass.
- Real Supabase credentials and provider settings remain a deployment prerequisite, not a code-level fallback.
