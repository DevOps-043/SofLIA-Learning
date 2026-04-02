# CODEX TASK — Arquitectura y Modularidad

**Peso en TDI:** 20% | **Deuda residual actual:** ~7%
**Fecha de corte:** 2026-04-02 (worktree real medido con `wc -l`)

---

## Estado estructural real del worktree

```
≥900 líneas: 0 archivos
≥800 líneas: 0 archivos
≥700 líneas: 0 archivos
≥600 líneas: 10 archivos
≥500 líneas: 56 archivos
≥300 líneas: 219 archivos (rango 300-499)
```

---

## Ya resuelto — NO tocar

| Archivo | Antes | Ahora |
|---|---|---|
| `features/auth/actions/invitation.ts` | 789 | **120** ✅ |
| `features/study-planner/services/soflia-context.service.ts` | 702 | **11** ✅ |
| `lib/auth/requireBusiness.ts` | 684 | **50** ✅ |
| `lib/auth/hierarchicalAccess.ts` | 627 | **1** ✅ |
| `features/auth/components/OrganizationAuth/OrganizationRegisterForm.tsx` | 684 | **102** ✅ |
| `features/auth/services/email.service.ts` | 630 | **145** ✅ |
| `features/admin/components/AdminDashboard.tsx` | 701 | **54** ✅ |
| `features/business-panel/services/analytics/analytics-response.service.ts` | 694 | **64** ✅ |
| `app/api/ai-chat/route.ts` | 746 | **155** ✅ |
| `app/api/study-planner/dashboard/chat/route.ts` | 1,105 | **148** ✅ |
| `app/api/study-planner/calendar/sync-sessions/route.ts` | 627 | **106** ✅ |
| `features/business-panel/services/businessUsers.server.service.ts` | 635 | **76** ✅ |
| `features/admin/services/adminUsers.service.ts` | 740 | **57** ✅ |
| `features/notifications/services/notification.service.ts` | 726 | **73** ✅ |
| `core/services/contentService.ts` | 736 | **34** ✅ |
| Todos los monolitos de 900-1200+ líneas | varios | ✅ resueltos |

Archivos reducidos pero **NO completamente resueltos** (siguen ≥400 líneas):

| Archivo | Antes | Ahora | Pendiente |
|---|---|---|---|
| `lib/rrweb/session-recorder.ts` | 701 | **328** | Modularizar filtros de privacidad |
| `features/business-panel/components/BusinessAssignCourseModal.tsx` | 672 | **478** | Reducir a ≤200 |
| `features/study-planner/services/course-analysis.service.ts` | 668 | **428** | Reducir a ≤100 (facade) |
| `features/auth/components/OrganizationAuth/OrganizationLoginForm.tsx` | 660 | **435** | Reducir a ≤150 |
| `features/admin/components/LessonModal.tsx` | 669 | **407** | Reducir a ≤200 |

---

## Pendiente — hotspots activos por urgencia

### BLOQUE 1 — Rango 640-649 (P0)

**TAREA 1A — `features/admin/components/AdminEditCompanyModal.tsx` (647)**
```
features/admin/components/admin-edit-company-modal/
├── AdminEditCompanyModal.tsx          # shell ≤100 líneas
├── AdminEditCompanyGeneralTab.tsx
├── AdminEditCompanyBrandingTab.tsx
├── AdminEditCompanyConfigTab.tsx
├── admin-edit-company-modal.service.ts
├── useAdminEditCompanyModalLogic.ts
└── __tests__/
```

**TAREA 1B — `features/business-panel/components/BusinessPanelDashboard.tsx` (640)**
```
features/business-panel/components/business-panel-dashboard/
├── BusinessPanelDashboard.tsx          # orquestador ≤100 líneas
├── BusinessPanelDashboardStats.tsx
├── BusinessPanelDashboardCharts.tsx
├── BusinessPanelDashboardTeams.tsx
├── useBusinessPanelDashboardLogic.ts   # ya existe parcialmente — completar
└── __tests__/
```

---

### BLOQUE 2 — Rango 600-639 (P1)

**TAREA 2A — `features/admin/components/CourseManagement/hooks/useCourseManagementLogic.ts` (613)**
- Hook de gestión de cursos. Separar: módulos, alumnos, form, dialogs.
```
features/admin/components/CourseManagement/hooks/
├── useCourseManagementLogic.ts       # orquestador ≤150 líneas
├── useCourseManagementModules.ts     # CRUD de módulos
├── useCourseManagementStudents.ts    # gestión de alumnos
└── useCourseManagementForm.ts        # estado del formulario
```

