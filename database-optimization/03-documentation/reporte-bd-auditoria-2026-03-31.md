# Auditoría de Base de Datos — SofLIA Learning

**Fecha:** 2026-03-31
**Responsable:** Claude Code (Staff Engineer)
**Basado en:** `NewBDStructure.sql` y `prompt_maestro.md`

---

## 1. Resumen Ejecutivo

Esta auditoría técnica evalúa el esquema principal de la base de datos de SofLIA Learning. Se documentaron de forma exhaustiva 113 tablas, diagnosticando problemas de seguridad de datos, cuellos de botella de performance y brechas de diseño (violaciones DRY y tipos de datos en modelos). 

El análisis pone foco adicional en el núcleo de **Asignación de Talleres (Workshops)** para el soporte B2B y jerárquico, validando su estructura de datos y documentando las migraciones recientes.

## 2. Inventario Completo de Tablas (113)

Las tablas se dividen en los siguientes dominios principales:

### Dominio: Core de Cursos y Aprendizaje (13)
- `courses`, `courses_staging`, `course_modules`, `course_lessons`, `course_lessons_en`, `course_lessons_pt`
- `lesson_activities`, `lesson_materials`, `lesson_checkpoints`, `lesson_time_estimates`
- `skills`, `course_skills`, `skill_badges`

### Dominio: Tracking y Progreso (8)
- `user_course_enrollments`, `user_lesson_progress`, `lesson_tracking`, `daily_progress`, `user_streaks`, `user_tour_progress`, `user_quiz_submissions`, `lesson_feedback`

### Dominio: Inteligencia Artificial / SofLIA (9)
- `lia_conversations`, `lia_messages`, `lia_messages_tokens_tmp`, `lia_user_feedback`, `lia_personalization_settings`, `lia_activity_completions`, `lia_common_questions`
- `ai_moderation_config`, `ai_moderation_logs`

### Dominio: Asignaciones Jerárquicas y B2B (10)
- `hierarchy_course_assignments`, `region_course_assignments`, `zone_course_assignments`, `team_course_assignments`, `organization_course_assignments`
- `organization_nodes`, `organization_node_courses`, `organization_node_users`, `organization_node_objectives`, `organization_structures`

### Dominio: Organizaciones y Entidades B2B (8)
- `organizations`, `organization_users`, `organization_regions`, `organization_zones`, `organization_teams`, `organization_join_requests`, `organization_analytics`, `dashboard_layouts`

### Dominio: Planner y Calendario (12)
- `study_plans`, `study_sessions`, `study_preferences`, `user_calendar_events`, `calendar_connections`, `calendar_integrations`, `calendar_subscription_tokens`, `calendar_sync_history`
- `planner_policies`, `planner_policy_versions`, `planner_policy_scopes`, `planner_audit_log`

### Dominio: Autenticación, Usuarios y Acceso (5)
- `users`, `user_session`, `oauth_accounts`, `refresh_tokens`, `password_reset_tokens`

### Dominio: Comunidad, Q&A y Moderación (7)
- `course_questions`, `course_question_responses`, `course_question_reactions`, `course_reviews`, `user_lesson_notes`, `user_warnings`, `forbidden_words`

### Dominio: Suscripciones y Pagos (4)
- `transactions`, `payment_methods`, `subscriptions`, `organization_course_purchases`

### Dominio: Notificaciones y Comunicaciones (7)
- `user_notifications`, `user_notification_preferences`, `organization_notification_preferences`, `notification_settings`, `notification_email_queue`, `notification_push_subscriptions`, `notification_stats`

### Dominio: Logs y Telemetría (5)
- `audit_logs`, `activity_logs`, `monitoring_sessions`, `user_activity_log`, `reportes_problemas`

### Dominio: SCORM (4)
- `scorm_packages`, `scorm_attempts`, `scorm_interactions`, `scorm_objectives`

### Otros Dominios
- **Chats Jerárquicos (3)**: `hierarchy_chats`, `hierarchy_chat_participants`, `hierarchy_chat_messages`
- **Certificados (3)**: `certificate_templates`, `user_course_certificates`, `certificate_ledger`
- **Herramientas (Tools) (3)**: `tools`, `user_tools`, `user_favorite_tools`
- **Invitaciones (3)**: `bulk_invite_links`, `bulk_invite_registrations`, `user_invitations`
- **Internacionalización (1)**: `content_translations`
- **Workflow/Asíncrono (1)**: `courseengine_inbox`
- **Legacy (7)**: `niveles`, `preguntas`, `relaciones`, `roles`, `sectores`, `user_perfil`

---

## 3. Estado y Clasificación Contextual

- **Tablas Activas**: ~103 de las 113 tablas se consideran el motor activo del sistema en base a los dominios identificados.
- **Tablas Legacy / En Desuso**: Las tablas con convenciones de nomenclatura en español y llaves primarias de tipo entero (`niveles`, `preguntas`, `relaciones`, `roles`, `sectores`, `user_perfil`) provienen claramente de una iteración anterior y deben programarse para su eliminación.

