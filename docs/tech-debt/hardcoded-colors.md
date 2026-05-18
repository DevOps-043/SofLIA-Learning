# Hardcoded Colors Audit

Snapshot: 2026-05-18

Scope audited:
- `apps/web/src/**/*.ts`
- `apps/web/src/**/*.tsx`

Command:

```powershell
rg -n --glob "*.{ts,tsx}" "#[0-9A-Fa-f]{6}\b" "apps/web/src"
```

Current result:
- Matches: 3010
- Files: 503
- ESLint guardrail: active as `warn` in `apps/web/eslint.config.mjs`

The guardrail is intentionally non-blocking while this baseline is this large. Promoting it to `error` before the inventory is remediated would block unrelated PRs and violate the incremental remediation rule.

## Category Rules

| Categoria | Definition | Replacement |
|---|---|---|
| Branded | SofLIA or organization identity colors such as `#0A2540` and `#00D4B3` | `primaryColor` / `accentColor` from `OrganizationStylesContext`, or Tailwind `primary` / `accent` when organization branding is not in scope |
| Tema | Repeated design-system colors for surface, text, border, success, warning, error | Tailwind classes (`bg-gray-900`, `text-gray-500`, `border-gray-200`) or CSS variables |
| Specific | Chart palettes, generated document snapshots, third-party widget tokens, uploaded/org colors | Centralized constants or CSS variables with domain-specific names |

## Top Hotspots

| Archivo | Matches | Categoria dominante | Reemplazo propuesto | Estado |
|---|---:|---|---|---|
| `apps/web/src/features/admin/components/CourseManagement/courseManagementTheme.ts` | 56 | Tema | Move to CSS variables / Tailwind tokens | Pendiente |
| `apps/web/src/features/business-panel/config/preset-themes.ts` | 52 | Branded | Move presets to named theme tokens | Pendiente |
| `apps/web/src/features/admin/components/CourseManagement/course-stats/CourseStatsChartSections.tsx` | 37 | Specific | Chart palette tokens | Pendiente |
| `apps/web/src/features/admin/components/add-user-modal/AddUserModalTabs.tsx` | 33 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/admin/components/QuizBuilder.tsx` | 33 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/study-planner/components/calendar/CalendarEventModal.tsx` | 31 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/landing/components/business/PricingSection.tsx` | 29 | Branded | Tailwind `primary` / `accent` | Pendiente |
| `apps/web/src/features/study-planner/components/StudyPlannerCourseSelectorModal.tsx` | 27 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/business-panel/hooks/useBusinessPanelTheme.ts` | 27 | Branded | CSS variables plus org overrides | Pendiente |
| `apps/web/src/features/admin/components/material-modal/PDFMaterialContent.tsx` | 24 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/admin/components/AdminPendingCoursesPage.tsx` | 24 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/landing/components/PlatformOverview.tsx` | 24 | Branded | Tailwind `primary` / `accent` | Pendiente |
| `apps/web/src/app/conocer-lia/content.ts` | 24 | Branded | Data tokens resolved inside components | Pendiente |
| `apps/web/src/features/admin/components/edit-user-modal/EditUserPersonalTab.tsx` | 23 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/study-planner/components/CourseSelectionStep.tsx` | 23 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/core/components/AIChatAgent/ChatHeader.tsx` | 23 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/study-planner/components/dashboard/StudyPlannerDashboardAssistant.tsx` | 22 | Branded | Theme tokens | Pendiente |
| `apps/web/src/features/admin/components/CourseManagement/LessonResourcePanel.tsx` | 22 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/auth/components/ResetPasswordForm/ResetPasswordForm.tsx` | 22 | Tema | Tailwind classes | Pendiente |
| `apps/web/src/features/admin/components/CourseManagement/ModuleCard.tsx` | 22 | Tema | Tailwind classes | Pendiente |

## Line-Level Samples

| Archivo:linea | Color encontrado | Categoria | Reemplazo aplicado | Estado |
|---|---|---|---|---|
| `apps/web/src/app/conocer-lia/page.tsx:30` | `#0F1419` | Tema | `dark:bg-gray-900` | Pendiente |
| `apps/web/src/app/conocer-lia/content.ts:35` | `#00D4B3` | Branded | Resolve from `accentColor` where rendered | Pendiente |
| `apps/web/src/app/auth/page.tsx:32` | `#F8F9FA` | Tema | `via-gray-50` / CSS variable | Pendiente |
| `apps/web/src/features/business-panel/hooks/useBusinessPanelTheme.ts:105` | `#0A2540` | Branded | `var(--color-primary)` fallback | Pendiente |
| `apps/web/src/features/admin/components/StatisticsWidgets/MonthlyGrowthWidget.tsx` | Nivo theme hex literals | Specific | Recharts + CSS variables | Done |
| `apps/web/src/features/admin/components/StatisticsWidgets/ContentDistributionWidget.tsx` | Nivo theme hex literals | Specific | Recharts + CSS variables | Done |

## Next Remediation Order

1. Centralize `useBusinessPanelTheme` fallbacks into CSS variables because it feeds many downstream panels.
2. Convert admin CourseManagement theme constants into Tailwind/CSS variable tokens.
3. Convert landing/conocer-lia branded class strings to `primary` / `accent` Tailwind tokens.
4. Move chart-specific palettes to named constants using CSS variables where the chart API accepts color strings.
5. Promote the ESLint guardrail from `warn` to `error` once file count is below 10.
