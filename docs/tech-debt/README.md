# Tech Debt Baselines

Snapshot: 2026-05-18

## Baseline Commands

| Command | Output | Status |
|---|---|---|
| `npm run type-check --workspace=apps/web` | `docs/tech-debt/typecheck-baseline.txt` | Timeout; official npm script still leaves child `tsc` processes alive. Root slices identify `src/app/**` and `src/features/**` as remaining hotspots. |
| `npm run lint --workspace=apps/web` | `docs/tech-debt/lint-baseline.txt` | Failed with 18 errors and 1216 warnings. |

## ESLint Summary

| Metric | Count |
|---|---:|
| Files with findings | 485 |
| Errors | 18 |
| Warnings | 1216 |
| `@typescript-eslint/no-explicit-any` warnings | 155 |
| `no-console` warnings | 894 |
| `select('*')` warnings | 167 |

## Latest Validation After This Remediation Pass

| Command | Result |
|---|---|
| `npm run lint --workspace=apps/web` | Passed with 0 errors and 4232 warnings. |
| Focal production type-check for touched invite-link/student-detail files | Passed with `tsc --noEmit` using a temporary config extending `tsconfig.typecheck.json`. |
| `npm run test --workspace=apps/web -- "src/app/api/business/user-groups/__tests__/schema.test.ts"` | Passed: 1 file, 5 tests. |
| Focal ESLint for user-groups Zod route batch | Passed with 0 errors and 0 warnings. |
| Focal ESLint for TD-001 low-risk TypeScript fixes | Passed with 0 errors and 0 warnings. |
| `features/business-panel` temporary type-check slice | Improved from first blocker set to the next set of contract drift errors; still non-zero. |
| `npm run type-check --workspace=apps/web` | Still blocked by timeout/process cleanup; see `typecheck-baseline.txt`. |

## `any` Priority Snapshot

| Priority surface | Current signal |
|---|---:|
| `apps/web/src/**/*.ts(x)` explicit `: any` scan | 13 matches |
| `apps/web/src/app/api/**` `withZodBody` matches | 20 matches |
| `apps/web/src/app/api/**` remaining `await request.json()` calls | 207 matches |

## Top 20 Files By ESLint Findings

| Archivo | # errores TS | # warnings ESLint | Categoria dominante | Owner asignado | Fase |
|---|---:|---:|---|---|---|
| `apps/web/src/shared/utils/__tests__/animations.test.ts` | 0 | 40 | `@typescript-eslint/no-explicit-any` | TBD | 1.2 |
| `apps/web/src/lib/lia-context/__tests__/phase3-hooks.test.ts` | 0 | 29 | `no-console` | TBD | 1.6 |
| `apps/web/src/lib/lia-context/__tests__/phase4-expansion.test.ts` | 0 | 27 | `no-console` | TBD | 1.6 |
| `apps/web/src/lib/lia-context/__tests__/phase2-simple.test.ts` | 0 | 19 | `no-console` | TBD | 1.6 |
| `apps/web/src/lib/lia-context/__tests__/error-context.test.ts` | 0 | 16 | `no-console` | TBD | 1.6 |
| `apps/web/src/lib/lia-context/__tests__/page-context.test.ts` | 0 | 16 | `no-console` | TBD | 1.6 |
| `apps/web/src/features/study-planner/services/__tests__/plan-adjustment.service.test.ts` | 0 | 15 | `@typescript-eslint/no-explicit-any` | TBD | 1.2 |
| `apps/web/src/features/admin/services/admin-workshops/workshops-mutation.service.ts` | 0 | 13 | `no-console` | TBD | 1.6 |
| `apps/web/src/lib/lia-context/__tests__/optional-tests/test-runner.ts` | 0 | 12 | `no-console` | TBD | 1.6 |
| `apps/web/src/app/api/communities/[slug]/reports/[reportId]/resolve/route.ts` | 0 | 12 | `no-console` | TBD | 1.6 |
| `apps/web/src/features/study-planner/services/calendar-microsoft.service.ts` | 0 | 11 | `no-console` | TBD | 1.6 |
| `apps/web/src/features/notifications/services/__tests__/notification.actions.service.test.ts` | 0 | 10 | `@typescript-eslint/no-explicit-any` | TBD | 1.2 |
| `apps/web/src/features/study-planner/services/__tests__/lia-prompt-formatter.service.test.ts` | 0 | 10 | `@typescript-eslint/no-explicit-any` | TBD | 1.2 |
| `apps/web/src/app/api/communities/[slug]/posts/[postId]/report/route.ts` | 0 | 9 | `no-console` | TBD | 1.6 |
| `apps/web/src/core/services/autoTranslation.service.ts` | 0 | 9 | `no-console` | TBD | 1.6 |
| `apps/web/src/features/admin/components/admin-dashboard/service.ts` | 0 | 8 | `@typescript-eslint/no-explicit-any` | TBD | 1.2 |
| `apps/web/src/features/admin/services/__tests__/admin-users.query.service.test.ts` | 0 | 8 | `@typescript-eslint/no-explicit-any` | TBD | 1.2 |
| `apps/web/src/app/api/study-planner/events/route.ts` | 0 | 8 | `no-console` | TBD | 1.6 |
| `apps/web/src/app/api/business/invite-links/[id]/route.ts` | 0 | 8 | `no-console` | TBD | 1.4 |
| `apps/web/src/app/api/[orgSlug]/business/invite-links/[id]/route.ts` | 0 | 8 | `no-console` | TBD | 1.4 |

## TypeScript Baseline Blocker

`npm run type-check --workspace=apps/web` still does not complete reliably on this workstation. The process emits the npm script header only, then keeps `tsc --noEmit -p tsconfig.typecheck.json` running without diagnostics. Residual `tsc` process trees were terminated manually after each timeout to avoid background CPU usage.

The latest isolation pass shows `core`, `lib`, and `shared` complete quickly, while `app` and `features` remain the expensive roots. One confirmed hotspot, `apps/web/src/app/api/admin/courses/[id]/student-details/[userId]/route.ts`, was remediated locally with `fromLoose<T>()` and now type-checks as an isolated file in about 4 seconds. P3 slice retries narrowed the current hotspots to large `app/api/*` domains plus `features/admin` and `features/courses` timeouts; `features/business-panel` and `features/study-planner` now emit concrete TS errors before completion. The first low-risk `features/business-panel` tranche is fixed; remaining errors require a wider contract cleanup.

This means Tarea 1.3 cannot be safely closed yet: enabling `ignoreBuildErrors: false` before a complete type-check baseline would turn build failures into an unmeasured production risk.
