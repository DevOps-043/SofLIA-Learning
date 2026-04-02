# CODEX — Índice de Tareas de Deuda Técnica

**TDI verificado:** ~10-11% operativo / ~14-15% contextual real
**Fecha de corte:** 2026-04-01
**Objetivo de esta tanda:** Bajar de ~14-15% a ~8-10% contextual real

---

## Mapa de archivos de tarea

| Archivo | Área | Peso TDI | Deuda actual | Urgencia |
|---|---|---|---|---|
| [01-arquitectura-modularidad.md](01-arquitectura-modularidad.md) | Arquitectura y Modularidad | 20% | ~10-12% | 🔴 Alta |
| [02-frontend-componentes.md](02-frontend-componentes.md) | Frontend: Hooks y Componentes | — | ~12% | 🔴 Alta |
| [03-backend-express-api.md](03-backend-express-api.md) | Backend Express (`apps/api`) | 10% | ~92% | 🔴 Alta (piso TDI) |
| [04-nextjs-api-routes.md](04-nextjs-api-routes.md) | Next.js API Routes | — | ~15% | 🟡 Media |
| [05-seguridad.md](05-seguridad.md) | Seguridad | 10% | ~50-55% | 🔴 Alta |
| [06-base-de-datos.md](06-base-de-datos.md) | Base de Datos (Supabase) | 10% | ~55-58% | 🟡 Media |
| [07-optimizacion-queries.md](07-optimizacion-queries.md) | Optimización de Queries | — | Sin medición | 🟡 Media |
| [08-type-safety.md](08-type-safety.md) | Type Safety | 10% | ~15-18% | 🔴 Alta (bloquea build) |
| [09-testing-qa.md](09-testing-qa.md) | Testing y QA | 15% | ~35-40% | 🔴 Alta |

---

## Orden recomendado para la siguiente tanda

### SPRINT 1 — Desbloqueadores críticos (hacer primero, en este orden)

**1. Type-check global** → `08-type-safety.md` FRENTE 1
- Corregir los 12 errores en `lib/` que bloquean `npm run type-check`
- Sin este fix, ningún lote puede verificar que no introduce nuevos errores
- Tiempo estimado: 1 sesión Codex

**2. `invitation.ts` (789 líneas)** → `01-arquitectura-modularidad.md` TAREA 1A
- El archivo más grande sin tests, en el área más sensible (auth + invitaciones)
- Fue silenciosamente eliminado del backlog sin resolverse
- Debe hacerse junto con los tests (ver `09-testing-qa.md` TAREA 1A)
- Tiempo estimado: 1 sesión Codex

**3. `soflia-context.service.ts` (702 líneas)** → `01-arquitectura-modularidad.md` TAREA 1B
- También eliminado del backlog sin resolverse
- Impacta directamente la calidad del contexto que recibe SofLIA
- Tiempo estimado: 1 sesión Codex

---

### SPRINT 2 — P0 del backlog activo + seguridad

**4. P0 del backlog** → `01-arquitectura-modularidad.md` BLOQUE 2
- `BusinessAssignCourseModal.tsx` (672) — TAREA 2A
- `LessonModal.tsx` (669) — TAREA 2B
- `course-analysis.service.ts` (668) — TAREA 2C
- `OrganizationLoginForm.tsx` (660) — TAREA 2D (también es seguridad)
- Pueden hacerse en paralelo (archivos independientes)

**5. `session-recorder.ts` (701 líneas)** → `05-seguridad.md` TAREA 2A
- Captura de sesiones de usuario sin modularizar y sin tests de filtrado de datos sensibles
- Los tests de filtrado son obligatorios (ver `09-testing-qa.md` TAREA 1B)

**6. `ai-chat/route.ts` (577 líneas)** → `04-nextjs-api-routes.md` TAREA 1A
- La route más grande activa. Extraer `chat-context-builder.service.ts`

---

### SPRINT 3 — Infraestructura BD + Performance

**7. Índices BD críticos** → `06-base-de-datos.md` TAREA 4A + 4B
- `study_sessions` por `(user_id, scheduled_date)`
- `calendar_integrations` por `(user_id, provider)`

**8. RLS en tablas críticas** → `06-base-de-datos.md` BLOQUE 3
- 6 tablas sin RLS verificado: `lia_conversations`, `study_sessions`, `calendar_integrations`, etc.

**9. N+1 en `businessUsers.server.service.ts`** → `07-optimizacion-queries.md` TAREA 1A
- Auditar y corregir queries repetidas por usuario

**10. Rate limiting en endpoints OpenAI** → `04-nextjs-api-routes.md` BLOQUE 3
- `ai-chat/route.ts` y `study-planner/dashboard/chat/route.ts`

---

### SPRINT 4 — Backend Express + `any` masivo

**11. Infraestructura base de `apps/api`** → `03-backend-express-api.md` FASE 1
- Middleware auth JWT, Zod, error handler
- Sin esto el backend sigue siendo placeholder

**12. Primer dominio real en `apps/api`** → `03-backend-express-api.md` FASE 2
- Notificaciones (ya modularizadas en frontend, fácil de portar)

**13. Eliminar `any` en `study-planner`** → `08-type-safety.md` TAREA 2A
- ~120 ocurrencias, mayor impacto

**14. Eliminar `any` en `business-panel`** → `08-type-safety.md` TAREA 2B
- ~110 ocurrencias

---

### SPRINT 5 — Frontend residual + QA

**15. P1/P2 del hotspot table** → `02-frontend-componentes.md` BLOQUE 2
- `AdminDashboard.tsx` (701), `BusinessPanelDashboard.tsx` (640), `AdminEditCompanyModal.tsx` (647)
- `useStudyPlannerCalendarLogic.ts` (727)

**16. Tests de integración** → `09-testing-qa.md` BLOQUE 4
- Flujo de onboarding de empresa
- Flujo de notificaciones E2E

**17. `analytics-response.service.ts` (694)** → `02-frontend-componentes.md` o `07-optimizacion-queries.md`
- Hotspot residual de analytics

---

## Reglas globales para todas las tareas

1. **Máximo 2000 líneas por archivo nuevo.** Si supera ese límite: sub-dividir.
2. **No cambiar comportamiento.** Extracciones son puramente estructurales.
3. **No agregar dependencias** salvo framework de testing.
4. **Cada tarea = 1 commit atómico.**
5. **Verificar `npx vitest run` focalizado** antes de marcar tarea como completa.
6. **No introducir `any` nuevo.**
7. **Usar path aliases** (`@/features/*`, `@/core/*`, etc.) en código nuevo.
8. **Cada archivo extraído ≥50 líneas debe tener tests.**

---

## TDI esperado post-sprint

| Sprint | TDI Operativo esperado | TDI Real esperado | Cambio |
|---|---|---|---|
| Actual (verificado) | ~10-11% | ~14-15% | baseline |
| Post Sprint 1 | ~9% | ~12% | -2-3pp |
| Post Sprint 2 | ~7% | ~10% | -2pp |
| Post Sprint 3 | ~6% | ~9% | -1pp |
| Post Sprint 4 | ~5% | ~7% | -2pp |
| Post Sprint 5 | ~4% | ~6% | -1pp |

> La mayor ganancia individual está en **Sprint 1** (type-check + invitation.ts + soflia-context)
> y en **Sprint 4** (backend real implementado — desbloquea 9.2pp de piso).
