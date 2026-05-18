# SSRF Audit - Dynamic Fetches

Date: 2026-05-18

Scope: `apps/web/src`, `netlify/functions`, and shared packages were scanned with `rg "\bfetch\s*\(|fetchWithCircuitBreaker\(|safeFetch\("`.

## Required Control

Any server-side request to a user-supplied absolute URL must use `safeFetch`, which enforces:

- HTTPS-only URLs.
- Host allowlist support.
- DNS resolution checks that reject private and reserved addresses.
- Audit logging through `safe-fetch-blocked` security events.

## Findings

- `apps/web/src/app/api/admin/ai/process-video/route.ts` is the user-controlled external video URL path and uses `safeFetch`.
- OAuth, calendar, OpenAI, Gemini, GitHub releases, Vimeo oEmbed, Nominatim, and GeoJSON requests use fixed provider hosts or host-pinned URLs.
- Netlify scheduled functions call same-origin internal job endpoints derived from deploy environment variables, not request input.
- APM export and ClamAV scanning endpoints are deploy-time environment configuration and are protected with circuit breakers.
- Client-side relative API calls are same-origin and outside SSRF scope.

## Guardrail

New server-side external fetches must document whether the URL is fixed, environment-controlled, or user-controlled. User-controlled absolute URLs must use `safeFetch`; host-pinned provider URLs may use `fetchWithCircuitBreaker`.
