# Postgres Connection Pooling

Task 4.1 requires Postgres connection pooling through Supavisor/PgBouncer before the platform can safely target 10,000 concurrent users.

## Required Production Topology

| Connection type | Variable | Target |
|---|---|---|
| App/runtime short queries | `SUPABASE_DB_URL_POOLED` | Supavisor transaction pooler, port `6543`. |
| Migrations and one-off scripts | `SUPABASE_DB_URL_DIRECT` | Direct Postgres, port `5432`. |
| Supabase HTTP API | `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` | Supabase project API URL, not a Postgres URL. |

The Next.js app currently uses Supabase HTTP clients for normal data access. Pooling applies to any direct Postgres clients, migration tooling, SQL scripts, load-test DB snapshots, or future server jobs that use a Postgres connection string.

## Current Code Audit

| Area | Finding | Status |
|---|---|---|
| `apps/web/src/lib/supabase/server.ts` | Server client is request-scoped and explicitly stateless; it does not cache auth cookie context across requests. | OK |
| `apps/web/src/lib/supabase/middleware.ts` | Middleware creates a request-scoped Supabase SSR client for auth refresh only. | OK |
| Browser Supabase client | Uses Supabase HTTP API from the browser; no direct Postgres connections. | OK |
| `tools/load-testing/collect-metrics.ts` | Uses Supabase service role over HTTP and RPC `load_test_connection_snapshot` to capture DB connection pressure. | OK |
| `tools/load-testing/pool-check.ts` | Validates `SUPABASE_DB_URL_POOLED`, `SUPABASE_DB_URL_DIRECT`, URL separation, and latest connection snapshot. | OK |
| Direct Postgres clients | No direct Postgres runtime client found in `apps/web/src`. | OK |

## Supabase Dashboard Checklist

- Enable Supavisor in transaction mode for the staging and production projects.
- Set the application/runtime Postgres URL to the pooler endpoint on port `6543`.
- Keep direct `:5432` access restricted to migrations and controlled operator scripts.
- Verify maximum client connections and database connection limits match the plan tier.
- Confirm load tests at 1,000 req/s do not emit `too many connections`.

## Load-Test Acceptance

Use the existing harness:

```bash
npm run load:check
npm run load:seed
npm run load:700
npm run load:metrics
npm run load:pool-check
npm run load:report
```

In CI, `LOAD_POOL_REQUIRE_SNAPSHOT=true` is used so `npm run load:pool-check`
fails when the post-load DB snapshot is missing.

For 4.1 closure, the report must include:

- No Postgres `too many connections` errors.
- Peak active DB connections below 80% of the configured pool budget.
- p95 read latency at or below 500 ms.
- p95 write latency at or below 800 ms.

## Repository Guard

`npm run load:pool-check` fails when the pooled URL does not look like Supavisor transaction pooling, when direct and pooled URLs are identical, when strict mode is missing a DB connection snapshot, when the snapshot lacks connection metrics, or when the latest metrics snapshot contains a connection exhaustion signal. Dashboard activation must still be performed by an operator, but the repository now has an executable acceptance check for task 4.1.
