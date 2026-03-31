# Supabase Migrations

52 archivos totales. Orden de ejecución: prefijos numéricos primero, luego fechas YYYYMMDD, finalmente archivos sin prefijo.

---

## Grupo 1 — Bootstrap del esquema principal (sin fecha)

| Archivo | Propósito |
|---------|-----------|
| `001_add_organization_id_to_tables.sql` | Agrega `organization_id` a tablas de usuarios, cursos y progreso para aislamiento multi-tenant |
| `001_create_user_tour_progress.sql` | Crea tabla `user_tour_progress` para guías de onboarding (**conflicto de prefijo** con el anterior — ejecutar en cualquier orden) |
| `002_add_indexes.sql` | Índices básicos de rendimiento para búsquedas frecuentes |
| `003_migrate_existing_data.sql` | Migración de datos históricos al nuevo esquema multi-tenant |
| `004_add_rls_policies.sql` | **Decisión de seguridad**: RLS no habilitado en tablas principales (ver nota de seguridad abajo). El archivo está comentado intencionalmente. |

## Grupo 2 — SofLIA (IA) (2025-01-08 / 2025-01-09)

| Archivo | Propósito |
|---------|-----------|
| `20250108_create_lia_personalization_settings.sql` | Tabla `lia_personalization_settings` con RLS habilitado (usa `auth.uid()`) |
| `20250108_remove_conversation_pagination_from_lia_personalization.sql` | Drop de columna `conversation_pagination` |
| `20250108_remove_recording_history_from_lia_personalization.sql` | Drop de columna `recording_history` |
| `20250109_remove_emoji_and_connector_from_lia_personalization.sql` | Drop de columnas `emoji` y `connector_style` |

## Grupo 3 — Cursos y Progreso (2025-12)

| Archivo | Propósito |
|---------|-----------|
| `20251227_add_course_assignment_start_date.sql` | Columna `start_date` en asignaciones B2B |
| `20251229_lesson_tracking.sql` | Tabla `lesson_tracking` con índices y RLS para rastrear sesiones de video |

## Grupo 4 — Sistema Jerárquico B2B (2026-01-09 al 2026-01-19)

Módulo completo de jerarquías organizacionales (regiones, zonas, equipos, chats de nodo).

| Archivo | Propósito |
|---------|-----------|
| `20260109_hierarchy_system.sql` | Tablas base: `organization_structures`, `organization_nodes`, `organization_node_users` |
| `20260109_hierarchy_system_v2.sql` | Revisión del esquema base (campos adicionales) |
| `20260109_hierarchy_image_fields.sql` | Campos de imagen en nodos |
| `20260109_hierarchy_storage_buckets.sql` | Bucket `hierarchy-images` en Supabase Storage |
| `20260109_hierarchy_analytics.sql` | Funciones de analytics de jerarquía |
| `20260109_get_hierarchy_courses.sql` | Función RPC para cursos por jerarquía |
| `20260109_fix_hierarchy_storage_rls.sql` | Fix de políticas RLS en el bucket de imágenes |
| `20260110_hierarchy_chats.sql` | Tablas `hierarchy_chats`, `hierarchy_chat_messages`, `hierarchy_chat_participants` con RLS |
| `20260110_hierarchy_chats_fix.sql` | Fix de políticas de chat |
| `20260110_hierarchy_chats_fix_v2.sql` | Fix adicional de permisos de chat |
| `20260110_hierarchy_chats_storage_bucket.sql` | Bucket para archivos adjuntos de chat |
| `20260110_hierarchy_chats_verify.sql` | Script de verificación (sólo queries, no DML) |
| `20260111_hierarchy_course_assignments.sql` | Tabla `organization_node_courses` con RLS |
| `20260111_hierarchy_assignment_helpers.sql` | Funciones RPC auxiliares de asignación |
| `20260111_hierarchy_analytics_enhanced.sql` | Analytics ampliados con datos de progreso |
| `20260111_add_hierarchy_assignment_link.sql` | FK entre asignaciones de jerarquía y cursos |
| `20260111_migrate_work_team_assignments.sql` | Migración de asignaciones previas al nuevo esquema |
| `20260117_dynamic_hierarchy_refactor.sql` | Refactor: jerarquía dinámica flexible (sin niveles fijos) |
| `20260117_dynamic_hierarchy_rls.sql` | Políticas RLS para el esquema dinámico |
| `20260117_fix_permissions_and_cache.sql` | Fix de permisos y limpieza de caché de funciones |
| `20260119_enable_node_chats.sql` | Habilitar chats en todos los tipos de nodo |
| `20260119_fix_hierarchy_analytics.sql` | Fix de funciones de analytics tras el refactor dinámico |

## Grupo 5 — Skills y Solicitudes (2026-02)

