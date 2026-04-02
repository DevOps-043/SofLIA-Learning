# CODEX TASK — Arquitectura y Modularidad

**Peso en TDI:** 20% | **Deuda residual estimada:** ~10-12%
**Fecha de corte:** 2026-04-01
**Estado:** Parcialmente resuelto — quedan 9 hotspots activos (5 de ellos ≥700 líneas)

---

## Lo que ya está hecho (NO tocar)

Los siguientes archivos fueron modularizados correctamente y tienen tests:

| Archivo | Líneas actuales | Bajó desde |
|---|---|---|
| `features/auth/actions/oauth.ts` | 114 | 1,122 |
| `features/admin/components/CourseManagementPage.tsx` | 31 | 1,155 |
| `features/admin/components/AdminCommunitiesPage.tsx` | 127 | 872 |
| `features/admin/components/AdminCommunityDetailPage.tsx` | 115 | 882 |
| `features/admin/components/AdminWorkshopsPage.tsx` | 103 | 755 |
| `features/admin/services/adminUsers.service.ts` | 57 | 740 |
| `features/notifications/services/notification.service.ts` | 73 | 726 |
| `core/services/contentService.ts` | 34 | 736 |
| `features/business-panel/components/BusinessUnifiedInviteModal.tsx` | 28 | 915 |
| `app/api/study-planner/calendar/events/route.ts` | 147 | 698 |
| `app/courses/[slug]/page.tsx` | 13 | 929 |
| `app/profile/page.tsx` | 14 | 945 |
| `app/[orgSlug]/business-user/dashboard/page.tsx` | 64 | 786 |

---

## Estado real del worktree — barrido definitivo 2026-04-01

Scan con `xargs wc -l` desde `apps/web/src` (40 archivos ≥600 líneas):

> **HALLAZGO CRÍTICO:** Los 4 archivos P0 del hotspot table actual
> (`BusinessAssignCourseModal.tsx` 672, `LessonModal.tsx` 669,
> `course-analysis.service.ts` 668, `OrganizationLoginForm.tsx` 660)
> **NO aparecen en el scan** → probablemente ya fueron resueltos por Codex
> pero la tabla de hotspots no fue actualizada. Verificar antes de atacar.
>
> **HALLAZGO 2:** Varios archivos CREADOS durante la refactorización
> son ahora hotspots nuevos: `useStudyPlannerMessageHandler.ts` (676),
> `useCustomVideoPlayerState.ts` (626), `global-analytics-response.service.ts` (625).
>
> **HALLAZGO 3:** 30+ archivos ≥600 líneas que nunca estuvieron en ningún backlog.

### Hotspots reales ≥700 (5 archivos)

| Archivo | Líneas reales | Estado en backlog |
|---|---|---|
| `features/auth/actions/invitation.ts` | **789** | Eliminado sin resolver |
| `features/study-planner/components/hooks/useStudyPlannerCalendarLogic.ts` | **727** | En tabla como 643 — subestimado |
| `features/study-planner/services/soflia-context.service.ts` | **702** | Eliminado sin resolver |
| `lib/rrweb/session-recorder.ts` | **701** | En tabla como 643 — subestimado |
| `features/admin/components/AdminDashboard.tsx` | **701** | En tabla como 660 — subestimado |

### Hotspots reales 650-699 (nunca en backlog)

| Archivo | Líneas | Dominio |
|---|---|---|
| `features/business-panel/services/analytics/analytics-response.service.ts` | 694 | Analytics |
| `features/admin/components/CourseManagement/hooks/useCourseManagementLogic.ts` | 691 | Cursos admin |
| `lib/auth/requireBusiness.ts` | **684** | **Auth — NUNCA en backlog** |
| `features/auth/components/OrganizationAuth/OrganizationRegisterForm.tsx` | 684 | Auth |
| `features/admin/components/AdminEditCompanyModal.tsx` | 683 | Admin |
| `features/study-planner/types/user-context.types.ts` | **681** | **Types file pesado** |
| `features/business-panel/components/BusinessPanelDashboard.tsx` | 679 | Business panel |
| `features/business-panel/components/BusinessEditUserModal.tsx` | **677** | **NUNCA en backlog** |
| `features/study-planner/hooks/useStudyPlannerMessageHandler.ts` | **676** | **Creado en refact — nuevo hotspot** |
| `features/admin/services/adminLessons.service.ts` | **675** | **NUNCA en backlog** |
| `app/api/courses/[slug]/lessons/[lessonId]/progress/route.ts` | **666** | **API route — NUNCA en backlog** |
| `features/business-panel/components/OrganizationTab.tsx` | **655** | **NUNCA en backlog** |
| `features/admin/components/EditCommunityModal.tsx` | **653** | **NUNCA en backlog** |

