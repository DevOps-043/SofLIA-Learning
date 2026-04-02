# CODEX TASK — Testing y QA

**Peso en TDI:** 15% | **Deuda residual actual:** ~25%
**Fecha de corte:** 2026-04-02 (worktree real)

---

## Estado real medido en worktree

```
Total test cases (web): 1,845
  - Baseline histórico documentado: 1,829 pasando / 16 fallando
  - Estado focalizado 2026-04-02: BLOQUE 0 corregido (10 archivos / 259 tests verdes)
Test files (web): 192
Test cases (API): 37  — todos verdes
Test files (API): 7
```

---

## PRIORIDAD MÁXIMA — ampliar cobertura después de cerrar los rojos documentados

### BLOQUE 0 — Tests fallando ahora mismo

Estado actualizado al 2026-04-02:

- Los **16 fallos documentados en 10 archivos ya no reproducen** en la verificación focalizada.
- Resultado confirmado: **10 archivos / 259 tests verdes**.
- Pendiente real: ejecutar una corrida global completa para recalcular el pass rate total del workspace.

**Archivos con tests fallando:**

```
PASS  src/features/auth/components/OrganizationAuth/__tests__/useOrganizationRegisterForm.test.ts
PASS  src/features/study-planner/services/__tests__/plan-adjustment.service.test.ts
PASS  src/features/study-planner/components/hooks/__tests__/useStudyPlannerCalendarLogic.test.ts
PASS  src/lib/holidays/__tests__/holidays.service.test.ts
PASS  src/lib/sanitize/__tests__/enhanced-dom-purify.test.ts
PASS  src/lib/__tests__/slug.test.ts
PASS  src/lib/__tests__/upload-validation.test.ts
PASS  src/features/business-panel/services/__tests__/subscription.utils.test.ts
PASS  src/features/study-planner/services/__tests__/validation.service.test.ts
PASS  src/features/courses/components/learn/activities/__tests__/utils.test.ts
```

**Qué se validó en esta corrección:**
1. Hooks con mocks hoisted y timers compatibles con el runner
2. Tests afectados por parsing UTC implícito de `new Date('YYYY-MM-DD')`
3. Expectativas obsoletas frente a defaults actuales (fallback MX, slug normalizado)
4. Bugs reales corregidos en `sanitizePlainText`, `generateSafeFileName` y `extractPromptList`
5. Corrida focalizada verde con `vitest run`

```bash
# Correr solo los tests fallando
cd apps/web && npx vitest run --reporter=verbose \
  src/features/auth/components/OrganizationAuth/__tests__/useOrganizationRegisterForm.test.ts \
  src/features/study-planner/services/__tests__/plan-adjustment.service.test.ts \
  src/features/study-planner/components/hooks/__tests__/useStudyPlannerCalendarLogic.test.ts \
  src/lib/holidays/__tests__/holidays.service.test.ts \
  src/lib/sanitize/__tests__/enhanced-dom-purify.test.ts \
  src/lib/__tests__/slug.test.ts \
  src/lib/__tests__/upload-validation.test.ts \
  src/features/business-panel/services/__tests__/subscription.utils.test.ts \
  src/features/study-planner/services/__tests__/validation.service.test.ts \
  src/features/courses/components/learn/activities/__tests__/utils.test.ts
```

---

## Ya resuelto — NO tocar o extender

Tests verdes existentes (selección de las suites más relevantes):

| Suite | Tests aprox. | Área |
|---|---|---|
| `calendar-events-oauth.service.test.ts` | 12 | Study Planner Calendar |
| `calendar-events-provider.service.test.ts` | 11 | Study Planner Calendar |
| `calendar-events-sync.service.test.ts` | 5 | Study Planner Calendar |
| `calendar-events.db.test.ts` | 11 | Study Planner Calendar |
| `adminUsers.service.test.ts` | 9 | Admin Users facade |
| `admin-users.query.service.test.ts` | 7 | Admin Users queries |
| `notification.service.test.ts` | 13 | Notifications facade |
| `notification.creation.service.test.ts` | 6 | Notifications creation |
| `notification.actions.service.test.ts` | 9 | Notifications actions |
| `useAdminWorkshopsPageLogic.test.ts` | 15 | Admin Workshops hook |
| `planner-slot-analysis.service.test.ts` | 20 | Study Planner slots |
| `planner-slot-selection.service.test.ts` | 21 | Study Planner slots |
| `lesson-time.service.test.ts` | 16 | Courses |
| `planner-guardrails.service.test.ts` | 30+ | Study Planner |
| `lesson-distribution.service.test.ts` | 25+ | Study Planner |
| `apps/api` middleware + notifications | 37 | Backend Express |

**Patrón establecido** (seguir exactamente):

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

function makeX(overrides = {}) {
  return { ...defaults, ...overrides }
}

