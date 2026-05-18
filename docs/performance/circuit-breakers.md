# Circuit breakers

Estado: wrapper central y adopcion en integraciones externas de servidor.

## Wrapper

- Implementacion: `apps/web/src/lib/resilience/circuit-breaker.ts`
- Timeouts default:
  - DB: 5 s
  - OpenAI/Gemini: 30 s
  - Google Calendar/Microsoft Calendar/OAuth: 10 s
  - Fetch externo general: 10 s
- Retries: solo metodos idempotentes (`GET`, `HEAD`, `OPTIONS`) y errores transitorios (`408`, `429`, `5xx`, timeout o error de red).

## Integraciones cubiertas

| Familia | Providers instrumentados |
|---|---|
| OpenAI | chat, LIA onboarding fallback, AI intent, traduccion, deteccion de idioma, moderation, dialogue tutor/evaluator |
| Gemini | Study Planner chat, LIA chat, process-video |
| Google Calendar/OAuth | read/write/delete, sync sessions, cleanup, dashboard chat, events, token refresh |
| Microsoft Calendar/OAuth | profile, calendar list/events, sync, delete plan events, OAuth |
| Infra externa | Redis/Upstash cache y rate-limit, QStash, Netlify BG function, GitHub releases, YouTube Data API |
| Media/geodata | HLS master playlist, Vimeo oEmbed, Nominatim, GeoJSON fallbacks, external video download |

## Auditoria de `fetch`

`rg "await fetch|return fetch|= fetch" apps/web/src/app/api apps/web/src/features/study-planner/services apps/web/src/core/services apps/web/src/lib` deja solo estos casos aceptados:

- `apps/web/src/lib/resilience/circuit-breaker.ts`: llamada nativa centralizada.
- Fetch internos a `/api/...` desde cliente/servicios de UI.
- `apps/web/src/lib/supabase/request-deduplication.ts`: helper de deduplicacion que recibe URL/opciones del llamador.
- Comentarios de documentacion.

`netlify/functions/process-inbox.ts` llama al propio sitio (`/api/cron/process-inbox`) desde una scheduled function; no es proveedor externo de producto.

## Validacion

- Test de fallo masivo y recuperacion: `apps/web/src/lib/resilience/__tests__/circuit-breaker.test.ts`.
- Metricas emitidas: `external_api_requests_total`, `external_api_duration_seconds`, `circuit_breaker_open_total`, `circuit_breaker_rejected_total`.
