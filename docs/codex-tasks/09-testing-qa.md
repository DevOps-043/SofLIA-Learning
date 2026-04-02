# CODEX TASK — Testing y QA

**Peso en TDI:** 15% | **Deuda residual estimada:** ~35-40%
**Fecha de corte:** 2026-04-01
**Estado:** En progreso — ~454 tests, pero cobertura concentrada en servicios
extraídos. Grandes gaps en auth, session recording, business panel y backend.

---

## Lo que ya está hecho (NO tocar o extender)

Tests existentes y verdes (~454 total):

| Suite | Tests | Área |
|---|---|---|
| `calendar-events-oauth.service.test.ts` | 12 | Study Planner - Calendar |
| `calendar-events-provider.service.test.ts` | 11 | Study Planner - Calendar |
| `calendar-events-sync.service.test.ts` | 5 | Study Planner - Calendar |
| `calendar-events.db.test.ts` | 11 | Study Planner - Calendar |
| `adminUsers.service.test.ts` | 9 | Admin - Users facade |
| `admin-users.query.service.test.ts` | 7 | Admin - Users queries |
| `notification.service.test.ts` | 13 | Notifications facade |
| `notification.creation.service.test.ts` | 6 | Notifications creation |
| `notification.actions.service.test.ts` | 9 | Notifications actions |
| `useAdminWorkshopsPageLogic.test.ts` | 15 | Admin - Workshops hook |
| `system-prompt.service.test.ts` | — | AI Chat |
| `planner-slot-analysis.service.test.ts` | 20 | Study Planner |
| `planner-slot-selection.service.test.ts` | 21 | Study Planner |
| `lesson-time.service.test.ts` | 16 | Courses |
| `planner-guardrails.service.test.ts` | 30+ | Study Planner |
| `lesson-distribution.service.test.ts` | 25+ | Study Planner |
| + ~244 tests base del sistema | — | Varios |

**Patrón establecido** (seguir exactamente):
```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock('../supabase-client', () => ({ getServerClient: vi.fn() }))

function makeX(overrides = {}) {
  return { ...defaults, ...overrides }
}

describe('ServiceName', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('does X when Y', async () => {
    // arrange
    // act
    // assert
  })
})
```

---

## Pendiente — brechas críticas de cobertura

### BLOQUE 1 — Módulos sensibles sin ningún test

**TAREA 1A — Tests para `features/auth/actions/invitation.ts` (789 líneas)**

> Este archivo maneja el onboarding de empresas enteras. Sin tests = riesgo de regresión crítico.

Una vez extraído en `invitation/` (ver `01-arquitectura-modularidad.md`), crear:

```
features/auth/actions/invitation/__tests__/
├── invitation-validation.service.test.ts
├── invitation-redemption.service.test.ts
├── invitation-sso.service.test.ts
└── invitation-redirect.service.test.ts
```

Tests obligatorios para `invitation-validation.service.test.ts`:
```typescript
describe('validateInvitationToken', () => {
  it('returns valid=true for active invitation within expiry')
  it('returns valid=false for expired invitation')
  it('returns valid=false for already redeemed invitation')
  it('returns valid=false for invitation at max uses')
  it('throws when token does not exist')
  it('handles bulk invite link vs individual invite')
})
```

Tests obligatorios para `invitation-redemption.service.test.ts`:
```typescript
describe('redeemInvitation', () => {
  it('increments current_uses atomically')
  it('throws when uses would exceed max_uses')
  it('sets redeemed_at timestamp on success')
  it('rolls back if user creation fails')
})
```

**TAREA 1B — Tests para `lib/rrweb/session-recorder.ts`**

Una vez extraído en `lib/rrweb/` (ver `05-seguridad.md`), crear:

```
lib/rrweb/__tests__/
├── session-recorder-filters.test.ts    # CRÍTICO
└── session-recorder-privacy.test.ts
```

Tests de `session-recorder-filters.test.ts` (no negociables):
```typescript
describe('sensitiveInputFilter', () => {
  it('masks value of input[type=password]')
  it('masks value of input[name=*credit*]')
  it('masks value of input[name=*card*]')
  it('does NOT mask regular text inputs')
  it('respects data-no-record attribute')
  it('masks inputs inside forms with class sensitive')
})
```

**TAREA 1C — Tests para `features/study-planner/services/soflia-context.service.ts`**

Una vez extraído en `soflia-context/` (ver `01-arquitectura-modularidad.md`):

```
features/study-planner/services/soflia-context/__tests__/
└── soflia-context.service.test.ts
```

```typescript
describe('buildSofliaContext', () => {
  it('includes active study sessions in context')
  it('includes enrolled courses with progress')
  it('includes study preferences')
  it('handles user with no courses enrolled')
  it('handles user with no study sessions')
  it('truncates context when it exceeds token limit')
})
```

---

### BLOQUE 2 — Hooks con lógica compleja sin tests

