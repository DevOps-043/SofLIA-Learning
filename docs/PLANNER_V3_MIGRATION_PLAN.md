# Planner V3 – Plan de Migración Seguro (Safe Rollout)

## 1. Objetivo

Evolucionar el módulo **Study Planner** hacia un **Planner B2B de Cumplimiento** basado en:

- Motor determinista (Planner Core)
- Capa de políticas versionadas (Policy Layer – RH)
- Separación clara entre cumplimiento y calendarización
- Multi-tenant robusto
- Auditabilidad enterprise-grade
- Rollout seguro sin downtime

La migración seguirá el patrón:

> **Expand → Migrate → Switch → Contract**

---

# 2. Estado Actual (Resumen)

## Confirmado

- `organization_course_assignments` ya modela asignaciones por usuario/curso.
- `hierarchy_course_assignments` permite asignaciones masivas.
- `study_plans` y `study_sessions` están orientados a calendario.
- `audit_logs` existe pero no es tenant-aware.
- El sistema es multi-tenant por `organization_id`.

## Problema actual

- No hay separación explícita entre:
  - Cumplimiento (obligación)
  - Scheduling (sesiones)

- No existe policy versionada.
- No hay soft vs hard due date.
- No hay compliance state formal.
- Auditoría no especializada.

---

# 3. Arquitectura Objetivo (V3)

## 3.1 Dominio

```
Organization
 ├── Policy
 │     └── PolicyVersion
 ├── LearningObligation (organization_course_assignments extendido)
 │     └── AuditLog
 └── SuggestedSchedule (opcional)
```

## 3.2 Principios

- La obligación es la fuente de verdad.
- Las sesiones son opcionales.
- Las políticas son versionadas e inmutables.
- Toda entidad crítica tiene organization_id NOT NULL.
- Todo cambio relevante es auditable.

---

# 4. Nuevas Entidades

## 4.1 planner_policies

Policy base por organización.

## 4.2 planner_policy_versions

Versiones inmutables con reglas JSONB.

## 4.3 planner_policy_scopes

Alcances por región/rol/equipo/nodo.

## 4.4 planner_audit_log

Auditoría específica del subdominio Planner.

## 4.5 Extensión de organization_course_assignments

Agregar:

- hard_due_date
- soft_due_date
- policy_version_id
- grace_period_days
- exempted_at
- exempted_by
- exemption_reason
- source_type
- source_id

---

# 5. Feature Flags

Definir flags por organization_id:

| Flag                         | Propósito                 |
| ---------------------------- | ------------------------- |
| planner_v3_schema_ready      | Migración DB aplicada     |
| planner_v3_write_enabled     | Escritura V3 activa       |
| planner_v3_read_enabled      | Lectura compliance V3     |
| planner_v3_generate_enabled  | Motor determinista activo |
| calendar_optional_enabled    | Calendar no obligatorio   |
| planner_v3_dual_write_legacy | Mantener escritura legacy |

Todos deben poder activarse por tenant.

---

# 6. Plan de Migración por Fases

---

# FASE 0 – Preparación

## Objetivo

Preparar el sistema para migrar sin romper producción.

### Cambios

- Implementar sistema de feature flags.
- Añadir telemetría:
  - % generate-plan success
  - latencia
  - % sessions sin obligation
  - % obligations sin policy

### Criterio Done

- Flags pueden activarse/desactivarse sin redeploy.
- Métricas visibles en dashboard.

---

# FASE 1 – EXPAND (DB Aditivo)

## Objetivo

Agregar estructuras nuevas sin cambiar comportamiento.

### Acciones DB

1. Crear:
   - planner_policies
   - planner_policy_versions
   - planner_policy_scopes
   - planner_audit_log

2. Alterar:
   - organization_course_assignments
   - study_sessions (obligation_id, course_id_uuid)

3. Crear view:
   - v_learning_obligations

4. Crear índices CONCURRENTLY

### No se modifica lógica de negocio.

### Criterio Done

- Aplicación funciona igual que antes.
- Todas las tablas nuevas existen.
- No hay bloqueos prolongados.

---

# FASE 2 – SEED & WRITE COMPATIBLE

## Objetivo

Asegurar que datos nuevos ya sean V3-ready.

### Acciones

- Crear policy default por organización.
- Cuando se cree un assignment:
  - Si planner_v3_write_enabled:
    - Set hard_due_date
    - Set policy_version_id

### Compatibilidad

Legacy sigue funcionando.

### Criterio Done

- Nuevos assignments tienen policy_version_id.

---

# FASE 3 – BACKFILL CONTROLADO

## Objetivo

Migrar datos existentes sin downtime.

### Backfills (por lotes y por tenant)