**TAREA 2B — `features/business-panel/components/BusinessEditUserModal.tsx` (633)**
- Similar a `EditUserModal.tsx` de admin (ya resuelto). Aplicar el mismo patrón.
```
features/business-panel/components/business-edit-user-modal/
├── BusinessEditUserModal.tsx           # shell ≤100 líneas
├── BusinessEditUserGeneralTab.tsx
├── BusinessEditUserRoleTab.tsx
├── business-edit-user-modal.service.ts
├── useBusinessEditUserModalLogic.ts
└── __tests__/
```

**TAREA 2C — `features/business-panel/components/OrganizationTab.tsx` (623)**
```
features/business-panel/components/organization-tab/
├── OrganizationTab.tsx                  # ≤100 líneas
├── OrganizationGeneralSettings.tsx
├── OrganizationBrandingSettings.tsx
└── OrganizationMembersSettings.tsx
```

---

### BLOQUE 3 — Rango 600-649 (P2)

**TAREA 3A — `app/api/courses/[slug]/lessons/[lessonId]/progress/route.ts` (666)**
- Route crítica de progreso de lecciones. Sin tests. Sin Zod validation.
- Ver `04-nextjs-api-routes.md` TAREA 1B para detalle.

**TAREA 3B — `features/business-panel/components/OrganizationTab.tsx` (655)**
```
features/business-panel/components/organization-tab/
├── OrganizationTab.tsx                  # ≤100 líneas
├── OrganizationGeneralSettings.tsx
├── OrganizationBrandingSettings.tsx
└── OrganizationMembersSettings.tsx
```

**TAREA 3C — `features/admin/components/EditCommunityModal.tsx` (653)**

**TAREA 3D — Archivos parcialmente reducidos que aún superan 400 líneas:**
```bash
# Verificar líneas actuales antes de atacar:
wc -l apps/web/src/features/business-panel/components/BusinessAssignCourseModal.tsx
wc -l apps/web/src/features/admin/components/LessonModal.tsx
wc -l apps/web/src/features/study-planner/services/course-analysis.service.ts
wc -l apps/web/src/features/auth/components/OrganizationAuth/OrganizationLoginForm.tsx
```
Si siguen ≥400: segunda ronda de extracción hasta ≤200.

---

### BLOQUE 4 — Nuevos hotspots descubiertos en worktree actual

Archivos que aparecieron como hotspots en el último barrido y no estaban en ningún backlog:

| Archivo | Líneas | Acción |
|---|---|---|
| `app/api/study-planner/events/[id]/route.ts` | 617 | Extraer services → `events-[id]/services/` |
| `app/api/lia/chat/system-prompt.service.ts` | 617 | Separar por contexto (curso, planner, general) |
| `features/admin/services/adminPrompts.service.ts` | 613 | Facade + split por operación |
| `app/[orgSlug]/business-panel/courses/page.tsx` | 611 | Page controller — debe ser ≤100 líneas |
| `features/study-planner/components/hooks/useStudyPlannerCalendarActions.ts` | 611 | Separar: create, update, delete actions |
| `features/admin/services/adminWorkshops.service.ts` | 642 | Facade + split |
| `features/business-panel/services/hierarchy.service.ts` | 640 | Separar: nodes, members, permissions |
| `features/admin/components/CoursesSection.tsx` | 643 | Extraer sub-secciones |
| `features/admin/components/EditNewsModal.tsx` | 640 | Facade + modularizar |
| `features/business-panel/services/analytics/global-analytics-response.service.ts` | 625 | Creado en refact — separar por métrica |
| `core/components/CustomVideoPlayer/player/useCustomVideoPlayerState.ts` | 626 | Separar estado de reproducción vs UI |
| `features/study-planner/components/hooks/useStudyPlannerLIALogic.ts` | 622 | Separar sesión vs mensajes |

---

## Reglas para Codex

1. **No cambiar comportamiento.** Extraer = mover código, no reescribirlo.
2. **Archivo principal tras extracción ≤200 líneas.** Servicios facade ≤80.
3. **Cada archivo extraído ≥50 líneas debe tener tests.**
4. **`index.ts` barrel en cada directorio nuevo.**
5. **Verificar con `npx vitest run` focalizado** antes de marcar como completo.
6. **No introducir `any` nuevo.**
7. Cada tarea = 1 commit atómico.

## Verificación

```bash
# Confirmar que no quedan archivos ≥700 (excluyendo types/templates)
cd apps/web/src && find . \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*__tests__*" ! -path "*/lib/supabase/types*" \
  ! -path "*/lib/lia-context/config/page-metadata*" \
  ! -path "*/lib/nanobana/templates*" \
  | xargs wc -l | awk '$1>=700' | grep -v total | sort -rn

# Tests focalizados por tarea
cd apps/web && npx vitest run --reporter=verbose src/features/admin/components/admin-dashboard/
```

## Métrica de éxito

- **0 archivos ≥700 líneas** (actualmente 1)
- **≤60 archivos ≥500 líneas** (actualmente 81)
- Cada archivo extraído con al menos 1 suite verde
