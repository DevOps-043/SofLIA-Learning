# CODEX TASK — Frontend: Componentes y Hooks

**Peso en TDI:** parte del 20% de Arquitectura
**Deuda residual actual:** ~12%
**Fecha de corte:** 2026-04-02 (worktree real)

---

## Ya resuelto — NO tocar

- `OrganizationRegisterForm.tsx` 684 → **102** ✅
- `businessUsers.server.service.ts` 635 → **76** ✅
- `OrganizationLoginForm.tsx` 660 → **435** (parcial, aún pendiente)
- `useLiaSidePanelLogic.ts` 790 → **436** ✅
- `useContextualVoiceGuideLogic.ts` 785 → **208** ✅
- Todos los page controllers de `app/**/page.tsx` son wrappers finos ≤100 líneas ✅
- `ModernNavbar.tsx` → ahora orquesta `modern-navbar/*` ✅

---

## Pendiente — ordenado por impacto

### BLOQUE 1 — Hooks de lógica pesados

**TAREA 1A — `features/study-planner/hooks/useStudyPlannerMessageHandler.ts` (676 líneas)**

Creado durante la refactorización. Maneja mensajes del chat del planner: guardrails, schedule, confirmaciones.

```
features/study-planner/hooks/
├── useStudyPlannerMessageHandler.ts      # orquestador ≤150 líneas
├── useStudyPlannerMessageGuardrails.ts
├── useStudyPlannerMessageSchedule.ts
├── useStudyPlannerMessageConfirmation.ts
└── __tests__/useStudyPlannerMessageHandler.test.ts
```

**TAREA 1B — `features/study-planner/components/hooks/useStudyPlannerCalendarActions.ts` (611 líneas)**

Maneja acciones del calendario del planner (crear, editar, eliminar eventos).

```
features/study-planner/components/hooks/
├── useStudyPlannerCalendarActions.ts      # orquestador ≤100 líneas
├── useStudyPlannerCalendarCreateAction.ts
├── useStudyPlannerCalendarUpdateAction.ts
├── useStudyPlannerCalendarDeleteAction.ts
└── __tests__/
```

**TAREA 1C — `features/study-planner/components/hooks/useStudyPlannerLIALogic.ts` (622 líneas)**

Separar lógica de sesión vs lógica de mensajes LIA.

```
features/study-planner/components/hooks/
├── useStudyPlannerLIALogic.ts          # orquestador ≤150 líneas
├── useStudyPlannerLIASession.ts        # gestión de sesión
├── useStudyPlannerLIAMessages.ts       # procesamiento de mensajes
└── __tests__/
```

---

### BLOQUE 2 — Componentes UI grandes (600-679 líneas)

**TAREA 2A — `features/business-panel/components/BusinessPanelDashboard.tsx` (679 líneas)**

```
features/business-panel/components/business-panel-dashboard/
├── BusinessPanelDashboard.tsx          # orquestador ≤100 líneas
├── BusinessPanelDashboardStats.tsx
├── BusinessPanelDashboardCharts.tsx
├── BusinessPanelDashboardTeams.tsx
├── useBusinessPanelDashboardLogic.ts   # ya existe parcialmente — completar
└── __tests__/business-panel-dashboard.service.test.ts
```

**TAREA 2B — `features/business-panel/components/BusinessEditUserModal.tsx` (677 líneas)**

Mismo patrón que `EditUserModal.tsx` de admin (ya resuelto con `-82.7%`).

```
features/business-panel/components/business-edit-user-modal/
├── BusinessEditUserModal.tsx           # shell ≤100 líneas
├── BusinessEditUserGeneralTab.tsx
├── BusinessEditUserRoleTab.tsx
├── business-edit-user-modal.service.ts
├── useBusinessEditUserModalLogic.ts
└── __tests__/business-edit-user-modal.service.test.ts
```

**TAREA 2C — `features/business-panel/components/OrganizationTab.tsx` (655 líneas)**

```
features/business-panel/components/organization-tab/
├── OrganizationTab.tsx                  # ≤100 líneas
├── OrganizationGeneralSettings.tsx
├── OrganizationBrandingSettings.tsx
├── OrganizationMembersSettings.tsx
├── organization-tab.service.ts
└── __tests__/
```

**TAREA 2D — `features/admin/components/EditCommunityModal.tsx` (653 líneas)**

```
features/admin/components/edit-community-modal/
├── EditCommunityModal.tsx              # shell ≤100 líneas
├── EditCommunityGeneralTab.tsx
├── EditCommunityMembersTab.tsx
├── edit-community-modal.service.ts
├── useEditCommunityModalLogic.ts
└── __tests__/
```

