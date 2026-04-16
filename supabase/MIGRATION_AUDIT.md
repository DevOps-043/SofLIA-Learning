# Migration Audit

Fecha de auditoria: 2026-04-06 (actualizado desde 2026-04-02)

## Resumen ejecutivo

- `supabase/migrations/` contiene 49 archivos SQL activos.
- Hay deuda de drift, pero no por falta total de migraciones: el problema principal es la mezcla de archivos timestamped con scripts incrementales sin timestamp.
- La estrategia de seguridad principal sigue siendo capa API + service role server-side. Eso esta documentado en [004_add_rls_policies.sql](./migrations/004_add_rls_policies.sql) y sigue alineado con el uso de autenticacion personalizada.
- Se creo la migracion [20260402130000_add_calendar_integrations_lookup_index.sql](./migrations/20260402130000_add_calendar_integrations_lookup_index.sql) para cubrir un lookup real que antes dependia solo de `user_id` y un `ORDER BY updated_at DESC`.

## Hallazgos clave

### 1. Historial de migraciones heterogeneo

- Existen migraciones con prefijos numericos (`001_` a `004_`), con timestamp completo (`20260204120000_...`) y varios scripts sin timestamp.
- Los scripts sin timestamp siguen siendo utiles, pero no ofrecen orden deterministico fuerte si se usan como migraciones operativas.
- Riesgo: el historial es entendible para humanos, pero no lo bastante fiable como fuente unica de verdad para reconstruccion automatica.

### 2. Scripts de indices fuera de la linea base

Evidencia:

- [002_add_indexes.sql](./migrations/002_add_indexes.sql) ya define indices base para `study_sessions`, incluyendo `organization_id`, `status` y `start_time`.
- [optimize-indexes-for-scale.sql](./migrations/optimize-indexes-for-scale.sql) agrega varios indices utiles para `study_sessions`, `lia_conversations` y `calendar_integrations`, pero sigue siendo un script sin timestamp.

Impacto:

- Algunas optimizaciones de rendimiento existen en el repo, pero no todas estan consolidadas en migraciones con orden fuerte.
- El caso mas claro era `calendar_integrations`: habia indice por `user_id`, pero no uno timestamped que cubriera el patron `WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`.

Accion:

- Se agrego un indice especifico y timestamped para ese patron:
  - [20260402130000_add_calendar_integrations_lookup_index.sql](./migrations/20260402130000_add_calendar_integrations_lookup_index.sql)

### 3. Estrategia RLS: deuda de verificacion, no de ausencia ciega

Evidencia:

- [004_add_rls_policies.sql](./migrations/004_add_rls_policies.sql) documenta explicitamente que el proyecto usa autenticacion personalizada y que `auth.uid()` no aplica a las tablas principales.
- El archivo mantiene comentada la alternativa con RLS para defensa en profundidad.

Conclusiones:

- No es correcto asumir que la falta de RLS en `study_sessions`, `lia_conversations` o `study_plans` sea automaticamente un bug.
- La deuda real aqui es de verificacion continua:
  - asegurar que todas las rutas server-side autentiquen antes de usar service role
  - reducir rutas grandes con queries sensibles mezcladas con logica de negocio
  - evitar clientes admin creados inline y fuera de puntos auditables

### 4. Consolidacion y limpieza historica

Evidencia:

- [cleanup_redundancias.sql](./migrations/cleanup_redundancias.sql) elimina columnas y tablas completas: communities, reels, prompts, coupons, learning routes, entre otras.
- Las migraciones de enero 2025 de `lia_personalization_settings` agregan y luego eliminan varias columnas en dias consecutivos.

Riesgo:

- El historial conserva bastante ruido historico que complica auditar el estado final.
- No se deben borrar migraciones viejas, pero si conviene tener una base consolidada o snapshot documentado para nuevos entornos.

### 5. Documentacion desactualizada sobre snapshots

Evidencia:

- [MIGRATIONS.md](./MIGRATIONS.md) menciona `BD.sql` y `Database.sql` dentro de `supabase/migrations/`.
- En esta auditoria ambos archivos ya no existen en ese directorio.

Accion recomendada:

- Actualizar [MIGRATIONS.md](./MIGRATIONS.md) para reflejar el estado real del repo y evitar falsas alarmas durante futuras auditorias.

### 6. `looseQuery.ts` y tipos generados

Hallazgo:

- [apps/web/src/lib/supabase/looseQuery.ts](../apps/web/src/lib/supabase/looseQuery.ts) ya no contiene una lista dura de tablas fuera del schema generado; hoy es una abstraccion generica.
- Tablas que antes eran sospechosas de drift como `lesson_tracking` y `user_tour_progress` ya existen en [apps/web/src/lib/supabase/types.ts](../apps/web/src/lib/supabase/types.ts).

Conclusion:

- En esta tanda no se detecto un desfase concreto entre `looseQuery.ts` y `types.ts`.
- La deuda residual esta mas en rutas que usan clientes demasiado permissive o queries sin encapsular, no en `looseQuery.ts`.