1. hard_due_date = due_date
2. policy_version_id default
3. study_sessions.course_id_uuid
4. study_sessions.obligation_id (best-effort)

### Reglas

- Batch size limitado (ej: 5k)
- Idempotente
- Métricas por tenant

### Validaciones SQL

- assignments sin hard_due_date
- assignments sin policy_version_id
- sessions sin obligation_id

### Criterio Done

- > 99% assignments con policy
- Sessions correctamente enlazadas (best effort)

---

# FASE 4 – SWITCH READ

## Objetivo

Activar cumplimiento V3 en modo lectura.

### Acciones

- Nuevo endpoint:
  GET /planner/v3/obligations
- UI B2B muestra compliance_state
- planner_v3_read_enabled = true (canary tenants)

### Rollout

1. Staging
2. Tenant interno
3. 5% tenants
4. 25%
5. 100%

### Criterio Done

- Dashboard estable
- Queries con índice < SLA

---

# FASE 5 – SWITCH GENERATION

## Objetivo

Motor determinista reemplaza generación legacy.

### Acciones

- Implementar:
  POST /planner/v3/generate
- Wrapper:
  Si flag activo → V3
  Si no → legacy

### Dual Write (si necesario)

Generar study_sessions como SuggestedSchedule.

### Rollout

Canary users → Canary tenant → % progresivo.

### Kill Switch

Desactivar planner_v3_generate_enabled.

---

# FASE 6 – Calendar Optional

## Objetivo

Eliminar dependencia obligatoria del calendario.

### Cambios

- calendar_optional_enabled
- Scheduling sugerido por policy sin sync externo

### Resultado

Sistema usable en empresas con IT restrictivo.

---

# FASE 7 – CONTRACT

## Objetivo

Deprecar dependencias legacy.

### Acciones

- study_plans.course_ids deja de ser autoridad
- course_id text en sessions queda deprecated
- evaluar eliminar dependencias legacy en generación

No eliminar columnas inmediatamente.
Esperar 2–3 releases estables.

---

# 7. Rollback Strategy

## DB

No rollback estructural.
Todo es aditivo.

## Aplicación

Apagar flags:

- planner_v3_generate_enabled
- planner_v3_read_enabled

Sistema vuelve a comportamiento legacy.

---

# 8. Runbook Operativo de Despliegue

1. Deploy DB (Fase 1)
2. Deploy app con flags OFF
3. Seed policies
4. Ejecutar backfills
5. Validar métricas
6. Activar READ en canary
7. Activar GENERATE en canary
8. Expandir rollout
9. Contract gradual

---

# 9. Checklist Técnico

## Base de Datos

- [ ] Índices por organization_id
- [ ] FK correctamente definidas
- [ ] No columnas nullable críticas
- [ ] View compilando

## Backend

- [ ] Motor determinista testeado
- [ ] Policy resolution determinista
- [ ] Audit log funcionando

## QA Casos Críticos

- Usuario no cumple plazo
- Replaneación
- Extensión manual RH
- Exención
- Múltiples cursos simultáneos
- Cambio de policy activa
- Cambio de jerarquía

---

# 10. Sugerencias Estratégicas para el Sistema

## 10.1 No persistir compliance_state (al inicio)

Derivarlo vía view. Materializar solo si escala lo exige.

## 10.2 No forzar sesiones

Compliance ≠ Calendar.

## 10.3 Policy JSONB con validación backend

Evitar lógica distribuida en DB.

## 10.4 Índices compuestos obligatorios

(organization_id, user_id)
(organization_id, hard_due_date)

## 10.5 Telemetría desde el día 1

Sin métricas, no hay rollout seguro.

---

# 11. Resultado Final Esperado

## RH controla:

- Políticas
- Versiones
- Excepciones
- Plazos
- Auditoría

## Usuario ve:

- Qué debe
- Cuándo vence
- Estado claro
- Sugerencia opcional de agenda

## Sistema genera:

- Obligaciones deterministas
- Estado de cumplimiento auditado
- Scheduling desacoplado

---

# 12. Nivel de Riesgo Global

| Área          | Riesgo | Mitigación           |
| ------------- | ------ | -------------------- |
| Migración DB  | Bajo   | Aditiva              |
| Backfill      | Medio  | Batch + métricas     |
| Generación V3 | Medio  | Canary + kill switch |
| Reporting     | Bajo   | Índices              |

---

# 13. Conclusión

La migración es:

- Evolutiva
- Reversible por flags
- Sin downtime
- Compatible con producción
- Escalable enterprise

El sistema final deja de ser un “calendar planner” y se convierte en un **Compliance Planning Engine B2B audit-ready**.
