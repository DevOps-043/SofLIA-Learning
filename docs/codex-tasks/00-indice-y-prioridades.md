# CODEX — Índice de Tareas de Deuda Técnica

**Snapshot vigente para ejecución:** ~11%
**Fecha de corte vigente:** 2026-04-03
**Fuente de verdad:** `docs/refactor-program.md` (snapshot post-sprint type safety + arch + testing)
**Objetivo operativo siguiente:** bajar de ~11% a <10% y destrabar verificación funcional completa

> Nota: este índice conserva tablas históricas del corte `2026-04-02` para trazabilidad.
> Mientras no se rehaga el barrido completo del worktree, usar `docs/refactor-program.md`
> como baseline activa del programa.

---

## Estado real medido en worktree

| Métrica | Valor actual |
|---|---|
| Archivos ≥700 líneas | **0** |
| Archivos ≥600 líneas | **~29** |
| Archivos ≥500 líneas | **76** |
| Archivos ≥300 líneas | **333** |
| Test cases (web) | **1,912** — 0 failing, 100% pass rate |
| Test files (web) | **203** |
| Test cases (API) | **58** |
| Test files (API) | **13** |
| Ocurrencias `: any / as any` | **1,001** |
| TDI global calculado | **~14%** |

---

## TDI por categoría — estado actual

| Categoría | Peso | Deuda actual | Contribución | vs sprint anterior |
|---|---|---|---|---|
| Testing y QA | 15% | **12%** | 1.80pp | ↓ desde ~25% |
| Arquitectura y Modularidad | 20% | **6%** | 1.20pp | ↓ desde ~8% |
| Calidad de Código | 15% | **8%** | 1.20pp | ↓ desde ~10% |
| Type Safety | 10% | **20%** | 2.00pp | ↓ desde ~35% |
| Backend Express | 10% | **40%** | 4.00pp | ↓ desde ~60% |
| Seguridad | 10% | **10%** | 1.00pp | ↓ desde ~28% |
| BD y Migraciones | 10% | **28%** | 2.80pp | ↓ desde ~40% |
| Documentación | 10% | **3%** | 0.30pp | ↓ desde ~5% |
| **TOTAL** | | | **~14.30% ≈ 14%** | ↓ desde ~24% |

---

## Mapa de archivos de tarea

| Archivo | Área | Peso TDI | Deuda actual | Urgencia |
|---|---|---|---|---|
| [01-arquitectura-modularidad.md](01-arquitectura-modularidad.md) | Arquitectura | 20% | **6%** | 🟡 Media |
| [02-frontend-componentes.md](02-frontend-componentes.md) | Frontend hooks/UI | — | **~8%** | 🟡 Media |
| [03-backend-express-api.md](03-backend-express-api.md) | Backend Express | 10% | **40%** | 🔴 Alta |
| [04-nextjs-api-routes.md](04-nextjs-api-routes.md) | Next.js API Routes | — | **~9%** | 🟡 Media |
| [05-seguridad.md](05-seguridad.md) | Seguridad | 10% | **10%** | 🟢 Baja |
| [06-base-de-datos.md](06-base-de-datos.md) | Base de Datos | 10% | **28%** | 🟡 Media |
| [07-optimizacion-queries.md](07-optimizacion-queries.md) | Query Performance | — | parcial | 🟢 Baja |
| [08-type-safety.md](08-type-safety.md) | Type Safety | 10% | **20%** | 🟡 Media |
| [09-testing-qa.md](09-testing-qa.md) | Testing y QA | 15% | **12%** | 🟡 Media |

---

## Lo que ya resolvió Codex (NO repetir)

### Archivos masivamente reducidos — estado worktree actual

| Archivo | Antes | Ahora | Estado |
|---|---|---|---|
| `features/auth/actions/invitation.ts` | 789 | **120** | ✅ |
| `features/study-planner/services/soflia-context.service.ts` | 702 | **11** | ✅ |
| `lib/auth/requireBusiness.ts` | 684 | **50** | ✅ reestructurado en `business-auth/*` |
| `lib/auth/hierarchicalAccess.ts` | 627 | **1** | ✅ barrel fin sobre `hierarchical-access/*` |
| `features/auth/components/OrganizationAuth/OrganizationRegisterForm.tsx` | 684 | **102** | ✅ |
| `features/auth/services/email.service.ts` | 630 | **145** | ✅ |
| `app/api/ai-chat/route.ts` | 746 | **155** | ✅ |
| `app/api/study-planner/dashboard/chat/route.ts` | 1,105 | **148** | ✅ |
| `app/api/study-planner/calendar/sync-sessions/route.ts` | 627 | **106** | ✅ |
| `app/api/courses/[slug]/learn-data/route.ts` | 633 | **52** | ✅ + 2 suites de tests |
| `app/api/courses/[slug]/lessons/[lessonId]/progress/route.ts` | 666 | **90** | ✅ + validación estricta |
| `lib/rrweb/session-recorder.ts` | 701 | **90** | ✅ modularizado + 4 suites de tests |
| `features/business-panel/services/businessUsers.server.service.ts` | 635 | **76** | ✅ |
| `features/admin/components/AdminDashboard.tsx` | 701 | **61** | ✅ |

### Backend implementado ✅

- Auth middleware JWT, role middleware, error handler, rate-limit, Zod validation ✅
- Dominio `notifications` completo ✅
- Dominio `admin/users` completo (controller, service, repository, routes, types, utils) ✅
- Dominio `business/analytics` completo ✅
- Middleware `admin-access` y `organization-access` ✅
- **58 test cases en `apps/api` — 13 archivos — 0 failing ✅**