### Hotspots reales 600-649 (en su mayoría nunca en backlog)

| Archivo | Líneas |
|---|---|
| `features/admin/components/AddUserModal.tsx` | 644 |
| `features/courses/components/learn/ContentRenderers.tsx` | 643 |
| `features/admin/components/CoursesSection.tsx` | 643 |
| `features/admin/services/adminWorkshops.service.ts` | 642 |
| `features/business-panel/services/hierarchy.service.ts` | 640 |
| `features/admin/components/EditNewsModal.tsx` | 640 |
| `features/business-panel/components/hierarchy/NodeDashboard.tsx` | 634 |
| `features/admin/components/AddNewsModal.tsx` | 633 |
| `app/api/courses/[slug]/learn-data/route.ts` | **633** |
| `features/auth/services/email.service.ts` | **630** |
| `features/business-panel/components/hierarchy/NodeForm.tsx` | 628 |
| `lib/auth/hierarchicalAccess.ts` | **627** |
| `features/business-panel/hooks/useHierarchy.ts` | 627 |
| `app/api/study-planner/calendar/sync-sessions/route.ts` | **627** |
| `core/components/CustomVideoPlayer/player/useCustomVideoPlayerState.ts` | **626** |
| `features/business-panel/services/analytics/global-analytics-response.service.ts` | **625** |
| `features/admin/components/CourseManagement/CourseManagementStudentDetailsModal.tsx` | 623 |
| `features/study-planner/components/hooks/useStudyPlannerLIALogic.ts` | 622 |
| `features/admin/components/SkillModal.tsx` | 622 |
| `features/business-panel/components/BusinessSubscriptionPlans.tsx` | 621 |
| `features/instructor/components/InstructorStatsCharts.tsx` | 620 |
| `features/study-planner/hooks/useStudyPlannerDashboardLIA.ts` | 619 |

---

## Pendiente crítico — ordenado por urgencia

### BLOQUE 1 — Archivos eliminados del backlog sin resolverse (CRÍTICO)

Estos dos archivos fueron marcados como "resueltos" en iteraciones anteriores pero el barrido
directo del worktree confirma que siguen intactos y por encima de 700 líneas.

**TAREA 1A — `features/auth/actions/invitation.ts` (789 líneas)**
- Contiene lógica de invitación bulk, invitaciones individuales, SSO, validación y redirect
- Mezcla lógica de negocio, Supabase directo, redirect y manejo de errores en un solo archivo
- Sin tests actualmente

Extracción esperada:
```
features/auth/actions/invitation/
├── index.ts                          # barrel export
├── types.ts                          # InvitationParams, InvitationResult, etc.
├── invitation-validation.service.ts  # validar token, expiración, estado
├── invitation-redemption.service.ts  # canjear invitación, update uses
├── invitation-sso.service.ts         # flujo SSO con invitación activa
├── invitation-redirect.service.ts    # resolver destino post-aceptación
└── __tests__/
    └── invitation.service.test.ts
```

**TAREA 1B — `features/study-planner/services/soflia-context.service.ts` (702 líneas)**
- Construye el contexto de SofLIA para el planner: cursos, sesiones, preferencias, calendario
- Tiene transformaciones pesadas que mezclan DB, lógica de negocio y construcción de texto
- Sin tests actualmente

Extracción esperada:
```
features/study-planner/services/soflia-context/
├── index.ts
├── types.ts
├── soflia-context-courses.service.ts    # contexto de cursos del usuario
├── soflia-context-sessions.service.ts   # sesiones activas y completadas
├── soflia-context-preferences.service.ts # preferencias de estudio
├── soflia-context-builder.service.ts    # ensambla el contexto final
└── __tests__/
    └── soflia-context.service.test.ts
```

---

### BLOQUE 2 — P0 del backlog activo

**TAREA 2A — `features/business-panel/components/BusinessAssignCourseModal.tsx` (672 líneas)**
- Modal que asigna cursos a usuarios del panel business
- Mezcla fetch de cursos, filtros, selección, estado del formulario y submit
- Sin tests

Extracción esperada:
```
features/business-panel/components/business-assign-course-modal/
├── index.ts
├── types.ts
├── BusinessAssignCourseModal.tsx         # shell <200 líneas
├── BusinessAssignCourseModalHeader.tsx
├── BusinessAssignCourseSearch.tsx
├── BusinessAssignCourseList.tsx
├── business-assign-course-modal.service.ts
├── useBusinessAssignCourseModalLogic.ts
└── __tests__/
    └── business-assign-course-modal.service.test.ts
```

