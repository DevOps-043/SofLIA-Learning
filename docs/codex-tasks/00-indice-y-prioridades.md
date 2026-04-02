# CODEX — Índice de Tareas de Deuda Técnica

**TDI verificado (worktree actual):** ~24%
**Fecha de corte:** 2026-04-02
**Objetivo de esta tanda:** Bajar de ~24% a ~16-18%

---

## Estado real medido en worktree

| Métrica | Valor actual |
|---|---|
| Archivos ≥700 líneas | **1** (`AdminDashboard.tsx` 701) |
| Archivos ≥500 líneas | **81** |
| Archivos ≥300 líneas | **255** |
| Test cases (web) | **1,845** — baseline histórico; lote crítico documentado ya corregido (10 archivos / 259 tests verdes) |
| Test files (web) | **192** |
| Test cases (API) | **37** |
| Test files (API) | **7** |
| Ocurrencias `: any / as any` | **1,090** |
| `console.log` producción | **5** |
| TDI global calculado | **~24%** |

---

## TDI por categoría — estado actual

| Categoría | Peso | Deuda actual | Contribución | vs anterior |
|---|---|---|---|---|
| Testing y QA | 15% | **25%** | 3.75pp | ↓ desde ~40% |
| Arquitectura y Modularidad | 20% | **8%** | 1.60pp | ↓ desde ~12% |
| Calidad de Código | 15% | **10%** | 1.50pp | ↓ desde ~15% |
| Type Safety | 10% | **35%** | 3.50pp | ↑ empeoró desde ~18% |
| Backend Express | 10% | **60%** | 6.00pp | ↓ desde ~92% |
| Seguridad | 10% | **28%** | 2.80pp | ↓ desde ~55% |
| BD y Migraciones | 10% | **40%** | 4.00pp | ↓ desde ~58% |
| Documentación | 10% | **5%** | 0.50pp | ↓ desde ~8% |
| **TOTAL** | | | **~23.65% ≈ 24%** | ↓ desde ~37% |

---

## Mapa de archivos de tarea

| Archivo | Área | Peso TDI | Deuda actual | Urgencia |
|---|---|---|---|---|
| [01-arquitectura-modularidad.md](01-arquitectura-modularidad.md) | Arquitectura | 20% | **8%** | 🟡 Media |
| [02-frontend-componentes.md](02-frontend-componentes.md) | Frontend hooks/UI | — | **~12%** | 🟡 Media |
| [03-backend-express-api.md](03-backend-express-api.md) | Backend Express | 10% | **60%** | 🔴 Alta |
| [04-nextjs-api-routes.md](04-nextjs-api-routes.md) | Next.js API Routes | — | **~15%** | 🟡 Media |
| [05-seguridad.md](05-seguridad.md) | Seguridad | 10% | **28%** | 🟡 Media |
| [06-base-de-datos.md](06-base-de-datos.md) | Base de Datos | 10% | **40%** | 🟡 Media |
| [07-optimizacion-queries.md](07-optimizacion-queries.md) | Query Performance | — | parcial | 🟢 Baja |
| [08-type-safety.md](08-type-safety.md) | Type Safety | 10% | **35%** | 🔴 Alta |
| [09-testing-qa.md](09-testing-qa.md) | Testing y QA | 15% | **25%** | 🔴 Alta |

---

## Lo que ya resolvió Codex (NO repetir)

### Archivos masivamente reducidos (worktree actual)

| Archivo | Antes | Ahora | Estado |
|---|---|---|---|
| `features/auth/actions/invitation.ts` | 789 | **120** | ✅ |
| `features/study-planner/services/soflia-context.service.ts` | 702 | **11** | ✅ |
| `lib/auth/requireBusiness.ts` | 684 | **50** | ✅ |
| `lib/auth/hierarchicalAccess.ts` | 627 | **1** | ✅ |
| `features/auth/components/OrganizationAuth/OrganizationRegisterForm.tsx` | 684 | **102** | ✅ |
| `features/auth/services/email.service.ts` | 630 | **145** | ✅ |
| `app/api/ai-chat/route.ts` | 746 | **155** | ✅ |
| `app/api/study-planner/dashboard/chat/route.ts` | 1,105 | **148** | ✅ |
| `app/api/study-planner/calendar/sync-sessions/route.ts` | 627 | **106** | ✅ |
| `features/business-panel/services/businessUsers.server.service.ts` | 635 | **76** | ✅ |
| `lib/rrweb/session-recorder.ts` | 701 | **328** | ⚠️ parcial |
| `features/business-panel/components/BusinessAssignCourseModal.tsx` | 672 | **478** | ⚠️ parcial |
| `features/admin/components/LessonModal.tsx` | 669 | **407** | ⚠️ parcial |
| `features/study-planner/services/course-analysis.service.ts` | 668 | **428** | ⚠️ parcial |
| `features/auth/components/OrganizationAuth/OrganizationLoginForm.tsx` | 660 | **435** | ⚠️ parcial |

