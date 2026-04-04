# Revisión: Plan de Auditoría BD vs `prompt_maestro.md`

**Fecha de Revisión:** 2026-03-31  
**Documentos evaluados:**
- [plan-auditoria-bd-2026-03-31.md](file:///d:/Pulse%20Hub/SofLIA-Learning/database-optimization/03-documentation/plan-auditoria-bd-2026-03-31.md)
- [prompt_maestro.md](file:///d:/Pulse%20Hub/SofLIA-Learning/prompt_maestro.md) (fuente de verdad)
- [NewBDStructure.sql](file:///d:/Pulse%20Hub/SofLIA-Learning/database-optimization/02-schema/NewBDStructure.sql) (esquema real)

---

## Veredicto General

El plan de auditoría es **sólido en estructura y alcance**, pero tiene **gaps significativos cuando se evalúa contra los criterios del `prompt_maestro.md`**. El plan está bien orientado hacia la documentación, pero le falta profundidad en seguridad, performance, escalabilidad, pruebas y observabilidad — todas áreas explícitamente mandatorias en el prompt maestro.

---

## ✅ Lo que está BIEN (alineado con `prompt_maestro.md`)

| Criterio del Prompt Maestro | Evaluación |
|---|---|
| **§11 - Documentación clara** | ✅ El plan propone documentación estructurada, en español, con output claro |
| **§5 - Modela entidades con nombres claros** | ✅ La clasificación por dominio/contexto/estado es correcta |
| **§4 - Separación de responsabilidades** | ✅ El plan separa análisis, documentación y SQL en pasos claros |
| **§1 - Correctitud funcional** | ✅ Los hallazgos clave son verificados y correctos (ver sección Factual abajo) |
| **§12 - Manejo de cambios** | ✅ Identifica correctamente tablas legacy y flujo de migración |

---

## ⚠️ Verificación Factual del Plan

### Conteo de tablas: ✅ Correcto
> El plan dice **113 tablas** y **1,987 líneas**.

**Verificado**: El esquema `NewBDStructure.sql` tiene **113 tablas** (1,988 líneas, diferencia de 1 por la línea final).

> [!NOTE]
> Diferencia mínima: el plan dice 1,987 líneas; el archivo real tiene 1,988. No es crítico, pero debe corregirse para precisión.

### Tabla `work_team_course_assignments`: ✅ Correcto
> El plan indica que es **legacy** y fue migrada en `20260111_migrate_work_team_assignments.sql`.

**Verificado**: La migración existe en `supabase/migrations/20260111_migrate_work_team_assignments.sql`. Sin embargo, esta tabla **NO aparece en `NewBDStructure.sql`** (las 113 tablas no la incluyen), lo cual es consistente con su estado legacy/migrado.

> [!IMPORTANT]
> El plan lista `work_team_course_assignments` en la tabla de asignaciones como si estuviera en el esquema actual, pero no lo está. Debe clarificarse que esta tabla vive **solo en la migración** y no en el esquema vigente.

### Archivos referenciados: ⚠️ Parcialmente correcto

| Archivo en el plan | ¿Existe? | Nota |
|---|---|---|
| `database-optimization/02-schema/NewBDStructure.sql` | ✅ | |
| `supabase/migrations/20260111_hierarchy_course_assignments.sql` | ✅ | |
| `supabase/migrations/20260111_hierarchy_assignment_helpers.sql` | ✅ | |
| `supabase/migrations/20260111_migrate_work_team_assignments.sql` | ✅ | |
| `apps/web/src/app/api/business/hierarchy/courses/assign/route.ts` | ✅ | |
| `apps/web/src/features/admin/services/adminWorkshops.service.ts` | ✅ | |

> [!WARNING]
> **Archivo faltante en el plan**: Existe también una ruta con `[orgSlug]`:
> `apps/web/src/app/api/[orgSlug]/business/hierarchy/courses/assign/route.ts`  
> Y la ruta de `assignments`:
> `apps/web/src/app/api/[orgSlug]/business/hierarchy/courses/assignments/route.ts`
> 
> El plan solo menciona la ruta sin `[orgSlug]`. Ambas son relevantes y deben documentarse para evitar ambigüedad sobre cuál es la ruta canónica.

### Tablas de asignación: ⚠️ Imprecisión en la tabla

El plan lista 6 tablas de asignación:

| Tabla en el plan | ¿Está en `NewBDStructure.sql`? |
|---|---|
| `hierarchy_course_assignments` | ✅ (línea 501) |
| `region_course_assignments` | ✅ (línea 1329) |
| `zone_course_assignments` | ✅ (línea 1981) |
| `team_course_assignments` | ✅ (línea 1601) |
| `organization_course_assignments` | ✅ (línea 886) — pero NO es "asignaciones individuales por usuario" como dice el plan; es la tabla central de asignaciones org→user |
| `work_team_course_assignments` | ❌ No está en el esquema actual |

> [!CAUTION]
> La descripción de `organization_course_assignments` como "Asignaciones individuales por usuario" es **engañosa**. Es la tabla central que materializa asignaciones de cursos a usuarios específicos dentro de una organización, con campos de compliance (`hard_due_date`, `soft_due_date`, `policy_version_id`, `compliance_mode`, `exemptions`, etc.). Tiene 30+ columnas y es mucho más compleja que un simple pivot de asignación.

---

## ❌ Gaps vs `prompt_maestro.md` — Lo que FALTA

### Gap 1: Seguridad (§7 — Obligatorio)

El prompt maestro exige evaluación de seguridad en **cada entrega**. El plan NO incluye:

- [ ] Evaluación de RLS (Row Level Security) por tabla
- [ ] Identificación de tablas con PII (datos personales protegidos)
- [ ] Revisión de tokens/secretos almacenados en BD (ej: `calendar_connections.access_token`, `calendar_connections.refresh_token`, `oauth_accounts.access_token`, `refresh_tokens.token_hash`)
- [ ] Verificación de cifrado en reposo para datos sensibles
- [ ] Evaluación de permisos de acceso por tabla

> **Tablas con datos sensibles detectadas:**
> - `calendar_connections` — tokens de acceso en texto plano
> - `calendar_integrations` — tokens OAuth
> - `oauth_accounts` — tokens de terceros
> - `refresh_tokens` — hashes de tokens de sesión
> - `payment_methods` — `encrypted_data` (al menos usa jsonb encriptado)
> - `user_session` — JWTs
> - `password_reset_tokens` — tokens de recuperación

**Recomendación**: Agregar un **Paso 2.5** al plan: "Clasificación de seguridad por tabla" con inventario de PII y datos sensibles.

---

### Gap 2: Performance y Escalabilidad (§8 — Obligatorio)

El prompt maestro exige evaluación de performance para **100,000 usuarios simultáneos**. El plan NO incluye:

- [ ] Inventario de índices existentes
- [ ] Identificación de tablas de alto volumen (ej: `lia_messages`, `lesson_tracking`, `user_activity_log`, `activity_logs`)
- [ ] Análisis de patrones read/write por tabla
- [ ] Identificación de candidatas a particionamiento
- [ ] Evaluación de posibles N+1 queries en tablas con muchas FKs
- [ ] Análisis de tablas que necesitan caché

**Recomendación**: Agregar un **Paso 3.5**: "Análisis de performance — tablas de alto volumen y patrones de acceso". 

---

### Gap 3: QA y Validación (§9 — Obligatorio)

El prompt maestro dice: *"No entregues cambios 'a ciegas'"*. El plan tiene un checklist, pero NO incluye:

- [ ] Validación cruzada con el código actual (los ~161 tablas referenciadas en código vs las 113 del esquema)
- [ ] Verificación de integridad referencial (¿todas las FKs apuntan a tablas que existen?)
- [ ] Detección de tablas huérfanas (sin referencia en código)
- [ ] Comparación con esquema Supabase live (si es posible)

**Recomendación**: Agregar verificación explícita en la checklist de que las discrepancias código↔esquema están documentadas.

---

### Gap 4: Observabilidad (§10)

No se menciona:

- [ ] Tablas de auditoría existentes (`audit_logs`, `planner_audit_log`, `user_activity_log`) y si cubren todo lo necesario
- [ ] Estrategia de retención de datos para tablas de log de alto volumen
- [ ] Tablas con `created_at` pero sin `updated_at` (inconsistencia de trazabilidad)

---

### Gap 5: Integridad del Modelo de Datos (§5)

El prompt maestro exige evaluación de:

- [ ] Tipos de datos correctos y precisos — hay columnas `USER-DEFINED` sin resolver: `organization_nodes.path`, `tools.category`, `tools.status`, `user_tools.category`
- [ ] Consistencia de tipos — mezcla de `timestamp with time zone` y `timestamp without time zone` sin justificación
- [ ] Tablas duplicadas por idioma (`course_lessons`, `course_lessons_en`, `course_lessons_pt`) — esto viola el principio DRY del prompt maestro. El plan debería señalar si `content_translations` es la estrategia correcta y estas tablas _en/_pt son legacy
- [ ] Columnas con `CHECK` constraints inconsistentes

> [!WARNING]
> Las tablas `course_lessons_en` y `course_lessons_pt` son réplicas exactas de `course_lessons` para otros idiomas. Existiendo la tabla `content_translations`, estas son candidatas claras a deprecación. El plan debería señalar esto explícitamente en "Tablas candidatas a deprecar/limpiar".

---

### Gap 6: Estilo de respuesta (§13)

El prompt maestro exige que cada entrega siga 6 puntos:

1. Entendimiento del objetivo ✅ (el plan lo tiene)
2. Diagnóstico técnico ⚠️ (parcial — falta riesgos)
3. Plan de implementación ✅ 
4. Implementación propuesta ✅ 
5. **Riesgos y validaciones** ❌ — no hay sección de riesgos
6. **Mejoras adicionales recomendadas** ❌ — no hay mejoras post-auditoría

**Recomendación**: Agregar secciones de "Riesgos del proceso de auditoría" y "Mejoras recomendadas post-auditoría".

---

## 📋 Correcciones Concretas Recomendadas

### Para el plan actual

```diff
 **Fecha:** 2026-03-31
 **Estado:** Aprobado — pendiente ejecución
 **Responsable:** Claude Code (Staff Engineer persona via prompt_maestro.md)
+**Líneas del esquema:** 1,988 (corregido de 1,987)

 ### Sobre el esquema
-- **`NewBDStructure.sql`**: 113 tablas definidas, 1,987 líneas, **sin ningún `COMMENT ON TABLE`**
+- **`NewBDStructure.sql`**: 113 tablas definidas, 1,988 líneas, **sin ningún `COMMENT ON TABLE`**
```

### Para la tabla de asignaciones

```diff
 | `organization_course_assignments` | Asignaciones individuales por usuario |
+| `organization_course_assignments` | Tabla central de asignaciones org→user→course con campos de compliance (30+ columnas) |
 | `work_team_course_assignments` | **Legacy** — migrada en `20260111_migrate_work_team_assignments.sql` |
+| `work_team_course_assignments` | **Legacy** — NO está en el esquema actual; solo en la migración `20260111_migrate_work_team_assignments.sql` |
```

### Pasos nuevos recomendados

```diff
 ### Paso 2 — Clasificar cada tabla (4 dimensiones)
 ...
 
+### Paso 2.5 — Análisis de seguridad por tabla
+Para cada tabla, evaluar:
+- **PII/Datos sensibles**: ¿Contiene datos personales, tokens, credenciales?
+- **RLS**: ¿Tiene políticas de Row Level Security activas?
+- **Cifrado**: ¿Los datos sensibles están cifrados en reposo?
+- **Acceso**: ¿Quién puede leer/escribir esta tabla?
+
 ### Paso 3 — Análisis profundo de tablas de asignación de talleres
 ...
 
+### Paso 3.5 — Análisis de performance y escalabilidad
+Evaluar para cada tabla de alto volumen:
+- **Índices existentes** y si son suficientes
+- **Patrones de acceso** (read-heavy vs write-heavy)
+- **Volumen esperado** a 100K usuarios
+- **Candidatas a particionamiento** (ej: tablas de logs temporales)
+- **Tablas con potencial de N+1** por exceso de FKs
+
 ### Paso 4 — Generar documento de documentación técnica
```

### Para la estructura del output

```diff
 ## Tablas candidatas a deprecar / limpiar
+  - course_lessons_en (reemplazable con content_translations)
+  - course_lessons_pt (reemplazable con content_translations)
+  - lia_messages_tokens_tmp (tabla temporal)
+  - work_team_course_assignments (ya migrada)
 ## Recomendaciones técnicas
+## Análisis de seguridad (datos sensibles y PII)
+## Análisis de performance (tablas de alto volumen)
+## Riesgos identificados
+## Mejoras post-auditoría recomendadas
```

---

## Archivos adicionales a incluir en la auditoría

El plan no menciona estos archivos/rutas críticos descubiertos:

| Archivo | Relevancia |
|---|---|
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/courses/assign/route.ts` | API de asignación con orgSlug dinámico (ruta B2B) |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/courses/assignments/route.ts` | Listado de asignaciones con orgSlug |
| `apps/web/src/app/api/business/hierarchy/courses/assignments/[id]/route.ts` | CRUD individual de asignación |
| `apps/web/src/features/admin/hooks/useAdminWorkshops.ts` | Hook React que consume el servicio de workshops |
| `supabase/migrations/20260117_dynamic_hierarchy_refactor.sql` | Refactor del sistema jerárquico posterior a las tablas de asignación |

---

## Resumen Ejecutivo

| Dimensión | Estado | Acción requerida |
|---|---|---|
| Estructura del plan | ✅ Buena | Ninguna |
| Factual (tablas, archivos) | ⚠️ Correcciones menores | Corregir líneas, descripción de `organization_course_assignments`, clarificar `work_team_course_assignments` |
| Seguridad (§7) | ❌ No cubierta | Agregar paso 2.5 |
| Performance (§8) | ❌ No cubierta | Agregar paso 3.5 |
| QA/Validación (§9) | ⚠️ Parcial | Expandir checklist |
| Observabilidad (§10) | ❌ No cubierta | Incluir en output |
| Integridad del modelo (§5) | ⚠️ Parcial | Documentar tipos USER-DEFINED, tablas duplicadas de idioma |
| Documentación (§11) | ✅ Bien | Agregar secciones de riesgos y mejoras |

**Pregunta para ti**: ¿Quieres que aplique estas correcciones directamente al plan de auditoría, o prefieres revisarlas primero y decidir cuáles incorporar?
