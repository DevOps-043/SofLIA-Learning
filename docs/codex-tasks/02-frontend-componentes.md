# CODEX TASK — Frontend: Componentes y Hooks

**Peso en TDI:** parte del 20% de Arquitectura + parte del 15% de Calidad de Código
**Deuda residual estimada:** ~12%
**Fecha de corte:** 2026-04-01

---

## Lo que ya está hecho (NO tocar)

- Todos los page controllers (`app/**/page.tsx`) son wrappers finos ≤100 líneas ✅
- `CourseLearnPageShell.tsx` creado como shell del dominio learn ✅
- `useLiaSidePanelLogic.ts` bajado de 790 a 436 ✅
- `useContextualVoiceGuideLogic.ts` bajado de 785 a 208 ✅
- `useLearnPageLogic.ts` bajado de 808 a 571 ✅ (aún pendiente reducción adicional)
- Todos los modales de admin/business con prefijo `admin-*` / `business-*` modularizados ✅
- `ModernNavbar.tsx` bajado de 866 a 136 con `modern-navbar/*` ✅
- `OnboardingAgent.tsx` bajado de 808 a 103 ✅

---

## Pendiente — ordenado por impacto

### BLOQUE 1 — Hooks de lógica pesados (mayor riesgo de regresión)

**TAREA 1A — `features/study-planner/components/hooks/useStudyPlannerCalendarLogic.ts` (727 líneas reales)**

> ⚠️ El documento reporta 643 líneas. El barrido real del worktree da 727. Usar el conteo real.

Este hook orquesta el calendario completo del study planner: eventos, navegación de fechas,
sync con Google/Microsoft, estado de la UI del calendario y handlers de drag-and-drop.

Separación esperada:
```
features/study-planner/components/hooks/
├── useStudyPlannerCalendarLogic.ts      # orquestador ≤150 líneas
├── useStudyPlannerCalendarEvents.ts     # carga y CRUD de eventos
├── useStudyPlannerCalendarSync.ts       # sincronización con Google/Microsoft
├── useStudyPlannerCalendarNavigation.ts # navegación de fechas y vistas
└── useStudyPlannerCalendarDrag.ts       # drag-and-drop si aplica
```

Tests esperados:
```
features/study-planner/components/hooks/__tests__/
└── useStudyPlannerCalendarLogic.test.ts  # renderHook + act
```

**TAREA 1B — `features/study-planner/services/soflia-context.service.ts` (702 líneas)**
→ Ver detalle en `01-arquitectura-modularidad.md` TAREA 1B

**TAREA 1C — `features/business-panel/services/businessUsers.server.service.ts` (635 líneas)**

Servicio server-side de usuarios del business panel. Concentra queries de Supabase,
transformaciones, filtros y paginación.

Separación esperada:
```
features/business-panel/services/business-users/
├── index.ts
├── types.ts
├── business-users-query.service.ts      # queries paginadas y búsqueda
├── business-users-mutation.service.ts   # update, rol, estado
├── business-users-stats.service.ts      # métricas y conteos
├── business-users.server.service.ts     # facade fina ≤80 líneas
└── __tests__/
    └── business-users.service.test.ts
```

---

### BLOQUE 2 — Componentes UI grandes (≥600 líneas)

**TAREA 2A — `features/business-panel/components/BusinessPanelDashboard.tsx` (640 líneas)**

Dashboard principal del panel business con stats, gráficas y resumen de usuarios.

```
features/business-panel/components/business-panel-dashboard/
├── BusinessPanelDashboard.tsx           # orquestador ≤100 líneas
├── BusinessPanelDashboardStats.tsx
├── BusinessPanelDashboardCharts.tsx
├── BusinessPanelDashboardTeams.tsx
├── useBusinessPanelDashboardLogic.ts    # ya existe parcialmente, completar
└── __tests__/
```

**TAREA 2B — `features/admin/components/AdminEditCompanyModal.tsx` (647 líneas)**

Modal de edición de empresa: datos generales, branding, uploads, configuración.

```
features/admin/components/admin-edit-company-modal/
├── AdminEditCompanyModal.tsx            # shell ≤100 líneas
├── AdminEditCompanyGeneralTab.tsx
├── AdminEditCompanyBrandingTab.tsx
├── AdminEditCompanyConfigTab.tsx
├── admin-edit-company-modal.service.ts
├── useAdminEditCompanyModalLogic.ts
└── __tests__/
```

**TAREA 2C — `features/auth/components/OrganizationAuth/OrganizationRegisterForm.tsx` (641 líneas)**

Formulario de registro organizacional con validación Zod, steps y SSO.

```
features/auth/components/OrganizationAuth/organization-register-form/
├── OrganizationRegisterForm.tsx         # shell ≤120 líneas
├── OrganizationRegisterStep1.tsx        # datos básicos
├── OrganizationRegisterStep2.tsx        # contraseña y confirmación
├── OrganizationRegisterSSOButtons.tsx
├── useOrganizationRegisterFormLogic.ts
└── __tests__/
```

---

### BLOQUE 3 — Shell que acumuló deuda post-extracción

**TAREA 3A — `app/courses/[slug]/learn/CourseLearnPageShell.tsx` (525 líneas)**

Este archivo fue creado como shell del dominio learn pero acumuló demasiado. Necesita
una segunda extracción.

```
app/courses/[slug]/learn/
├── CourseLearnPageShell.tsx             # orquestador ≤150 líneas
├── CourseLearnSidebar.tsx
├── CourseLearnContent.tsx
├── CourseLearnProgress.tsx
└── CourseLearnNavigation.tsx
```

**TAREA 3B — `features/courses/hooks/useLearnPageLogic.ts` (571 líneas)**

Reducción adicional: extraer la lógica de workshop assistant y la gestión de progreso.

```
features/courses/hooks/
├── useLearnPageLogic.ts                 # ≤250 líneas, orquestador
├── useLearnPageProgress.ts              # progreso de lecciones
├── useLearnPageWorkshopAssistant.ts     # ya iniciado, completar
└── __tests__/
```

---

## Reglas para Codex en este módulo

1. **Mobile-first.** No alterar breakpoints ni clases Tailwind existentes.
2. **No agregar `'use client'`** a componentes Server si no lo necesitan.
3. **Props explícitas.** Cada sub-componente debe tener su interfaz de props en `types.ts`.
4. **Framer Motion:** No eliminar animaciones existentes al extraer.
5. **Zustand stores:** No mover lógica de stores a hooks locales.
6. **renderHook + act** para todos los custom hooks.
7. Usar `cn()` de `shared/utils/cn.ts` en todos los nuevos componentes.

## Verificación

```bash
# Desde apps/web/
npx vitest run --reporter=verbose src/features/study-planner/components/hooks/__tests__/
npx vitest run --reporter=verbose src/features/business-panel/services/business-users/
npx vitest run --reporter=verbose src/features/auth/components/OrganizationAuth/

# Revisar que ningún archivo nuevo supera 300 líneas salvo shells justificados
find apps/web/src -name "*.tsx" -not -path "*__tests__*" | xargs wc -l | sort -rn | head -20
```

## Métrica de éxito

- `useStudyPlannerCalendarLogic.ts` ≤ 150 líneas
- `businessUsers.server.service.ts` ≤ 80 líneas (facade)
- `CourseLearnPageShell.tsx` ≤ 150 líneas
- `useLearnPageLogic.ts` ≤ 250 líneas
- 0 nuevos archivos creados >400 líneas