### Backend implementado
- Auth middleware JWT, role middleware, error handler, rate-limit, Zod validation ✅
- Dominio `notifications` completo (service, controller, routes, repository, types, utils) ✅
- 37 test cases en `apps/api` ✅

### Rate limiting implementado
- `app/api/ai-chat/route.ts` ✅
- `app/api/study-planner/dashboard/chat/route.ts` ✅
- `app/api/tts/route.ts` ✅
- `app/api/auth/*` (logout, me, refresh, sessions, questionnaire-status) ✅

### BD — Índices creados
- `idx_calendar_integrations_user_provider_updated_at` ✅
- `idx_study_sessions_user_plan_start_time` ✅
- `idx_study_sessions_calendar_sync_lookup` ✅
- `idx_user_notifications_unread_priority_expires_at` ✅

---

## Orden de ataque para la siguiente tanda

### PRIORIDAD 1 — Testing de cobertura nueva (impacto inmediato, máximo retorno)
→ Ver `09-testing-qa.md` BLOQUE 1

El **BLOQUE 0 documentado ya quedó corregido** en verificación focalizada del 2026-04-02:
**10 archivos / 259 tests verdes**. El siguiente retorno fuerte ya no está en arreglar rojos,
sino en ampliar cobertura para módulos sensibles y ejecutar una corrida global completa.

Siguiente frente:
1. `useStudyPlannerCalendarLogic` — completar refresh/mutation success/provider errors
2. Servicios grandes sin tests dedicados — `course-analysis`, `adminLessons`, `useStudyPlannerMessageHandler`
3. Corrida global verificable de `apps/web` para recalcular pass rate real
4. Cobertura backend siguiente dominio/repository integration
5. Mantener cobertura ya existente en `rrweb`, `invitation` y `analytics-response`

### PRIORIDAD 2 — Type Safety (mayor deuda relativa, ~35%)
→ Ver `08-type-safety.md`

1,090 ocurrencias de `any` (subió porque el último lote añadió código sin tipar). El módulo `admin` tiene 189 — fue declarado limpio pero se recontaminó. Atacar en orden:
1. `admin/` — 189 ocurrencias
2. `courses/` — 112 ocurrencias
3. `study-planner/` — 92 ocurrencias

### PRIORIDAD 3 — Arquitectura: hotspots pendientes
→ Ver `01-arquitectura-modularidad.md`

Solo 1 archivo ≥700 (`AdminDashboard.tsx`). Los de 600-699 son el frente activo.
`learn-data/route.ts` y `lessons/[lessonId]/progress/route.ts` ya salieron de esta lista en la tanda actual:
1. `AdminDashboard.tsx` (701) — único ≥700
2. `analytics-response.service.ts` (694)
3. `useCourseManagementLogic.ts` (691)
4. `AdminEditCompanyModal.tsx` (683)
5. `BusinessPanelDashboard.tsx` (679)
6. `BusinessEditUserModal.tsx` (677)
7. `useStudyPlannerMessageHandler.ts` (676) — creado en refact
8. `adminLessons.service.ts` (675)
9. `app/api/study-planner/events/[id]/route.ts` (617) — siguiente API crítica
10. `app/[orgSlug]/business-panel/courses/page.tsx` (611) — controller pendiente

### PRIORIDAD 4 — Backend (mayor deuda absoluta: 60%)
→ Ver `03-backend-express-api.md`

Infraestructura y notificaciones implementadas. Siguiente: Admin Users domain.

### PRIORIDAD 5 — BD restante (40%)
→ Ver `06-base-de-datos.md`

Índices de performance ya creados ✅. Pendiente: RLS en tablas críticas, cursor-based pagination.

---

## TDI proyectado por sprint

| Sprint | TDI esperado | Acciones |
|---|---|---|
| Actual | **~24%** | baseline |
| Sprint 1 (tests + type safety) | **~20%** | -4pp |
| Sprint 2 (arquitectura + BD/RLS) | **~16%** | -4pp |
| Sprint 3 (backend domains) | **~13%** | -3pp |
| Sprint 4 (E2E tests + security) | **~10%** | -3pp |
