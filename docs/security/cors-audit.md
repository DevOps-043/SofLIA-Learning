# CORS Audit - Web, API, and Netlify

Date: 2026-05-18

## Current Posture

- Express API CORS uses an explicit origin allowlist and denies unknown origins.
- Credentials are allowed only for approved origins.
- Netlify and Next.js security headers do not publish wildcard CORS headers.
- Internal job endpoints require bearer authentication through `QUEUE_INTERNAL_SECRET`.

## Deployment Checks

- Configure production origins through `CORS_ALLOWED_ORIGINS`.
- Keep preview and local origins separate from production.
- Do not add `Access-Control-Allow-Origin = "*"` to Netlify headers for authenticated routes.
- Validate `OPTIONS` behavior after deploy with an allowed origin and a denied origin.

## Evidence

- API tests: `apps/api/src/middleware/__tests__/secure-cors.test.ts`.
- Netlify headers: `netlify.toml`.
- Next.js security headers: `apps/web/next-config/security-headers.js`.
