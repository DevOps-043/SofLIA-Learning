# Índices De Escala

Estado: fase 4.3, implementación local parcial. Falta validar con `pg_stat_statements` y `EXPLAIN ANALYZE` en Supabase antes de declarar la tarea cerrada.

## Índices Nuevos

| Índice | Tabla | Query objetivo | Justificación | Estado |
|---|---|---|---|---|
| `idx_lesson_tracking_user_started_at_desc` | `lesson_tracking` | analytics por usuario ordenado por inicio reciente | Cubre timelines sin depender de `lesson_id/session_id` | Migración `20260518120000_indexes_for_scale_phase4.sql` |
| `idx_organization_users_org_role_status_joined` | `organization_users` | listados del business panel filtrados por org, rol y estado | Evita scans al segmentar miembros por rol/estado | Migración `20260518120000_indexes_for_scale_phase4.sql` |
| `idx_user_notifications_unread_created_at` | `user_notifications` | feed de notificaciones no leídas por usuario | Parcial por `read_at is null`, ordenado por recencia | Migración `20260518120000_indexes_for_scale_phase4.sql` |
| `idx_user_course_certificates_user_course` | `user_course_certificates` | consulta/deduplicación de certificados por usuario/curso | Índice no único hasta auditar duplicados reales | Migración `20260518120000_indexes_for_scale_phase4.sql` |

## Cobertura Ya Existente

| Hot path | Índice existente | Observación |
|---|---|---|
| LIA messages timeline | `idx_lia_messages_conversation_id` | `(conversation_id, created_at asc)` puede escanear en sentido inverso para `created_at desc` con igualdad por conversación. |
| Study planner sessions | `idx_study_sessions_user_plan_start_time`, `idx_study_sessions_user_range`, `idx_study_sessions_plan_start` | Ya cubren plan, rango y calendario usando `start_time`; no existe `scheduled_date` en el esquema actual. |
| Enrollment check | `idx_user_course_enrollments_user_course`, `idx_user_course_enrollments_user_status_enrolled` | Se mantiene no único hasta auditar duplicados. |
| User lesson progress lookup | `idx_user_lesson_progress_user_lesson` | Ya cubre `(user_id, lesson_id)`. |
| Video transcoding polling | `idx_video_transcoding_jobs_status` | Cubre status + `created_at desc`. |

## Pendiente De Esquema

| Hot path | Índice candidato | Motivo para no incluirlo todavía |
|---|---|---|
| Community posts feed | `community_posts(community_id, created_at desc)` | El código referencia `community_posts`, pero la tabla no aparece en las migraciones ni en los tipos generados actuales; requiere confirmar esquema real antes de migrar. |
| Audit timeline | `audit_logs(user_id, created_at desc)` | El plan menciona `audit_log`; el repo referencia `audit_logs` en limpieza, pero no existe definición de tabla en migraciones/tipos. |

## Validación Pendiente

1. Activar `pg_stat_statements` en Supabase.
2. Capturar top 50 por `total_exec_time`.
3. Ejecutar `EXPLAIN ANALYZE` para las top 10 queries.
4. Confirmar p95 < 200 ms o ajustar índices.
5. Revisar `pg_stat_user_indexes` a 30 días y retirar índices no usados.

### SQL De Validación

```sql
select query, calls, mean_exec_time, total_exec_time
from pg_stat_statements
order by total_exec_time desc
limit 50;
```

```sql
select schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
from pg_stat_user_indexes
where schemaname = 'public'
  and indexrelname in (
    'idx_lesson_tracking_user_started_at_desc',
    'idx_organization_users_org_role_status_joined',
    'idx_user_notifications_unread_created_at',
    'idx_user_course_certificates_user_course'
  )
order by idx_scan asc;
```
