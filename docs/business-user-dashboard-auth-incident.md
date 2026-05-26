# Business User Dashboard Auth Incident

## Context

On the organization-scoped employee dashboard (`/[orgSlug]/business-user/dashboard`), the client calls:

- `GET /api/[orgSlug]/organization`
- `GET /api/[orgSlug]/business-user/dashboard`

The dashboard API was returning `401/403`-class auth failures for valid employees, preventing the dashboard from rendering and showing the generic "Error al cargar datos" state.

## Root Cause

The route handler uses `requireBusinessUser({ organizationSlug })`, but the shared user profile validation only accepted `Business` and `Administrador` profile roles. Other parts of the auth boundary, including the proxy API guard and route redirects, already recognize `Business User` as the valid employee role.

This created a contract mismatch:

- Proxy/API route policy: `Business User`, `Business`, `Administrador`
- Dashboard route handler policy: `Business`, `Administrador`

As a result, a legitimate organization employee with `cargo_rol = Business User` could pass navigation/proxy checks but fail inside the dashboard route handler.

## Fix

Role validation is now mode-aware:

- `business-admin` allows `Business` and `Administrador`
- `business-user` allows `Business User`, `Business`, and `Administrador`

This keeps administrative business APIs restricted while allowing employee dashboard APIs to serve employee users.

## Validation

Run:

```bash
npm run test --workspace=apps/web -- src/lib/auth/__tests__/business-auth.user.service.test.ts
```

Manual QA:

1. Sign in as a user with `cargo_rol = Business User` and active `organization_users.status = active`.
2. Open `/{orgSlug}/business-user/dashboard`.
3. Confirm `GET /api/{orgSlug}/business-user/dashboard` returns `200`.
4. Confirm assigned courses and learning paths render.
5. Sign in as a plain `Usuario` without business membership and confirm the dashboard remains forbidden.
