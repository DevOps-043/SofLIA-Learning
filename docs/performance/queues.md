# Catálogo De Colas Asíncronas

Estado: fase 4.5, proveedor general elegido: Upstash QStash por REST. El repo ya tiene cola/background processing para transcoding de video y `users.bulk-import` puede encolarse como primer job no-video cuando QStash está configurado.

## Política General

| Regla | Valor |
|---|---|
| Idempotencia | Todo job debe incluir `dedupKey`. |
| Retries | 3 intentos. |
| Backoff | 1 s, 4 s, 16 s. |
| Dead-letter | Registrar payload mínimo, error seguro y alertar por Slack/Email. |
| Límite síncrono | Si un endpoint puede tardar > 2 s, debe responder `202 Accepted` con `jobId`. |
| Logs | Sin PII ni secretos; usar ids y conteos. |

## Provider QStash

| Pieza | Ruta / variable | Uso |
|---|---|---|
| Adapter | `apps/web/src/lib/queue/index.ts` | Publica jobs en `https://qstash.upstash.io/v2/publish/{destination}`. |
| Estado durable | `public.async_jobs` + `apps/web/src/lib/queue/job-store.server.ts` | Guarda estado para polling sin exponer el dashboard del provider. |
| Payload privado | Bucket `job-payloads` + `payload-storage.server.ts` | Guarda CSVs grandes fuera del mensaje QStash. |
| Token | `QSTASH_TOKEN` | Token server-side de QStash. |
| Auth interna | `QUEUE_INTERNAL_SECRET` | Se reenvía al worker con `Upstash-Forward-Authorization`. |
| Base URL | `SOFIA_APP_URL` / `NEXT_PUBLIC_APP_URL` / `NETLIFY_URL` / `URL` / `DEPLOY_URL` | URL pública del deploy que QStash puede llamar. |
| Retries | `Upstash-Retries: 3` | Total: intento inicial + 3 retries. |
| Backoff | `Upstash-Retry-Delay: 1000 * pow(4, retried)` | 1 s, 4 s, 16 s. |
| Dedup lógico | `async_jobs.dedup_key` | Se deriva de job + org + hash del payload y evita duplicar jobs activos. |
| Dedup provider | `Upstash-Deduplication-Id` | Usa `jobId` para idempotencia de publicación sin bloquear reintentos legítimos del mismo CSV cuando el job anterior ya terminó. |
| DLQ | `Upstash-Failure-Callback` -> `/api/internal/jobs/failures` | Registra fallo crónico sanitizado para alerta/triage. |

## Jobs

| Job | Trigger actual | Estado | Siguiente paso |
|---|---|---|---|
| `video.transcode` | `/api/admin/upload/course-videos` y `/api/admin/transcoding/*` | Implementado con `video_transcoding_jobs` + Netlify Background Function. | Agregar DLQ y métricas de retry por intento. |
| `users.bulk-import` | `/api/business/users/import`, `/api/[orgSlug]/business/users/import` | QStash-ready: imports >=50 filas o `async=true` responden `202` si el provider está configurado; worker en `/api/internal/jobs/users/bulk-import`; CSV en bucket privado `job-payloads`; polling en `/api/business/users/import/jobs/{jobId}` y variante org-scoped; UI espera el resultado del job antes de cerrar. | Configurar alertas operativas. |
| `activity.validate-ai` | `/api/courses/[slug]/lessons/[id]/activities/[id]/validate` | Síncrono si aplica IA. | Encolar solo cuando el proveedor IA supere 2 s p95. |
| `lia.chat.long-response` | `/api/lia/chat` | Streaming implementado para respuesta al cliente. | Mantener request online; encolar solo workflows largos post-respuesta. |
| `certificate.generate` | Generación PDF on-demand / cron | Síncrono en varias rutas. | Encolar PDF y devolver status polling. |

## Criterios Antes De Cerrar 4.5

1. Provisionar QStash y `QUEUE_INTERNAL_SECRET` en staging/producción.
2. Provisionar bucket/migración `job-payloads` y tabla `async_jobs` en Supabase.
3. Configurar alertas operativas para dead-letter y fallos de publicación.
4. Medir que endpoints mutadores estándar respondan en < 2 s p95.
