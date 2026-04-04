# Plan: Auditoría y Documentación de Base de Datos — SofLIA Learning

**Fecha:** 2026-03-31
**Estado:** Aprobado — pendiente ejecución
**Responsable:** Claude Code (Staff Engineer persona via prompt_maestro.md)
**Fuente de verdad:** `prompt_maestro.md` — secciones §5 (BD), §7 (Seguridad), §8 (Performance), §9 (QA), §10 (Observabilidad), §11 (Documentación)

---

## Contexto

El equipo está en medio de una refactorización que reduce ~66% de la deuda técnica (en otra rama). La misión de esta sesión es hacer una auditoría exhaustiva de la base de datos (`NewBDStructure.sql`) para:

1. Identificar qué tablas están activas en el sistema hoy
2. Clasificar las tablas B2C vs B2B
3. Poner especial atención en las tablas de asignación de talleres (workshops)
4. Evaluar seguridad de datos sensibles/PII por tabla (§7 prompt_maestro)
5. Evaluar performance y escalabilidad para tablas de alto volumen (§8 prompt_maestro)
6. Generar documentación técnica clara como output
7. (Opcional) Generar SQL con `COMMENT ON TABLE` para todas las tablas

---

## Hallazgos clave del análisis previo

### Sobre el esquema
- **`NewBDStructure.sql`**: 113 tablas definidas, 1,988 líneas, **sin ningún `COMMENT ON TABLE`**
- **Tablas referenciadas en código**: ~161 tablas únicas (algunas del esquema viejo aún no migradas al nuevo esquema)
- **Tablas legacy en el código**: `usuarios`, `user_perfil`, `preguntas`, `respuestas`, `areas`, etc. (del esquema anterior)
- **Tablas duplicadas por idioma**: `course_lessons_en`, `course_lessons_pt` — réplicas exactas de `course_lessons`; candidatas a deprecación dado que existe `content_translations`
- **Tipos sin resolver**: `USER-DEFINED` en `organization_nodes.path`, `tools.category`, `tools.status`, `user_tools.category`
- **Inconsistencia de timestamps**: mezcla de `timestamp with time zone` y `timestamp without time zone` sin justificación clara

### Sobre "workshops" (talleres)
- **No existe una tabla `workshops`** — los talleres son **cursos** (`courses`) con gestión admin propia
- Los componentes `ActivityModal.tsx`, `MaterialModal.tsx`, `QuizBuilder.tsx`, `QuizImportModal.tsx` son de **contenido de lecciones**, NO de asignación de talleres
- **Las asignaciones de talleres son jerárquicas** y viven en 5 tablas activas + 1 legacy:

| Tabla | Rol | En esquema actual |
|-------|-----|:-----------------:|
| `hierarchy_course_assignments` | Tabla central (hub) de asignaciones jerárquicas | ✅ |
| `region_course_assignments` | Pivot asignación ↔ región | ✅ |
| `zone_course_assignments` | Pivot asignación ↔ zona | ✅ |
| `team_course_assignments` | Pivot asignación ↔ equipo | ✅ |
| `organization_course_assignments` | Tabla central de asignaciones org→user→course con campos de compliance (30+ columnas: `hard_due_date`, `soft_due_date`, `policy_version_id`, `compliance_mode`, exemptions, recurrencia, etc.) | ✅ |
| `work_team_course_assignments` | **Legacy** — NO está en el esquema actual; solo existe en la migración `20260111_migrate_work_team_assignments.sql` | ❌ |

### Sobre seguridad de datos (§7 prompt_maestro)
Tablas con datos sensibles detectadas que requieren análisis especial:
- `calendar_connections` — tokens OAuth en texto plano (`access_token`, `refresh_token`)
- `calendar_integrations` — tokens OAuth
- `oauth_accounts` — tokens de terceros
- `refresh_tokens` — hashes de tokens de sesión
- `payment_methods` — `encrypted_data` (jsonb encriptado)
- `user_session` — JWTs
- `password_reset_tokens` — tokens de recuperación

---

## Archivos críticos

