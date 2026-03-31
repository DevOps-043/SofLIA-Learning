# API Architecture Decision

## Decision: Next.js-Only Business Logic

All business logic (authentication, users, courses, AI chat, study planner, communities, etc.)
lives exclusively in **Next.js API routes** at `apps/web/src/app/api/`.

This Express server (`apps/api/`) handles only **infrastructure concerns**:

| Endpoint | Purpose |
|---|---|
| `GET /health` | Health check for load balancers and container orchestration |
| `GET /api/v1/version` | Build and environment information |
| `GET /api/v1/metrics` | Runtime metrics: uptime, memory usage |

## Why This Approach?

1. **Supabase integration**: Next.js server components and API routes have native cookie/session
   access via `createServerClient()`, which simplifies authentication significantly.

2. **Colocation**: API handlers live next to the pages and components that use them, making
   the codebase easier to navigate and modify.

3. **Deployment simplicity**: The Next.js app on Netlify/Vercel handles everything — no
   separate Express deploy needed for business logic.

4. **Existing pattern**: 494 API routes already exist in `apps/web/src/app/api/`, all
   fully implemented and tested in production.

## When to Add Logic Here

Only add to this Express server if the logic:
- Cannot run in a Next.js serverless function (e.g., long-running background jobs)
- Requires persistent WebSocket connections
- Needs direct file system access

## Middleware Available

The following middleware is implemented and ready to use if Express routes are needed:

- `middlewares/auth.ts` — JWT authentication (`authenticate`, `authorize`, `optionalAuth`)
- `middlewares/hierarchicalAuth.ts` — Role-based hierarchy validation
- `middlewares/errorHandler.ts` — Centralized error handling
- `middleware/secure-cors.ts` — CORS with origin whitelist
