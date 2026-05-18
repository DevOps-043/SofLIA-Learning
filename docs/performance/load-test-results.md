# Load testing baseline

Estado: suite k6, workflow semanal y dashboard markdown generable agregados. Aun falta ejecutar contra staging con secretos reales.

## Escenarios

| Archivo | Objetivo | Duracion default | RPS default | SLO inicial |
|---|---|---:|---:|---|
| `tests/load/auth-login.js` | Login sostenido | 5 min | 500 | p95 < 500 ms, errores < 1% |
| `tests/load/course-view.js` | Vista publica/cacheable de curso | 10 min | 1000 | p95 < 500 ms, errores < 1% |
| `tests/load/lia-chat.js` | Endpoint IA pesado | 5 min | 100 | p95 < 30 s, errores < 2% |
| `tests/load/mixed.js` | Mezcla realista de lectura, auth e IA | 30 min | 1000 | p95 < 500 ms, errores < 1% |

## CI

- Workflow: `.github/workflows/load-tests-weekly.yml`
- Frecuencia: lunes 08:00 UTC.
- Target: staging o deploy preview configurado en `LOAD_BASE_URL`.
- Secretos requeridos: `LOAD_BASE_URL`, `LOAD_TEST_EMAIL`, `LOAD_TEST_PASSWORD`.
- Secretos requeridos para cerrar 4.1 en CI: `LOAD_TEST_SUPABASE_URL`, `LOAD_TEST_SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL_POOLED`, `SUPABASE_DB_URL_DIRECT`.
- Secretos opcionales: `LOAD_COURSE_SLUG`, `LOAD_DB_METRICS_RPC`, `LOAD_DB_CONNECTION_BUDGET`.
- Artefacto: `load-test-results/k6-<scenario>-<run_id>.json`.
- Dashboard: `load-test-results/dashboard.md`, generado por `node scripts/generate-load-test-dashboard.mjs` y publicado en `GITHUB_STEP_SUMMARY`.
- Gate complementario de performance publica: `.github/workflows/public-performance-weekly.yml`.
- Guard de pooling: `npm run load:pool-check` corre con `LOAD_POOL_REQUIRE_SNAPSHOT=true` para fallar si no existe snapshot DB post-carga.

## Dashboard de tendencia

El script `scripts/generate-load-test-dashboard.mjs` agrega todos los `*.json` disponibles en `load-test-results/` y genera tabla con requests, p50, p95, p99, error rate y check rate. En CI, cada corrida sube tanto el JSON de k6 como el dashboard markdown para comparar tendencia entre artefactos semanales.

## Registro de ejecuciones

| Fecha | Ambiente | Escenario | p50 | p95 | p99 | Error rate | Resultado | Artefacto |
|---|---|---|---:|---:|---:|---:|---|---|
| Pendiente | Staging | mixed | n/d | n/d | n/d | n/d | Pendiente de primera corrida | n/d |

## Criterio para bloquear deploy

Bloquear el deploy si cualquiera de estos puntos se cumple en staging:

- p95 de lectura supera 500 ms.
- p95 de escritura supera 800 ms.
- p95 de IA supera 30 s de forma sostenida.
- Error rate 5xx supera 1% por 5 minutos.
- Rate limit 429 aparece en carga nominal con usuarios unicos, salvo escenarios auth deliberadamente agresivos.
