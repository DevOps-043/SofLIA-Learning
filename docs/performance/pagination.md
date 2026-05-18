# Paginación Obligatoria

Estado: fase 4.4, helper común implementado y auditoría estática disponible. Falta reducir el baseline de rutas existentes y activar bloqueo estricto en CI.

## Helper

| Export | Ruta | Uso |
|---|---|---|
| `parsePaginationParams` | `apps/web/src/lib/api/pagination.ts` | Paginación por `page/pageSize`, con máximo 100. |
| `parseOffsetPaginationParams` | `apps/web/src/lib/api/pagination.ts` | Paginación por `offset/limit`, con máximo 100. |
| `buildPaginationMetadata` | `apps/web/src/lib/api/pagination.ts` | Metadata estable para responses. |
| `auditSupabasePaginationSource` | `apps/web/src/lib/api/supabase-pagination-audit.ts` | Detecta `.from(...).select(...)` sin `.range()`/`.limit()` ni lectura singular. |
| `npm run audit:pagination` | `scripts/audit-api-pagination.ts` | Escanea `apps/web/src/app/api/**/route.ts`; con `CI_STRICT_TECH_DEBT=true` retorna exit code 1 si hay violaciones. |

## Rutas Migradas En Este Bloque

| Ruta | Antes | Después |
|---|---|---|
| `/api/[orgSlug]/business/users` | Paginación local duplicada. | Usa helper común y conserva máximo 100. |
| `/api/admin/transcoding/jobs` | Permitía `limit` hasta 200. | Usa helper común y limita a 100. |

## Pendiente

1. Ejecutar `npm run audit:pagination` y guardar el baseline de violaciones actuales.
2. Reducir todos los listados con tablas potencialmente grandes.
3. Migrar feeds críticos a cursor pagination cuando usen `created_at`.
4. Activar `CI_STRICT_TECH_DEBT=true npm run audit:pagination` en CI cuando el baseline llegue a cero.
5. Agregar tests por ruta con `page`, `pageSize`, `limit`, `offset` inválidos y extremos.
