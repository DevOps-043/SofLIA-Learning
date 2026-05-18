# Streaming Y Reducción De Payload

Estado: fase 4.6, guardas base e instrumentación runtime implementadas. Falta medición p95 de tamaño de respuesta y Web Vitals en entorno real.

## Implementado

| Control | Ruta | Resultado |
|---|---|---|
| Streaming LIA | `apps/web/src/app/api/lia/chat/route.ts` | Usa `ReadableStream` para entregar chunks SSE. |
| Límite de request JSON | `apps/web/src/lib/api/request-size.ts`, `apps/web/middleware.ts` | Rechaza `POST/PUT/PATCH` estándar > 1 MB con `413 PAYLOAD_TOO_LARGE`. |
| Excepciones de upload/import | `apps/web/src/lib/api/request-size.ts` | No bloquea rutas de upload, SCORM ni importaciones CSV. |
| Métrica de request rechazado | `apps/web/src/lib/api/request-size.ts` | Incrementa `http_request_body_rejected_total` para payloads >1 MB. |
| Métrica de response size | `apps/web/src/lib/api/response-size.ts`, `apps/web/src/lib/observability/api.ts` | Agrega `X-Response-Size-Bytes` y `http_response_size_bytes` en rutas envueltas con `withApiObservability` cuando no son streaming. |
| Paginación compartida | `apps/web/src/lib/api/pagination.ts` | Máximo centralizado de 100 items por página/rango. |
| Campos selectivos | Varias rutas de analytics, planner y usuarios | Se mantiene patrón de selección explícita; auditoría completa pertenece a tarea 2.1. |

## Pendiente

1. Confirmar `Content-Encoding: br` o `gzip` en Netlify para HTML/JS/JSON estándar.
2. Medir p95 response size por endpoint con `http_response_size_bytes` / `X-Response-Size-Bytes` y registrar baseline en `docs/performance/load-test-results.md`.
3. Reemplazar `<img>` por `next/image` en pantallas de usuario final de alto tráfico.
4. Definir allowlist de rutas que pueden superar 1 MB por diseño.
5. Medir LCP en páginas críticas y objetivo < 2.5 s.