describe('ServiceName', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does X when Y', async () => {
    // arrange — act — assert
  })
})
```

---

## Pendiente — brechas de cobertura nuevas

### BLOQUE 1 — Módulos sensibles: mantener y ampliar cobertura real

**TAREA 1A — `lib/rrweb/session-recorder.ts`**

Estado actual:

```
lib/rrweb/__tests__/
├── session-recorder-filters.test.ts
├── session-recorder-privacy.test.ts
├── session-recorder.options.test.ts
└── session-recorder.utils.test.ts
```

Las suites críticas ya existen. Lo pendiente ya no es “crearlas”, sino mantener cobertura
cuando cambien filtros de privacidad, masking o configuración del recorder.

Casos no negociables a conservar:
```typescript
describe('sensitiveInputFilter', () => {
  it('masks value of input[type=password]')
  it('masks value of input[name*=credit]')
  it('masks value of input[name*=card]')
  it('does NOT mask regular text inputs')
  it('respects data-no-record attribute')
  it('masks inputs inside forms with class sensitive')
})
```

**TAREA 1B — `features/auth/actions/invitation/`**

Estado actual:

```
features/auth/actions/invitation/__tests__/
├── invitation-validation.service.test.ts
├── invitation-redemption.service.test.ts
├── invitation-consumption.service.test.ts
├── invitation.action.test.ts
├── invitation.shared.test.ts
└── utils.test.ts
```

La deuda aquí ya no es ausencia de suite, sino ampliar invariantes de repositorio/consumo
si cambia la lógica transaccional.

Casos mínimos que deben seguir cubiertos:
```typescript
describe('validateInvitationToken', () => {
  it('returns valid=true for active invitation within expiry')
  it('returns valid=false for expired invitation')
  it('returns valid=false for already redeemed invitation')
  it('returns valid=false for invitation at max uses')
  it('throws when token does not exist')
})
```

---

### BLOQUE 2 — Hooks y agregadores con cobertura aún perfectible

**TAREA 2A — Completar `useStudyPlannerCalendarLogic.test.ts`**

Estado actual:

- Suite original verde
- Suite de comportamiento agregada para navegación, edición, borrado y save error

Siguiente expansión útil:

```typescript
describe('useStudyPlannerCalendarLogic', () => {
  it('refreshes events manually and resets isRefreshing')
  it('closes the modal after a successful save')
  it('shows normalized mutation errors from calendar providers')
  it('keeps selection consistent when refreshTrigger changes')
})
```

**TAREA 2B — Tests para `features/business-panel/services/analytics/analytics-response.service.ts`**

Estado actual:

```
features/business-panel/services/analytics/__tests__/
├── analytics-response.service.test.ts
├── analytics-identity.service.test.ts
├── engagement-metrics.service.test.ts
└── global-analytics-response.service.test.ts
```

La suite principal ya existe. Lo pendiente es ampliar edge cases cuando cambien builders
o contratos de agregación.

```typescript
describe('buildAnalyticsResponse', () => {
  it('calculates active users correctly for date range')
  it('aggregates by team when teams exist')
  it('handles org with no enrollments')
  it('calculates completion rate correctly')
  it('returns zeroed metrics when no data')
})
```

---

### BLOQUE 3 — Servicios grandes aún sin suite dedicada suficiente

Los siguientes servicios fueron modularizados pero aún carecen de tests.
Crear tests después de que cada uno sea modularizado:

| Servicio | Líneas actuales | Tests pendientes |
|---|---|---|
| `course-analysis.service.ts` | 428 | `course-analysis.service.test.ts` |
| `adminLessons.service.ts` | 675 | `admin-lessons.service.test.ts` |
| `useStudyPlannerMessageHandler.ts` | 676 | `useStudyPlannerMessageHandler.test.ts` |

---

### BLOQUE 4 — Backend Express: ampliar cobertura restante

Los 37 tests base cubrían infraestructura + notificaciones; el dominio `admin/users`
ya tiene suites propias. El siguiente hueco real está en integración/repository o en
los próximos dominios que se abran.

```
apps/api/src/features/admin/users/__tests__/
├── admin-users.controller.test.ts
└── admin-users.service.test.ts
```

---

## Setup de supabase mock (patrón estándar del proyecto)

```typescript
function makeSupabase({
  data = null,
  error = null,
}: { data?: unknown; error?: unknown } = {}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  return { from: vi.fn().mockReturnValue(chain), chain }
}
```

## Reglas para Codex en este módulo

1. **BLOQUE 0 ya está cerrado** — no reabrirlo salvo que reaparezca en corrida global.
2. **Seguir el patrón establecido** — `vi.mock` antes de imports, `beforeEach` con `vi.clearAllMocks()`.
3. **No mockear lo que estás probando.** Solo mockear dependencias externas.
4. **Cada suite debe cubrir:** happy path, edge cases (vacío, null, error).
5. **Para hooks: usar `renderHook` + `act`** de `@testing-library/react`.
6. **Para funciones puras:** no mock — solo llamar la función y verificar el resultado.
7. **Mínimo 5 tests por suite** para archivos que justifican su propia suite.

## Verificación

```bash
# Correr todos los tests — debe ser 0 failing
cd apps/web && npx vitest run --reporter=verbose

# Correr solo los que estaban fallando
cd apps/web && npx vitest run --reporter=verbose \
  src/features/study-planner/services/__tests__/plan-adjustment.service.test.ts \
  src/lib/holidays/__tests__/holidays.service.test.ts

# Backend
cd apps/api && npx vitest run --reporter=verbose
```

## Métrica de éxito

- **16 tests documentados → 0** en verificación focalizada
- Total tests web: de 1,845 a **2,000+** (nuevas suites para módulos sin cobertura)
- `session-recorder-filters.test.ts` existe con tests de privacidad (no negociable)
- `invitation-validation.service.test.ts` existe con tests de validación
- `analytics-response.service.test.ts` existe con tests de agregación
- `apps/api` con tests para cada nuevo dominio implementado
- TDI Testing: de ~25% a ~15%
