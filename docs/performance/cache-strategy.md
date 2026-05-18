# Estrategia De Cache Redis

Estado: fase 4.2, base de código implementada con fallback local y métricas runtime. Falta provisionar Upstash Redis y medir hit rate real en staging/producción.

## Adapter

| Pieza | Ruta | Propósito |
|---|---|---|
| `CacheAdapter` | `apps/web/src/lib/cache/index.ts` | Contrato async `get/set/del/invalidateByTag`. |
| `UpstashRedisCacheAdapter` | `apps/web/src/lib/cache/index.ts` | Usa REST API de Upstash cuando existen credenciales. |
| `MemoryCacheAdapter` | `apps/web/src/lib/cache/index.ts` | Fallback local para desarrollo/test; no es cache distribuida. |
| `getCacheStats()` | `apps/web/src/lib/cache/index.ts` | Expone `hits`, `misses`, `sets`, `deletes`, `invalidations` y `hitRate`. |
| `/api/performance/metrics` | `apps/web/src/app/api/performance/metrics/route.get.ts` | Publica `distributedCache` y `distributedCacheHitRate`. |

Variables requeridas para producción:

| Variable | Uso |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Endpoint REST TLS de Redis. |
| `UPSTASH_REDIS_REST_TOKEN` | Token server-side. No exponer al cliente. |

## Convención De Keys

| Scope | Formato |
|---|---|
| Tenant | `soflia:tenant:{orgId}:resource:{type}:{scope?}:{id?}` |
| Usuario | `soflia:user:{userId}:resource:{type}:{variant?}` |
| Tag interno | `soflia:tag:{tag}` |

## TTLs

| Recurso | TTL | Invalidación | Estado |
|---|---:|---|---|
| Sesión / role del usuario | 60 s | Logout / cambio de rol | Pendiente migrar desde caches legacy síncronos. |
| Course metadata | 5 min | Update por admin | Pendiente. |
| Lista cursos org | 5 min | Nueva asignación / cambio de catálogo | Pendiente. |
| Analytics insights | 1 h | Manual / cron | Pendiente. |
| Org config planner/holidays | 15 min | Update org admin | Pendiente. |
| Public landing data | 1 h | Deploy | Pendiente. |
| OpenAI/Gemini prompts base | 24 h | Cambio manual de prompt | Pendiente. |
| `my-courses` por usuario | 15 s | TTL corto | Migrado a `CacheAdapter`. |
| Study planner dashboard plan | 15 s | TTL corto | Migrado a `CacheAdapter`. |
| Study planner sessions | 15 s | TTL corto | Migrado a `CacheAdapter`. |

## Métricas

El adapter registra contadores locales por proceso. En fallback `memory`, `entries` muestra el tamaño del Map local. En Upstash Redis, `entries` queda `null` porque contar keys en producción no es seguro en hot paths; el hit rate se calcula con los `GET` observados por la instancia.

1. Consultar `/api/performance/metrics` y leer `distributedCache.hitRate`.
2. Medir hit rate por endpoint de lectura en staging con Upstash configurado.
3. Objetivo de aceptación: hit rate >= 70 % en endpoints cacheables.
4. Validar invalidación E2E al mutar cursos, roles, planner config y analytics insights.