| Archivo | Propósito |
|---------|-----------|
| `20260204120000_create_skills_tables.sql` | Tablas `skills`, `course_skills`, `skill_badges` con RLS |
| `20260214_create_organization_join_requests.sql` | Tabla `organization_join_requests` para solicitudes de unirse a org |

## Grupo 6 — Archivos sin prefijo de fecha (ejecutar con precaución)

> Estos archivos no tienen timestamp. Algunos son incrementales, otros son snapshots de referencia.

| Archivo | Tipo | Propósito |
|---------|------|-----------|
| `BD.sql` | **Snapshot** (NO ejecutar) | Schema completo de referencia. Encabezado indica "not meant to be run". |
| `Database.sql` | **Snapshot** (NO ejecutar) | Snapshot alternativo del schema. Mismo aviso en encabezado. |
| `Database_Optimizations.sql` | Incremental | Índices y optimizaciones adicionales |
| `add_study_plan_time_fields.sql` | Incremental | Columnas de duración en `study_sessions` y `study_plans` |
| `add_user_to_organizations.sql` | Incremental | FK de usuarios a organizaciones |
| `cleanup_redundancias.sql` | Incremental | Drop de columnas/tablas duplicadas tras migraciones |
| `create_cascade_delete_function.sql` | Incremental | Función `delete_user_cascade()` para borrado en cascada |
| `create_panel_business_bucket.sql` | Incremental | Bucket `panel-business` en Supabase Storage |
| `create_user_invitations.sql` | Incremental | Tabla `organization_invitations` e invite links |
| `delete_user_manual.sql` | Utilidad | Script de borrado manual de usuario (no ejecutar en producción sin revisar) |
| `fix-study-sessions-duration-minutes.sql` | Fix | Corrige columna `duration_minutes` en `study_sessions` |
| `optimization-indexes.sql` | Incremental | Índices de rendimiento para tablas de progreso |
| `optimize-indexes-for-scale.sql` | Incremental | Índices adicionales para escala (user_lesson_progress, lia_messages, study_sessions) |
| `optimize_organization_indexes.sql` | Incremental | Índices en tablas de organizaciones |
| `restore_missing_elements.sql` | Fix | Restaura elementos eliminados accidentalmente |
| `simplify_roles_migration.sql` | Incremental | Simplificación del sistema de roles de usuario |
| `update_lesson_durations.sql` | Incremental | Actualiza duraciones de lecciones en base a metadatos de video |

---

## Nota de Seguridad: Estrategia RLS

Este proyecto usa **autenticación personalizada** (no Supabase Auth), por lo que las políticas RLS estándar con `auth.uid()` **no aplican** a las tablas principales.

**Seguridad implementada a nivel de aplicación:**
- `requireAdmin()` — `apps/web/src/lib/auth/requireAdmin.ts`
- `requireBusiness()` — `apps/web/src/lib/auth/requireBusiness.ts`
- Filtros de `organization_id` obligatorios en todas las queries de negocio
- Service role key sólo usada server-side (nunca expuesta al cliente)

**RLS habilitado** sólo en tablas que sí usan Supabase Auth o Storage:
- `lia_personalization_settings` (Supabase Auth)
- `lesson_tracking`, `hierarchy_chats*`, `organization_node_*`, `skills`, etc. (RLS con service_role bypass)
- Buckets de Storage: `hierarchy-images`, `hierarchy-chat-files`, `panel-business`

**Tablas principales sin RLS** (seguridad en capa API):
- `usuarios`, `organizations`, `organization_users`, `cursos`, `modulos`, `lecciones`
- `user_lesson_progress`, `lia_conversations`, `study_plans`, `study_sessions`

---

## Problemas Conocidos

1. **Conflicto de prefijo `001_`**: Dos archivos comienzan con `001_`. No afecta funcionalidad (Supabase CLI ordena por nombre completo), pero es confuso.
2. **Archivos sin timestamp**: Los archivos del Grupo 6 no tienen timestamp. Si se usan con `supabase db push`, el orden de ejecución no está garantizado.
3. **`BD.sql` y `Database.sql`**: Son snapshots de referencia, NO migrations. No ejecutar con `supabase db push`. Mover a `supabase/schema/` si se desea conservar.

---

## Índices Clave Confirmados

Las siguientes tablas críticas tienen índices apropiados:

| Tabla | Índices |
|-------|---------|
| `user_lesson_progress` | `(user_id)`, `(lesson_id)`, `(user_id, lesson_id)`, `(enrollment_id)` |
| `lia_messages` | `(conversation_id)` |
| `study_sessions` | `(user_id)`, `(plan_id)`, `(status)`, `(user_id, start_time DESC)`, `(user_id, start_time, end_time)` |
| `lesson_tracking` | `(user_id)`, `(lesson_id)`, `(session_id)`, `(status)`, `(user_id, lesson_id)` |
