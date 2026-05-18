# Charts Audit

Snapshot: 2026-05-18

Decision: standardize frontend charts on Recharts.

Rationale:
- Recharts was already the dominant chart library in `apps/web/src`.
- The remaining Nivo usage was limited and replaceable with existing Recharts primitives.
- No `@tremor/react` imports were found in source.
- Removing Nivo/Tremor reduces package surface and avoids maintaining three chart APIs.

Package result:
- Removed from `apps/web/package.json`: all `@nivo/*` packages and `@tremor/react`.
- Kept: `recharts`.

## Inventory

| Componente | Lib usada antes | Tipo de chart | Reemplazo propuesto | Bundle estimado | Estado |
|---|---|---|---|---:|---|
| `features/business-panel/components/course-analytics-tab/DropoffChart.tsx` | `@nivo/bar` | bar | Recharts `BarChart` | - | Done |
| `features/business-panel/components/course-analytics-tab/ProgressDistributionChart.tsx` | `@nivo/pie` | pie/donut | Recharts `PieChart` | - | Done |
| `features/admin/components/StatisticsWidgets/MonthlyGrowthWidget.tsx` | dynamic `@nivo/line` | line | Recharts `LineChart` | - | Done |
| `features/admin/components/StatisticsWidgets/ContentDistributionWidget.tsx` | dynamic `@nivo/pie` | pie/donut | Recharts `PieChart` | - | Done |
| `app/[orgSlug]/business-user/analytics/page-components/BusinessUserAnalyticsPageClient.tsx` | Recharts | mixed analytics | Keep Recharts | 0 | Done |
| `app/admin/companies/[id]/edit/sections/stats-section/StatsActivityChartCard.tsx` | Recharts | area | Keep Recharts | 0 | Done |
| `app/admin/companies/[id]/edit/sections/stats-section/StatsTeamDistributionCard.tsx` | Recharts | pie | Keep Recharts | 0 | Done |
| `features/business-panel/components/BusinessReportsAnalytics/*Chart.tsx` | Recharts | area/bar/pie/radial | Keep Recharts | 0 | Done |
| `features/admin/components/AdvancedCharts/*.tsx` | Recharts | admin analytics | Keep Recharts | 0 | Done |
| `features/admin/components/LiaAnalyticsWidgets/*.tsx` | Recharts | line/bar/pie | Keep Recharts | 0 | Done |
| `features/admin/components/CourseManagement/**/student-progress/*.tsx` | Recharts | learning analytics | Keep Recharts | 0 | Done |

Verification command:

```powershell
rg -n "from ['\"](@nivo|recharts|@tremor/react)|import\(['\"](@nivo|recharts|@tremor/react)" "apps/web/src"
```

Expected result after this remediation: only `recharts` imports.