| Archivo | Propósito |
|---------|-----------|
| `database-optimization/02-schema/NewBDStructure.sql` | Esquema fuente (113 tablas) |
| `supabase/migrations/20260111_hierarchy_course_assignments.sql` | Creación de tablas de asignación |
| `supabase/migrations/20260111_hierarchy_assignment_helpers.sql` | Funciones helper SQL |
| `supabase/migrations/20260111_migrate_work_team_assignments.sql` | Migración de asignaciones legacy |
| `supabase/migrations/20260117_dynamic_hierarchy_refactor.sql` | Refactor del sistema jerárquico posterior |
| `apps/web/src/app/api/business/hierarchy/courses/assign/route.ts` | API de asignación de cursos |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/courses/assign/route.ts` | API de asignación con orgSlug dinámico (ruta B2B) |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/courses/assignments/route.ts` | Listado de asignaciones con orgSlug |
| `apps/web/src/app/api/business/hierarchy/courses/assignments/[id]/route.ts` | CRUD individual de asignación |
| `apps/web/src/features/admin/services/adminWorkshops.service.ts` | Servicio admin de talleres |
| `apps/web/src/features/admin/hooks/useAdminWorkshops.ts` | Hook React que consume el servicio |
| `database-optimization/03-documentation/` | Destino de la documentación generada |

---

## Plan de implementación

### Paso 1 — Leer el esquema completo
- Leer `NewBDStructure.sql` completo para obtener la lista definitiva de las 113 tablas con sus columnas y relaciones

### Paso 2 — Clasificar cada tabla (4 dimensiones)

Para cada tabla del esquema, determinar:
- **Estado**: Activa / Posiblemente inactiva / Legacy
- **Contexto**: B2C / B2B / Híbrida / Interna/Sistema
- **Dominio**: Auth, Cursos, Asignaciones, Comunidad, IA, Notificaciones, etc.
- **Riesgo técnico**: Notas sobre coupling, uso crítico, dependencias, etc.

Apoyarse en el mapa de referencias de código (~161 tablas con conteo de referencias) para determinar si cada tabla está activa.

### Paso 2.5 — Clasificación de seguridad por tabla (§7 prompt_maestro)

Para cada tabla, evaluar:
- **PII/Datos sensibles**: ¿Contiene datos personales, tokens, credenciales?
- **RLS**: ¿Tiene políticas de Row Level Security configuradas?
- **Cifrado**: ¿Los datos sensibles están cifrados en reposo?
- **Acceso**: ¿Quién puede leer/escribir esta tabla? ¿Principio de mínimo privilegio?
- **Retención**: ¿Existe estrategia de retención/minimización de datos sensibles?

### Paso 3 — Análisis profundo de tablas de asignación de talleres

Documentar con detalle:
- Esquema completo de cada tabla (columnas, tipos, constraints, FKs)
- Flujo de datos del proceso de asignación (Admin crea taller → Business asigna → Usuario recibe)
- Qué archivos del código las usan y para qué
- Estado de la tabla `work_team_course_assignments` (legacy/migrada — no en esquema actual)
- Funciones SQL helper asociadas

### Paso 3.5 — Análisis de performance y escalabilidad (§8 prompt_maestro)

Evaluar para cada tabla de alto volumen:
- **Índices existentes** y si son suficientes para queries frecuentes
- **Patrones de acceso** (read-heavy vs write-heavy)
- **Volumen esperado** a 100K usuarios simultáneos
- **Candidatas a particionamiento** (tablas de logs temporales, mensajes, tracking)
- **Tablas con potencial de N+1** por exceso de FKs
- **Candidatas a caché** (tablas de configuración/catálogos de baja mutación)
- **Tablas que necesitan estrategia de retención** (logs, mensajes, actividad)

### Paso 4 — Generar documento de documentación técnica

**Output**: `database-optimization/03-documentation/reporte-bd-auditoria-2026-03-31.md`

