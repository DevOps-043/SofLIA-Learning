# Rate limits por endpoint

Estado: base operativa agregada en middleware/proxy con Redis REST opcional y tests de carga sintetica.

## Store

- Primario: Redis compartido via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` o `REDIS_REST_URL` + `REDIS_REST_TOKEN`.
- Fallback: memoria local por instancia cuando Redis no esta configurado o falla.
- Headers 429: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Las llaves guardadas en Redis usan hash estable del identificador para evitar almacenar tokens o cookies crudas.

## Politicas activas

| Tipo de endpoint | Match actual | RPM por usuario/IP | Burst | Window | Store |
|---|---|---:|---:|---:|---|
| Auth login/register | `/api/auth/login`, `/api/auth/register` | 5 | 3 | 60 s | Redis/fallback local |
| Auth password | `/api/auth/reset-password`, `/api/auth/forgot-password` | 5 | 3 | 60 s | Redis/fallback local |
| Mutaciones admin | `/api/admin/**` no-GET | 30 | 10 | 60 s | Redis/fallback local |
| Reads cacheable | GET `/api/**` | 300 | 50 | 60 s | Redis/fallback local |
| AI chat | `/api/ai-chat`, `/api/lia`, rutas dashboard chat | 20 | 5 | 60 s | Redis/fallback local |
| Upload | rutas con `/upload` | 10 | 2 | 60 s | Redis/fallback local |
| Bulk import | rutas con `/import` | 2 | 1 | 60 s | Redis/fallback local |
| Public landing | `/`, `/business`, `/downloads` | 600 | 100 | 60 s | Redis/fallback local |
| API fallback | resto `/api/**` | 100 | 0 | 60 s | Redis/fallback local |

## Validacion esperada

1. Unit/local: `npm.cmd run test --workspace=apps/web -- src/core/lib/rate-limit/__tests__/rate-limit.test.ts`.
2. Configurar Redis REST en staging.
3. Ejecutar k6 `tests/load/mixed.js` contra staging.
4. Verificar que los 429 incluyan `Retry-After` y `X-RateLimit-*`.
5. Confirmar que multiples instancias comparten conteo usando la misma llave Redis.

## Riesgos conocidos

- Mientras Redis no este configurado, el fallback local protege una instancia, pero no coordina multiples instancias.
- La semantica `burst` se aplica como capacidad adicional dentro de la ventana fija; no es token bucket continuo.