**TAREA 2B — `features/admin/components/LessonModal.tsx` (669 líneas)**
- Modal de gestión de lecciones: crear, editar, subir video, SCORM, actividades
- Alta complejidad por múltiples tipos de contenido

Extracción esperada:
```
features/admin/components/lesson-modal/
├── index.ts
├── types.ts
├── LessonModal.tsx                   # shell orquestador
├── LessonModalHeader.tsx
├── LessonVideoTab.tsx
├── LessonScormTab.tsx
├── LessonActivitiesTab.tsx
├── lesson-modal.service.ts
├── useLessonModalLogic.ts
└── __tests__/
    └── lesson-modal.service.test.ts
```

**TAREA 2C — `features/study-planner/services/course-analysis.service.ts` (668 líneas)**
- Analiza cursos para el planner: duración, distribución de lecciones, disponibilidad
- Transformaciones complejas sin separación de responsabilidades

Extracción esperada:
```
features/study-planner/services/course-analysis/
├── index.ts
├── types.ts
├── course-duration.service.ts
├── lesson-distribution.service.ts
├── course-availability.service.ts
├── course-analysis.service.ts        # facade fina
└── __tests__/
    └── course-analysis.service.test.ts
```

**TAREA 2D — `features/auth/components/OrganizationAuth/OrganizationLoginForm.tsx` (660 líneas)**
- Formulario de login organizacional con SSO Google/Microsoft, email/password, validación
- Lógica sensible mezclada con render

Extracción esperada:
```
features/auth/components/OrganizationAuth/organization-login-form/
├── index.ts
├── types.ts
├── OrganizationLoginForm.tsx          # shell <150 líneas
├── OrganizationLoginEmailForm.tsx
├── OrganizationLoginSSOButtons.tsx
├── useOrganizationLoginFormLogic.ts
├── organization-login-form.service.ts
└── __tests__/
    └── organization-login-form.service.test.ts
```

---

### BLOQUE 3 — P1/P2 secundarios

**TAREA 3A — `features/admin/components/AdminDashboard.tsx` (701 líneas reales — doc dice 660)**
```
features/admin/components/admin-dashboard/
├── AdminDashboard.tsx                 # orquestador
├── AdminDashboardStats.tsx
├── AdminDashboardCharts.tsx
├── AdminDashboardRecentActivity.tsx
├── useAdminDashboardLogic.ts
└── __tests__/
```

**TAREA 3B — `features/business-panel/services/analytics/analytics-response.service.ts` (694 líneas)**
- Hotspot residual de analytics. Separar aggregation por tipo de métrica.

**TAREA 3C — `features/admin/components/AdminEditCompanyModal.tsx` (647 líneas)**
- Branding + upload + mutaciones mezcladas

**TAREA 3D — `features/study-planner/components/hooks/useStudyPlannerCalendarLogic.ts` (727 líneas reales — doc dice 643)**
- El hook más pesado del planner. Separar lógica de eventos, sync, navegación y estado de UI.

---

## Reglas para Codex en este módulo

1. **No cambiar comportamiento observable.** Extraer = mover código, no reescribirlo.
2. **Cada archivo extraído debe tener un `__tests__/` correspondiente.**
3. **El archivo principal tras la extracción debe quedar en ≤200 líneas.**
4. **Usar `index.ts` como barrel en cada directorio nuevo.**
5. **Verificar con `npx vitest run` focalizado al directorio** antes de marcar como completo.
6. **No introducir `any`.** Si el original tiene `any`, mantenerlo; no agregar nuevos.
7. Cada tarea = un commit atómico.

## Verificación esperada por tarea

```bash
# Por cada tarea, correr vitest focalizado:
npx vitest run --reporter=verbose apps/web/src/features/auth/actions/invitation/
npx vitest run --reporter=verbose apps/web/src/features/study-planner/services/soflia-context/
npx vitest run --reporter=verbose apps/web/src/features/business-panel/components/business-assign-course-modal/
npx vitest run --reporter=verbose apps/web/src/features/admin/components/lesson-modal/
```

## Métrica de éxito

- 0 archivos ≥700 líneas en `apps/web/src` (excluyendo `lib/supabase/types.ts` y templates)
- 0 archivos ≥600 líneas en el backlog activo
- Todos los archivos nuevos con al menos 1 suite de tests verde