Estructura del documento:
```
# Auditoría de Base de Datos — SofLIA Learning
## Resumen ejecutivo
## Inventario completo de tablas (113)
  - Por dominio
  - Clasificación B2C / B2B / Híbrida
  - Estado (activa / inactiva / legacy)
## Tablas activas en el sistema
## Tablas B2C (con descripción)
## Tablas B2B (con descripción)
## Análisis especial: Tablas de asignación de talleres
  - Arquitectura del sistema de asignaciones
  - Descripción de cada tabla
  - Flujo de asignación (diagrama textual)
  - Uso en código
  - Estado de work_team_course_assignments (legacy — no en esquema)
## Análisis de seguridad — Datos sensibles y PII
  - Inventario de tablas con datos sensibles
  - Estado de RLS
  - Recomendaciones de cifrado y acceso
## Análisis de performance — Tablas de alto volumen
  - Inventario de índices
  - Patrones de acceso
  - Candidatas a particionamiento/caché
## Integridad del modelo de datos
  - Tipos USER-DEFINED sin resolver
  - Inconsistencias de timestamps
  - Tablas duplicadas por idioma (DRY)
## Tablas candidatas a deprecar / limpiar
  - course_lessons_en (reemplazable con content_translations)
  - course_lessons_pt (reemplazable con content_translations)
  - lia_messages_tokens_tmp (tabla temporal)
  - work_team_course_assignments (ya migrada, no en esquema)
## Riesgos identificados
## Recomendaciones técnicas
## Mejoras post-auditoría recomendadas
```

### Paso 5 (Opcional) — Generar SQL con comentarios de tablas

**Output**: `database-optimization/02-schema/table-comments.sql`

Script con `COMMENT ON TABLE public.[tabla] IS '...'` para las 113 tablas, describiendo:
- Propósito de la tabla
- Dominio al que pertenece
- Relaciones clave
- Notas de estado (si es legacy)

---

## Checklist de verificación

- [ ] El documento cubre las 113 tablas de `NewBDStructure.sql`
- [ ] Todas las tablas de asignación de talleres están documentadas con detalle
- [ ] Las tablas B2C están claramente separadas de las B2B
- [ ] Se identifican las tablas legacy/inactivas con justificación
- [ ] Se documentan tablas con PII/datos sensibles y estado de protección (§7)
- [ ] Se analizan tablas de alto volumen y patrones de performance (§8)
- [ ] Validación cruzada: discrepancias código (~161 tablas) ↔ esquema (113 tablas) documentadas (§9)
- [ ] Se verifican FKs apuntando a tablas existentes (integridad referencial)
- [ ] Tablas de auditoría/logs evaluadas para retención y observabilidad (§10)
- [ ] Inconsistencias del modelo de datos documentadas (tipos, timestamps, duplicados)
- [ ] El SQL de comentarios es ejecutable en Supabase/PostgreSQL (si se genera)
- [ ] El documento sigue el estilo de documentación del proyecto (español, markdown, estructurado)

---

## Riesgos del proceso de auditoría

- **Discrepancia código↔esquema**: El código referencia ~161 tablas vs 113 en el esquema. Las ~48 tablas adicionales pueden ser del esquema legacy o tablas dinámicas. La auditoría debe documentar esta brecha.
- **Esquema no ejecutable**: `NewBDStructure.sql` es solo referencia; el orden de constraints puede no ser válido para ejecución directa.
- **Tablas sin uso detectado**: Algunas tablas del esquema podrían no tener referencias en código actual — requiere validación cuidadosa antes de marcarlas como "inactivas".
- **Datos sensibles expuestos**: Tokens OAuth almacenados en texto plano son un riesgo real; la auditoría debe señalar esto de forma explícita.

---

## Notas adicionales

- Los componentes del git status (`ActivityModal`, `MaterialModal`, `QuizBuilder`, `QuizImportModal`) son de gestión de **contenido de lecciones**, no de asignaciones — no son el foco de este análisis
- La tabla `work_team_course_assignments` fue reemplazada por el sistema jerárquico en enero 2026 y **no aparece** en `NewBDStructure.sql`
- El esquema `NewBDStructure.sql` tiene la advertencia de que no es ejecutable directamente (orden de constraints puede no ser válido)
- Toda la documentación se escribe en **español**