### Tablas B2C (Orientadas al usuario final)
El núcleo B2C permite a usuarios consumir cursos de manera independiente:
- `courses`, `course_modules`, `course_lessons`: Información pública de aprendizaje.
- `subscriptions`, `transactions`, `payment_methods`: Sistema de monetización para individuos.
- `study_plans`, `study_sessions`, `study_preferences`: Personalización del estudiante.
- `user_course_enrollments`, `user_lesson_progress`, `lesson_tracking`: Telemetría B2C.

### Tablas B2B (Orientadas a Organizaciones)
La extensión B2B soporta estructuras jerárquicas y cumplimiento formal:
- Todas las tablas con prefijo `organization_` (e.g., `organizations`, `organization_users`).
- Estructura jerárquica: `organization_regions`, `organization_zones`, `organization_teams`, `organization_nodes`.
- Tablas del módulo de asignación de talleres de cumplimiento.

---

## 4. Análisis Especial: Tablas de Asignación de Talleres

El sistema permite la administración programada de "workshops" (cursos empaquetados como talleres de cumplimiento). **No existe una entidad `workshops` propia;** el sistema reutiliza la entidad `courses` pero acoplada a una logística de distribución sofisticada.

### Arquitectura de Asignaciones
El flujo central de datos recae sobre 5 tablas pivot/hubs y 1 tabla central de granularidad fina:

1. **`hierarchy_course_assignments`**: Es el hub principal. Contiene el origen de la asignación (`assigned_by`, `course_id`, `approach` de fechas).
2. **Tablas Pivot de Nivel Jerárquico**:  
   - `region_course_assignments`
   - `zone_course_assignments`
   - `team_course_assignments`  
   Estas tablas conectan el *hierarchy assignment* con las agrupaciones respectivas.
3. **`organization_course_assignments`**: La "Tabla Central" de cumplimiento de usuario individual. Es mucho más compleja que un simple pivot. Se detalla a continuación.

**La tabla `work_team_course_assignments` ha sido deprecada** y eliminada del esquema canónico como se refleja en la migración `20260111_migrate_work_team_assignments.sql`.

### Detalle: `organization_course_assignments`
Es la tabla crítica donde interactúa el compliance B2B. Sus atributos incluyen:
- **Estados Core**: `status` (assigned, in_progress, completed, overdue, cancelled), y porcentajes.
- **Compliance y Políticas**: Contiene `hard_due_date`, `soft_due_date`, `policy_version_id`, `compliance_mode`, `exemption_reason`.
- **Recurrencia**: Soporta ciclos de re-entrenamiento (`recurrence_type`, `next_cycle_at`).
- **Enlace Jerárquico**: `hierarchy_assignment_id` liga este registro con el esfuerzo masivo disparado por Mánagers B2B.

### Uso en Código
- Servicio: `apps/web/src/features/admin/services/adminWorkshops.service.ts`
- Hook: `apps/web/src/features/admin/hooks/useAdminWorkshops.ts`
- Endpoints B2B: 
  - `apps/web/src/app/api/[orgSlug]/business/hierarchy/courses/assign/route.ts` (API de asignación masiva/individual)
  - `apps/web/src/app/api/[orgSlug]/business/hierarchy/courses/assignments/route.ts` (Lectura B2B)

### Flujo Textual de Asignación
1. Administrador B2B o Supervisor selecciona un curso a nivel región/zona/equipo.
2. La API inserta en `hierarchy_course_assignments` el registro maestro.
3. La API vincula el alcance en `region_...`, `zone_...` o `team_course_assignments`.
4. El sistema propaga la acción resolviendo los miembros implicados y genera registros individuales en `organization_course_assignments`.

---

## 5. Análisis de Seguridad — Datos Sensibles y PII (§7)

Evaluación de protección de la información corporativa y privada:

> [!CAUTION]
> **Fallo de Seguridad: Tokens no cifrados**
> Las tablas `calendar_connections` y `calendar_integrations` almacenan **OAuth Access Tokens y Refresh Tokens en texto plano**. Esto es un riesgo crítico de exfiltración de credenciales. Requerimiento urgente: Cambiar a encriptación en base de datos (`pgsodium` o capa aplicación).

- **PII / Datos Sensibles**: 
  - `users` (email, nombres, teléfono).
  - `payment_methods` parece manejar correctamente los datos con la columna `encrypted_data` (jsonb).
  - `refresh_tokens`, `password_reset_tokens` y `user_session` contienen estados de acceso que **deben resguardarse detrás de RLS agresivo.**
