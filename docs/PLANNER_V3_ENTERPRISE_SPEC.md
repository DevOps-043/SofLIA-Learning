# PLANNER_V3_ENTERPRISE_SPEC.md

# 1. Visión del Sistema

## Objetivo

Convertir el Study Planner en un **Compliance Planning Engine B2B**:

- Determinista
- Gobernado por políticas RH versionadas
- Multi-tenant seguro
- Audit-ready
- Escalable
- Desacoplado del calendario

---

# 2. Modelo de Dominio (DDD)

## 2.1 Agregados Principales

### Organization

- id
- name
- timezone
- compliance_mode

---

### Policy (Aggregate Root)

- id
- organization_id
- name
- active_version_id
- created_at
- updated_at

---

### PolicyVersion (Inmutable)

- id
- policy_id
- organization_id
- version
- status (draft | active | retired)
- rules JSONB
- effective_from
- effective_to
- created_by
- created_at

---

### LearningObligation

(Extensión de organization_course_assignments)

- id
- organization_id
- user_id
- course_id
- start_date
- hard_due_date
- soft_due_date
- grace_period_days
- policy_version_id
- compliance_mode
- status
- completed_at
- exempted_at
- exempted_by
- exemption_reason
- source_type
- source_id
- recurrence_type
- recurrence_interval
- next_cycle_at
- obligation_generation_hash
- policy_snapshot JSONB
- created_at
- updated_at

---

### PlannerAuditLog

- id
- organization_id
- actor_user_id
- action
- entity_type
- entity_id
- reason
- before JSONB
- after JSONB
- created_at

---

# 3. Compliance State (Derivado)

Nunca editable manualmente.

## Reglas:

| Estado    | Condición                          |
| --------- | ---------------------------------- |
| completed | completed_at NOT NULL              |
| waived    | exempted_at NOT NULL               |
| overdue   | now > hard_due_date + grace_period |
| due_soon  | now > soft_due_date                |
| on_track  | default                            |

---

# 4. Gobernanza (OBLIGATORIO)

## 4.1 Permisos

Definir roles:

- org_admin
- hr_manager
- compliance_officer
- system

### Reglas:

| Acción             | Requiere                    |
| ------------------ | --------------------------- |
| Crear policy       | org_admin                   |
| Publicar version   | org_admin                   |
| Extender deadline  | hr_manager + reason         |
| Exentar obligación | compliance_officer + reason |
| Recalcular masivo  | org_admin                   |

---

# 5. Estrategia de Recalculo

## 5.1 Definir Modo por Organización

`policy_application_mode`

- frozen_on_assignment
- dynamic_recalculation
- recalculation_with_audit

## Recomendación MVP

frozen_on_assignment

Cada obligación guarda:

- policy_version_id
- policy_snapshot
- obligation_generation_hash

---

# 6. Recurrencia (OBLIGACIONES CÍCLICAS)

## Campos:

- recurrence_type
  - none
  - yearly
  - quarterly
  - custom

- recurrence_interval (int)
- next_cycle_at

## Regla:

Al completarse una obligación recurrente:

1. Se crea nueva obligación
2. Se calcula nuevo hard_due_date
3. Se guarda referencia a obligation anterior

---

# 7. Motor Determinista (Planner Core)

## Input

- organization_id
- user_id
- obligations[]
- policy_version
- user_preferences
- org_defaults

## Output

- LearnerPlan
- SuggestedSchedule (opcional)

## Reglas

- Sin IA en cálculo crítico
- Sin aleatoriedad
- Resultado reproducible

---

# 8. Integración con Evidencia

## completion_source

- certificate
- enrollment_percentage
- lesson_tracking
- manual_override

Debe definirse por policy.

---

# 9. Seguridad

## 9.1 Prohibiciones

- No update directo a compliance_state
- No update directo a hard_due_date sin audit
- No update directo a policy_version_id

## 9.2 Enforcements

- Todas las actualizaciones críticas pasan por backend
- Todas generan planner_audit_log
- organization_id NOT NULL en todas las tablas nuevas

---

# 10. Multi-Tenant Hardening

## Obligatorio

- Índices compuestos:
  - (organization_id, user_id)
  - (organization_id, hard_due_date)

- Validar que todos los joins filtren por organization_id

---

# 11. Observabilidad

## Métricas mínimas

- obligations_total
- obligations_overdue
- obligations_due_soon
- completion_rate
- avg_days_to_completion
- exemption_rate
- policy_change_recalculation_count

---

# 12. SLA y Escalabilidad

## Objetivos

| Endpoint            | SLA     |
| ------------------- | ------- |
| GET obligations     | < 200ms |
| Generate plan       | < 500ms |
| Recalculation batch | async   |

Si tenant > 100k obligaciones:

- Evaluar materialized view
- Evaluar denormalización parcial

---

# 13. API Versioning

Mantener:

/api/planner/v1/_
/api/planner/v3/_

No romper contratos existentes.

---

# 14. Testing Obligatorio

## Casos Críticos

- Usuario entra en overdue
- Cambio de policy activa
- Extensión manual
- Exención
- Recurrencia anual
- Recalculo masivo
- Rollback de feature flag

---

# 15. Estrategia de Rollout

## Expand → Migrate → Switch → Contract

Con feature flags:

- planner_v3_read_enabled
- planner_v3_generate_enabled
- planner_v3_write_enabled
- calendar_optional_enabled

Kill switch siempre disponible.

---

# 16. Riesgos Técnicos

| Riesgo                | Mitigación                      |
| --------------------- | ------------------------------- |
| Drift de policy       | snapshot + hash                 |
| Deadlocks en backfill | batch + concurrencia controlada |
| Reporting lento       | índices + materialización       |
| Fuga multi-tenant     | constraint + revisiones SQL     |

---

# 17. Definiciones No Negociables

- Obligación es fuente de verdad.
- Compliance state es derivado.
- Policy es versionada e inmutable.
- Toda excepción requiere reason.
- Todo cambio relevante es auditable.
- Calendar es opcional.

---

# 18. Resultado Final Esperado

El sistema deja de ser:

> “Un generador de sesiones con calendario”

Y pasa a ser:

> “Un Motor de Cumplimiento Empresarial Audit-Ready con Planificación Determinista”