### Seguridad implementada ✅

- Security headers en `next.config.js` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection, HSTS) ✅
- `rrweb` completamente modularizado con tests de filtros de privacidad ✅
- `lib/auth/` reestructurado: `business-auth/*` + `hierarchical-access/*` con tests ✅
- Rate limiting en ai-chat, dashboard/chat, tts, todos los auth routes ✅
- 0 secretos hardcodeados en cliente ✅

### Errores de TypeScript en `lib/` resueltos ✅

| Archivo | Error | Estado |
|---|---|---|
| `lib/utils/logger.ts` | TS2774 x4 | ✅ |
| `lib/utils/organization-query.ts` | TS2707 x2 | ✅ |
| `lib/validation/password-security.ts` | TS2558 | ✅ |
| `lib/sanitize/enhanced-dom-purify.ts` | TS18046 | ✅ |
| `lib/scorm/parser.ts` | TS2345 | ✅ |
| `lib/supabase/pool.ts` | TS2345 | ✅ |
| `lib/subscription/subscriptionHelper.ts` | TS2307 x2 | pendiente |

### BD — Índices e infraestructura ✅

- `idx_calendar_integrations_user_provider_updated_at` ✅
- `idx_study_sessions_user_plan_start_time` ✅
- `idx_study_sessions_calendar_sync_lookup` ✅
- `idx_user_notifications_unread_priority_expires_at` ✅
- `idx_calendar_integrations_lookup` (migración `20260402130000`) ✅
- `idx_user_notifications_created` (migración `20260402143000`) ✅
- `supabase/MIGRATION_AUDIT.md` creado ✅

### Testing — estado actual

- **1,912 tests pasando — 0 failing (100% pass rate)** ✅
- 16 tests que fallaban → todos corregidos ✅
- Bugs reales corregidos: `sanitizePlainText`, `generateSafeFileName`, `extractPromptList`

---

## Orden de ataque para la siguiente tanda

### PRIORIDAD 1 — Backend Express (40% deuda, 4.00pp)
→ Ver `03-backend-express-api.md`

Los 3 dominios implementados son la base. Siguiente: Courses domain.

1. Dominio `courses`: controller, service, repository, routes, types + tests
2. Dominio `study-planner`: controller, service, repository, routes, types + tests
3. Dominio `profile/subscriptions`: si aplica

### PRIORIDAD 2 — BD: RLS en tablas críticas (28% deuda, 2.80pp)
→ Ver `06-base-de-datos.md`

Los índices están hechos. Pendiente: RLS en 6 tablas críticas y cursor-based pagination.

1. Verificar RLS actual en `usuarios`, `lia_conversations`, `study_sessions`
2. Crear migraciones para tablas sin RLS
3. Al menos 1 endpoint migrado a cursor-based pagination

### PRIORIDAD 3 — Type Safety (20% deuda, 2.00pp)
→ Ver `08-type-safety.md`

1,001 `any` restantes. El módulo `app/` tiene 449 — el mayor frente activo.

Distribución actual:
- `app/` (routes + pages): **449**
- `features/admin/`: **143**
- `core/`: **80**
- `features/instructor/`: **58**
- `features/business-panel/`: **51**
- `features/study-planner/`: **26** (bajó de 92 ✅)
- `features/communities/`: **25**
- `features/courses/`: **14** (bajó de 112 ✅)

### PRIORIDAD 4 — Testing: ampliar cobertura (12% deuda, 1.80pp)
→ Ver `09-testing-qa.md`

Con 0 tests fallando, el frente ahora es ampliar cobertura en servicios grandes sin suite:
1. `adminWorkshops.service.ts` (642 líneas) — sin tests propios
2. `hierarchy.service.ts` (640 líneas) — sin tests propios
3. `useStudyPlannerMessageHandler.ts` (676 líneas) — sin tests propios
4. `analytics-response.service.ts` (694 líneas) — ampliar suite existente

### PRIORIDAD 5 — Arquitectura: hotspots ≥600 activos (6% deuda, 1.20pp)
→ Ver `01-arquitectura-modularidad.md`

29 archivos ≥600 líneas. Los más críticos por lógica de negocio:

| Archivo | Líneas | Tipo |
|---|---|---|
| `useCourseManagementLogic.ts` | 691 | Hook complejo |
| `AdminEditCompanyModal.tsx` | 683 | Modal con múltiples responsabilidades |
| `BusinessPanelDashboard.tsx` | 679 | Dashboard component |
| `BusinessEditUserModal.tsx` | 677 | Modal edición |
| `useStudyPlannerMessageHandler.ts` | 676 | Hook planner |
| `analytics-response.service.ts` | 694 | Service analytics |
| `app/api/study-planner/events/[id]/route.ts` | 617 | API route |
| `app/[orgSlug]/business-panel/courses/page.tsx` | 611 | Page controller |

---

## TDI proyectado por sprint

| Sprint | TDI esperado | Acciones principales |
|---|---|---|
| Completado (este sprint) | **~14%** | Backend domains, rrweb, lib/ errors, routes, tests |
| Sprint 2 (backend + BD/RLS) | **~10-11%** | Courses + planner domains, RLS 6 tablas, any en `app/` |
| Sprint 3 (type safety + arquitectura) | **~8%** | any total <400, hotspots ≥600 reducidos a <15 |
| Sprint 4 (E2E tests + completitud) | **~6%** | Tests de integración, coverage ≥80%, subscriptionHelper |