- **Conformidad RLS (Row Level Security)**: La auditoría en `NewBDStructure.sql` no define claramente directivas ENABLE ROW LEVEL SECURITY. Los scripts complementarios abordaron parte, pero es mandatorio confirmar RLS transversal.
- **Recomendación**: Purgar periódicamente `password_reset_tokens` y tokens vencidos (estrategia de minimización de datos).

---

## 6. Análisis de Performance — Tablas de Alto Volumen (§8)

Preparación para escalar a 100,000 usuarios recurrentes simultáneos:

> [!WARNING]
> Tablas bajo presión masiva de transaccionalidad:
> `lia_messages`, `lesson_tracking`, `user_activity_log`, y `activity_logs`.

- **`lesson_tracking` y `user_activity_log`**: Emiten transacciones continuas por eventos del usuario en tiempo real (heartbeats de video, etc.).  
  *Estrategia sugerida*: **Batching en aplicación o caché Redis**, volcando en lotes a PostgreSQL, seguido de particiones nativas por fecha o por `organization_id` B2B / usuario B2C.
- **Mensajería IA (`lia_messages`)**: Este volumen crece exponencialmente (conversaciones multipartita y con gran peso de payload / tokens_usd).  
  *Estrategia sugerida*: Archivo a _cold storage_ (ej. S3 / blob de Supabase) posterior a 6 meses si la organización lo aprueba.
- **N+1 Queries Potencial**: Dashboard B2B compilando analíticas sobre los miembros, sus cursos y su estado en `organization_course_assignments` sin consolidaciones o vistas materializadas. Apoyarse proactivamente en vistas o resúmenes continuos.

---

## 7. Integridad del Modelo de Datos

Inconsistencias y violaciones arquitectónicas encontradas en la estructura técnica:

- **Violación DRY (Don't Repeat Yourself)**: La base aloja `course_lessons_en` y `course_lessons_pt` como réplicas de `course_lessons`. Considerando que existe la tabla `content_translations`, las variaciones de idioma por tabla se convierten en un dolor crónico de mantenimiento.
- **Campos Indefinidos**: Entidades como `organization_nodes.path`, `tools.category`, `tools.status` o `user_tools.category` dependen de tipos `USER-DEFINED` no declarados formalmente en `NewBDStructure`. Esto implica dependencias no declaradas y rompe la reproducibilidad.
- **Timestamps Dispares**: Mezcla no intencionada entre `timestamp with time zone` (ej: `users.created_at`) y `timestamp without time zone` (ej: `organization_course_assignments.created_at`). Es crucial estandarizar hacia `with time zone` globalmente para evitar bugs geolocalizados.

---

## 8. Tablas Candidatas a Deprecar / Limpiar

1. **Idiomas Redundantes**: `course_lessons_en`, `course_lessons_pt`. (Migrar a `content_translations`).
2. **Sistemas Vagos/Antiguos (Legacy)**: `niveles`, `preguntas`, `relaciones`, `roles`, `sectores`, `user_perfil`.
3. **Archivos Temporales**: `lia_messages_tokens_tmp` (su sufijo `_tmp` advierte su inestabilidad).

---

## 9. Riesgos Identificados

- **Riesgos de Fuga (OAuth)**: Tokens API externos en texto plano abren la posibilidad a ataques a las cuentas de calendario de los clientes.
- **Contención de Transacciones**: A altas cargas concurrenciales, múltiples estudiantes guardando el registro de `lesson_tracking` al cierre de sus sesiones saturarán el pool de base de datos.
- **Brecha Código vs Schema**: El código levanta referencias a más de 160 tablas cuando el motor documenta solo 113 activamente soportadas. Este "Shadow DB" interrumpe refactorizaciones y genera problemas inesperados al tocar dependencias indirectas.

---

## 10. Recomendaciones Técnicas Inmediatas

1. **Implementar Cifrado Urgente**: Agregar `pgcrypto` o `pgsodium` en las columnas críticas de la tabla de integraciones de calendarios (`access_token`, `refresh_token`).
2. **Definir Política Timestamps**: Aplicar un script de migración masiva forzando el tipo `TIMESTAMPTZ` (timestamp with time zone) en toda tabla histórica existente.
3. **Indexado de Búsqueda Ágil B2B**: Garantizar que todas las columnas de ID (FKs) en `organization_course_assignments` y `hierarchy_course_assignments` tengan índices B-Tree validados para asegurar renders listados inmediatos.

---

## 11. Mejoras Post-Auditoría Recomendadas

1. Iniciar un _Feature Branch_ que unifique el esquema base: Elimine los datos legacy (`niveles`, `preguntas`, etc.) del schema en Supabase, previniendo confusión en el onboarding a nuevos desarrolladores.
2. Empezar a utilizar `content_translations` para consolidar el portafolio formativo en lenguas alternativas, permitiendo la eliminación controlada de `course_lessons_en` y hermanos.
3. Definir y estipular en un documento `schema.yaml` la declaración canónica de la base de datos para garantizar integraciones y prevenir migraciones fallidas.
