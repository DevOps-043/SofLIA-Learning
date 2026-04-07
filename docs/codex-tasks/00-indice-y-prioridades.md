# CODEX — Índice de Tareas de Deuda Técnica

**Snapshot vigente para ejecución:** ~5%
**Fecha de corte vigente:** 2026-04-06
**Fuente de verdad:** este archivo (actualizado post-Sprint 4)
**Objetivo operativo siguiente:** mantener <5% y completar cobertura de tests >80%

> Nota: este índice refleja el estado post-Sprint 4 (2026-04-06). Sprints 1-4 redujeron TDI de ~24% a ~5%.

---

## Estado real medido en worktree (2026-04-06)

| Métrica | Valor actual | vs Sprint anterior |
|---|---|---|
| Archivos ≥700 líneas | **0** | = |
| Archivos ≥600 líneas | **0** | ↓ desde ~29 |
| Archivos 500-599 líneas | **~45** | ↓ desde ~76 |
| Test cases (web) | **2,027** — 0 failing | ↑ desde 1,912 |
| Test files (web) | **219** | ↑ desde 203 |
| Test cases (API) | **92** | ↑ desde 58 |
| Test files (API) | **17** | ↑ desde 13 |
| Ocurrencias `: any / as any` | **1** (leaflet intencional) | ↓ desde 1,001 |
| Dominios Express | **6/6** ✅ | ↑ desde 3 |
| Tablas con RLS | **13+** | ↑ desde ~8 |
| TDI global calculado | **~5%** | ↓ desde ~14% |

---

## TDI por categoría — estado actual

| Categoría | Peso | Deuda actual | Contribución | vs sprint anterior |
| --- | --- | --- | --- | --- |
| Testing y QA | 15% | **~5%** | 0.75pp | ↓ desde ~12% |
| Arquitectura y Modularidad | 20% | **~1%** | 0.20pp | ↓ desde ~6% |
| Calidad de Código | 15% | **~5%** | 0.75pp | ↓ desde ~8% |
| Type Safety | 10% | **~1%** | 0.10pp | ↓ desde ~20% |
| Backend Express | 10% | **~5%** | 0.50pp | ↓ desde ~40% |
| Seguridad | 10% | **~8%** | 0.80pp | ↓ desde ~10% |
| BD y Migraciones | 10% | **~8%** | 0.80pp | ↓ desde ~28% |
| Documentación | 10% | **~3%** | 0.30pp | = |
| **TOTAL** | | | **~4.20% ≈ 5%** | ↓ desde ~14% |

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
- Dominio `courses` completo (controller, service, repository, routes, types) ✅
- Dominio `profile` completo (controller, service, repository, routes, types) ✅
- Dominio `study-planner` completo (controller, service, repository, routes, types) ✅
- Middleware `admin-access` y `organization-access` ✅
- **92 test cases en `apps/api` — 17 archivos — 0 failing ✅**

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

- **2,027 tests web pasando — 0 failing (100% pass rate)** ✅
- **92 tests API — 0 failing** ✅
- 16 tests que fallaban → todos corregidos ✅
- Bugs reales corregidos: `sanitizePlainText`, `generateSafeFileName`, `extractPromptList`

### Sprint 3 — Completado 2026-04-04 ✅

- 31 archivos ≥600 líneas → **0** ✅
- ~75 ocurrencias `any` eliminadas en Sprint 3 ✅
- DB: RLS en `study_plans`, `lia_messages`, `calendar_integrations` ✅
- DB: Índices `lia_conversations`, `lia_messages`, `user_lesson_progress` ✅
- Backend: Dominio `profile` implementado ✅

### Sprint 4 — Completado 2026-04-06 ✅

- Últimas ~8 ocurrencias de `any` eliminadas → **1 restante** (leaflet intencional) ✅
- 5 archivos ≥600 líneas escapados del Sprint 3 → **0** (system-prompt, adminPrompts, lia-logger, courses page, community posts) ✅
- MIGRATION_AUDIT.md actualizado con Sprint 3 ✅
- +100 test cases web (calculations, duration, progress, session-generator, plan-generator, planner-chat-response, planner-course-workload) ✅
- Docs TDI actualizadas al estado real ✅

---

## Estado actual — TDI ~5%

Todas las áreas de deuda técnica alta han sido resueltas. El foco ahora es mantenimiento:

### PRIORIDAD 1 — Testing: ampliar cobertura (~5% deuda)

→ Ver `09-testing-qa.md`

Con 2,027 tests web y 92 API, el frente es cubrir servicios grandes restantes:

1. `useStudyPlannerMessageHandler` — tests de detección de approach y conflictos
2. `planner-calendar-analysis.service.ts` — tests de análisis de calendario
3. `adminCourses.service.ts` — tests de CRUD de cursos
4. Tests de integración E2E (próximo sprint)

### PRIORIDAD 2 — Seguridad: hardening (~8% deuda)

→ Ver `05-seguridad.md`

1. Zod validation en API routes que aún no lo tienen
2. Verificar SameSite=Strict en todas las cookies de sesión
3. Auditoría de headers CSP

### PRIORIDAD 3 — BD: consolidación (~8% deuda)

→ Ver `06-base-de-datos.md`

1. Consolidar scripts sin timestamp en migraciones ordenadas
2. Documentar schema actual para onboarding

---

## Historial TDI por sprint

| Sprint | TDI | Acciones principales |
| --- | --- | --- |
| Sprint 1 (2026-04-02) | **~14%** | Backend domains, rrweb, lib/ errors, routes, tests |
| Sprint 2 (2026-04-03) | **~10-11%** | Courses + planner domains, RLS 6 tablas, any en `app/` |
| Sprint 3 (2026-04-04) | **~8%** | any eliminados, 31 archivos ≥600 resueltos, DB indexes |
| Sprint 4 (2026-04-06) | **~5%** | any final, 5 archivos ≥600 restantes, +100 tests, docs |