**TAREA 2A — `features/study-planner/components/hooks/useStudyPlannerCalendarLogic.ts`**

```
features/study-planner/components/hooks/__tests__/
└── useStudyPlannerCalendarLogic.test.ts
```

```typescript
import { renderHook, act } from '@testing-library/react'

describe('useStudyPlannerCalendarLogic', () => {
  it('initializes with current week view')
  it('navigates to next week on nextWeek()')
  it('navigates to previous week on prevWeek()')
  it('filters events by selected calendar')
  it('opens event modal when event is clicked')
  it('syncs calendar when integration is available')
  it('handles sync error gracefully without crashing')
})
```

**TAREA 2B — `features/business-panel/services/businessUsers.server.service.ts`**

Una vez modularizado:
```
features/business-panel/services/business-users/__tests__/
└── business-users.service.test.ts
```

```typescript
describe('getBusinessUsers', () => {
  it('returns paginated users for org')
  it('applies search filter')
  it('filters by role')
  it('returns empty array when org has no users')
  it('throws when supabase returns error')
})

describe('updateBusinessUserRole', () => {
  it('updates role correctly')
  it('throws when user does not belong to org')
})
```

---

### BLOQUE 3 — Servicios de analytics sin tests

**TAREA 3A — `features/business-panel/services/analytics/analytics-response.service.ts` (694 líneas)**

```
features/business-panel/services/analytics/__tests__/
└── analytics-response.service.test.ts
```

```typescript
describe('buildAnalyticsResponse', () => {
  it('calculates active users correctly for date range')
  it('aggregates by team when teams exist')
  it('handles org with no enrollments')
  it('calculates completion rate correctly')
  it('returns zeroed metrics when no data')
})
```

**TAREA 3B — `features/study-planner/services/course-analysis.service.ts` (668 líneas)**

Una vez modularizado:
```typescript
describe('analyzeCourse', () => {
  it('calculates total duration from lesson durations')
  it('distributes lessons evenly across available days')
  it('respects daily study limit from preferences')
  it('handles course with no lessons')
  it('handles lessons with null duration')
})
```

---

### BLOQUE 4 — Tests de integración de flujos críticos

**TAREA 4A — Flujo de onboarding de empresa**

```
features/auth/__tests__/
└── onboarding-flow.integration.test.ts
```

```typescript
describe('Company onboarding flow', () => {
  it('invitation link → register → redirect to dashboard')
  it('expired invitation → shows error page')
  it('SSO invitation → redirects to provider → completes registration')
})
```

**TAREA 4B — Flujo de notificaciones E2E**

```
features/notifications/__tests__/
└── notifications-flow.integration.test.ts
```

```typescript
describe('Notification lifecycle', () => {
  it('create → appears as unread → mark read → count decrements')
  it('create → archive → not in main list → in archive')
  it('create with duplicate prevention → second creation rejected')
})
```

---

### BLOQUE 5 — Tests para `apps/api` (0 cobertura actualmente)

Una vez implementados los primeros dominios (ver `03-backend-express-api.md`):

**TAREA 5A — Tests de middleware**
```
apps/api/src/core/middleware/__tests__/
├── auth.middleware.test.ts
└── rateLimit.middleware.test.ts
```

**TAREA 5B — Tests de primer dominio (Notificaciones)**
```
apps/api/src/features/notifications/__tests__/
├── notifications.controller.test.ts
└── notifications.service.test.ts
```

---

## Reglas para Codex en este módulo

1. **Seguir el patrón establecido** — `vi.mock` antes de imports, `beforeEach` con `vi.clearAllMocks()`, factory helpers `makeX()`.
2. **Tests del tipo `it('does X when Y')`** — nombre describe input y resultado esperado, no la implementación.
3. **No mockear lo que estás probando.** Solo mockear dependencias externas (Supabase, fetch, logger).
4. **Cada suite debe cubrir:** happy path, edge cases (vacío, null, error), y al menos un caso de error.
5. **Para hooks: usar `renderHook` + `act`** de `@testing-library/react`.
6. **Para funciones puras:** no mock de nada — solo llamar la función y verificar el resultado.
7. **Mínimo 5 tests por suite** para archivos que justifican su propia suite.

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

## Verificación

```bash
# Correr todos los tests
cd apps/web && npx vitest run --reporter=verbose

# Correr suite específica
npx vitest run --reporter=verbose src/features/auth/actions/invitation/
npx vitest run --reporter=verbose src/lib/rrweb/

# Ver cobertura por módulo
npx vitest run --coverage --reporter=verbose src/features/study-planner/
```

## Métrica de éxito

- Total de tests: de ~454 a **600+**
- `invitation.ts` con suite de tests (mínimo 10 tests)
- `session-recorder.ts` con tests de filtrado de datos sensibles (no negociable)
- `businessUsers.server.service.ts` con tests de queries y mutaciones
- 0 módulos >400 líneas sin al menos 1 suite de tests
- `apps/api` con tests para middleware de auth y primer dominio implementado