## Candidatos prioritarios para la siguiente consolidacion

1. Mover indices utiles de scripts sin timestamp a migraciones timestamped cuando exista evidencia directa de uso en codigo.
2. Actualizar [MIGRATIONS.md](./MIGRATIONS.md) para quitar referencias obsoletas y separar claramente scripts operativos vs scripts auxiliares.
3. Crear una linea base documentada del schema actual para reducir el costo de auditorias futuras.
4. Seguir adelgazando rutas server-side que usan service role e integraciones OAuth en el mismo archivo.

## Migraciones añadidas en Sprint 3 (2026-04-04)

| Archivo | Propósito |
| --- | --- |
| `20260404120000_rls_missing_tables.sql` | RLS en `study_plans`, `lia_messages`, `calendar_integrations` (3 tablas antes sin políticas) |
| `20260404130000_indexes_lia_progress.sql` | Índices compuestos: `idx_lia_conversations_user_id`, `idx_lia_messages_conversation_id`, `idx_user_lesson_progress_user_course` |

**Estado RLS post-Sprint 3:** Las tablas con mayor riesgo de acceso sin restricción ya tienen RLS habilitado. La estrategia API-layer sigue como defensa principal, RLS como segunda capa.

## Estado despues de esta auditoria

- Infraestructura de migraciones: mejor documentada, pero no consolidada por completo.
- Seguridad BD: la estrategia real queda confirmada como API-layer security + service role server-side.
- Rendimiento BD: mejora puntual aplicada en `calendar_integrations`, con deuda residual en consolidacion historica y verificacion de uso de indices auxiliares.

---

## Sprint 4 — Limpieza de migraciones y optimizacion (2026-04-06)

### Acción: limpieza del directorio de migraciones

Se eliminaron **49 archivos** de migración no ejecutados. Ninguno había sido aplicado al esquema de la base de datos. El conjunto retenido es el canónico a partir de esta fecha.

**Razones de eliminación:**

- Scripts sin timestamp (sin orden determinístico fuerte): `001_*`, `002_*`, `003_*`, `004_*`, `Database_Optimizations.sql`, `optimization-indexes.sql`, `optimize-indexes-for-scale.sql`, `optimize_organization_indexes.sql`, etc.
- Sistema de jerarquía (Region > Zone > Team) — feature no activo en el código actual: `20260109_hierarchy_*`, `20260110_hierarchy_*`, `20260111_hierarchy_*`, `20260117_*`, `20260119_*`.
- LIA personalization settings con columnas agregadas y eliminadas en días consecutivos: `20250108_*`, `20250109_*`.
- Scripts de backfill de datos y cleanup histórico: `cleanup_redundancias.sql`, `restore_missing_elements.sql`, `update_lesson_durations.sql`, `fix-study-sessions-duration-minutes.sql`, `add_user_to_organizations.sql`, etc.
- Features eliminados o no consolidados: `create_user_invitations.sql`, `create_panel_business_bucket.sql`, `create_cascade_delete_function.sql`.
- Skills stub (función placeholder hardcodeada): `20260204120000_create_skills_tables.sql`.
- Organization join requests: `20260214_create_organization_join_requests.sql`.

### Migraciones retenidas (conjunto canónico)

| Archivo | Propósito |
| --- | --- |
| `20260402113000_planner_notifications_query_indexes.sql` | Índices para study planner, calendar sync y notificaciones |
| `20260402130000_add_calendar_integrations_lookup_index.sql` | Lookup de calendar integrations por usuario + updated_at |
| `20260402143000_add_user_notifications_created_index.sql` | Índice cursor para feed de notificaciones |
| `20260404120000_rls_missing_tables.sql` | RLS en `study_plans`, `lia_messages`, `calendar_integrations` |
| `20260404130000_indexes_lia_progress.sql` | Índices compuestos para LIA conversations, messages y user lesson progress |
| `20260406120000_core_lookup_indexes.sql` | Índices core: `users(email)`, `courses(slug)`, `user_course_enrollments`, `study_plans(user_id, start_date)`, `courses(is_active, created_at DESC)` |

### Optimizaciones de código aplicadas (mismo sprint)

| Archivo | Cambio |
| --- | --- |
| `app/api/admin/skills/route.ts` | `.select('*')` → campos explícitos |
| `app/api/lia/conversations/[conversationId]/messages/route.ts` | `.select('*')` → 5 campos usados |
| `app/api/admin/lia-analytics/conversations/route.ts` | `.select('*', count)` → 17 campos explícitos de la vista |
| `app/api/account-settings/route.ts` | Validación Zod con `AccountSettingsSchema` |
| `app/api/favorites/route.ts` | Validación Zod con `ToggleFavoriteSchema` (UUID strict) |
| `app/api/profile/route.ts` | Validación Zod con `UpdateProfileSchema` (`.strict()`) |