**TAREA 2E — `features/admin/components/CoursesSection.tsx` (643 líneas)**

```
features/admin/components/courses-section/
├── CoursesSection.tsx                   # orquestador ≤100 líneas
├── CoursesSectionFilters.tsx
├── CoursesSectionTable.tsx
├── CoursesSectionActions.tsx
└── __tests__/
```

---

### BLOQUE 3 — Page controllers que siguen siendo grandes

**TAREA 3A — `app/[orgSlug]/business-panel/courses/page.tsx` (611 líneas)**

Los page controllers deben ser wrappers finos ≤100 líneas.

```bash
# Verificar líneas actuales
wc -l "apps/web/src/app/[orgSlug]/business-panel/courses/page.tsx"
```

Extracción esperada:
```
app/[orgSlug]/business-panel/courses/
├── page.tsx                               # ≤80 líneas — solo layout + hook
├── components/
│   ├── BusinessPanelCoursesHeader.tsx
│   ├── BusinessPanelCoursesList.tsx
│   └── BusinessPanelCoursesFilters.tsx
└── hooks/
    └── useBusinessPanelCoursesPageLogic.ts
```

---

### BLOQUE 4 — Archivos parcialmente reducidos (segunda ronda)

Estos archivos fueron reducidos en lotes anteriores pero siguen por encima de 400 líneas:

```bash
# Verificar estado actual antes de atacar
wc -l apps/web/src/features/business-panel/components/BusinessAssignCourseModal.tsx  # 478
wc -l apps/web/src/features/admin/components/LessonModal.tsx                         # 407
wc -l apps/web/src/features/study-planner/services/course-analysis.service.ts       # 428
wc -l apps/web/src/features/auth/components/OrganizationAuth/OrganizationLoginForm.tsx # 435
```

Para cada uno: segunda ronda de extracción hasta llegar a ≤200 líneas (shell + servicios separados).

---

### BLOQUE 5 — Shell que acumuló deuda post-extracción

**TAREA 5A — `app/courses/[slug]/learn/CourseLearnPageShell.tsx` (525 líneas)**

Shell creado en la refactorización que acumuló lógica.

```
app/courses/[slug]/learn/
├── CourseLearnPageShell.tsx             # ≤150 líneas
├── CourseLearnSidebar.tsx
├── CourseLearnContent.tsx
└── CourseLearnNavigation.tsx
```

**TAREA 5B — `features/courses/components/learn/ContentRenderers.tsx` (643 líneas)**

Creado durante la extracción de `learn/page.tsx`. Renderiza tipos de contenido.

```
features/courses/components/learn/content-renderers/
├── ContentRenderers.tsx                 # dispatcher ≤80 líneas
├── VideoContentRenderer.tsx
├── ScormContentRenderer.tsx
├── QuizContentRenderer.tsx
├── TextContentRenderer.tsx
└── __tests__/
```

---

## Reglas para Codex

1. **Mobile-first.** No alterar breakpoints ni clases Tailwind existentes.
2. **No agregar `'use client'`** a componentes Server si no lo necesitan.
3. **Props explícitas.** Cada sub-componente tiene su interfaz en `types.ts`.
4. **Framer Motion:** No eliminar animaciones existentes al extraer.
5. **`renderHook` + `act`** de `@testing-library/react` para todos los custom hooks.
6. **Cada archivo nuevo ≥50 líneas necesita tests.**

## Verificación

```bash
# Ningún componente nuevo debe superar 300 líneas
cd apps/web/src && find . \( -name "*.tsx" \) \
  ! -path "*__tests__*" ! -path "*node_modules*" \
  | xargs wc -l | awk '$1>=300' | grep -v total | sort -rn | head -20

# Tests focalizados
cd apps/web && npx vitest run --reporter=verbose \
  src/features/study-planner/hooks/__tests__/ \
  src/features/business-panel/components/business-panel-dashboard/
```

## Métrica de éxito

- `useStudyPlannerMessageHandler.ts` ≤ 150 líneas
- `BusinessPanelDashboard.tsx` ≤ 100 líneas
- `BusinessEditUserModal.tsx` ≤ 100 líneas
- `ContentRenderers.tsx` ≤ 80 líneas (dispatcher)
- `BusinessAssignCourseModal.tsx` ≤ 200 líneas
- 0 page controllers (`page.tsx`) con más de 100 líneas
