import dynamic from 'next/dynamic'
import type { ReportsAnalyticsAiInsights, ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { AcademicPerformanceCards } from './AcademicPerformanceCards'
import { AiInsightsPanel } from './AiInsightsPanel'
import { CourseRiskTable } from './CourseRiskTable'
import { DataQualityPanel } from './DataQualityPanel'
import { ExecutiveKpiGrid } from './ExecutiveKpiGrid'
import { LearningFunnelChart } from './LearningFunnelChart'
import { NotesCompositionPanel } from './NotesCompositionPanel'
import { PlannerInsightsPanel } from './PlannerInsightsPanel'
import { RankingTablesPanel } from './RankingTablesPanel'
import { RiskPrioritiesTable } from './RiskPrioritiesTable'
import { SegmentPerformancePanel } from './SegmentPerformancePanel'
import { SofLIAQualityPanel } from './SofLIAQualityPanel'
import type { ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'

const ChartSkeleton = () => <div className="h-80 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />

const LearningTrendChart = dynamic(
  () => import('./LearningTrendChart').then((m) => ({ default: m.LearningTrendChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

const OrgRadarChart = dynamic(
  () => import('./OrgRadarChart').then((m) => ({ default: m.OrgRadarChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

const TeamScatterChart = dynamic(
  () => import('./TeamScatterChart').then((m) => ({ default: m.TeamScatterChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

const WorkforceStatusPanel = dynamic(
  () => import('./WorkforceStatusPanel').then((m) => ({ default: m.WorkforceStatusPanel })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

const ComplianceBarChart = dynamic(
  () => import('./ComplianceBarChart').then((m) => ({ default: m.ComplianceBarChart })),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

export function ReportsLoadedContent({
  data,
  insights,
  isExportingInsightsPdf,
  isGeneratingInsights,
  theme,
  t,
  onExportInsightsPdf,
  onGenerateInsights,
}: {
  data: ReportsAnalyticsResponse
  insights: ReportsAnalyticsAiInsights | null
  isExportingInsightsPdf: boolean
  isGeneratingInsights: boolean
  locale: ReportsAnalyticsLocale
  theme: ThemeTokens
  t: ReportsAnalyticsT
  onExportInsightsPdf: () => void
  onGenerateInsights: () => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. KPIs ejecutivos */}
      <div id="tour-reports-kpi">
        <ExecutiveKpiGrid data={data} theme={theme} t={t} />
      </div>

      {/* 2. Estado de la fuerza laboral */}
      <div id="tour-reports-workforce">
        <WorkforceStatusPanel data={data} theme={theme} t={t} />
      </div>

      {/* 3. Radar multidimensional de salud org */}
      <div id="tour-reports-radar">
        <OrgRadarChart data={data} theme={theme} t={t} />
      </div>

      {/* 4. Cumplimiento por área */}
      <div id="tour-reports-compliance">
        <ComplianceBarChart data={data} theme={theme} t={t} />
      </div>

      {/* 5. Usuarios en riesgo */}
      <div id="tour-reports-risk-users">
        <RiskPrioritiesTable priorityUsers={data.priorityUsers} theme={theme} t={t} />
      </div>

      {/* 6. Embudo de aprendizaje */}
      <div id="tour-reports-funnel">
        <LearningFunnelChart data={data} theme={theme} t={t} />
      </div>

      {/* 7. Riesgo por curso */}
      <div id="tour-reports-course-risk">
        <CourseRiskTable courses={data.courses} theme={theme} t={t} />
      </div>

      {/* 8. Mapa de posicionamiento de equipos */}
      <div id="tour-reports-scatter">
        <TeamScatterChart data={data} theme={theme} t={t} />
      </div>

      {/* 9. Clasificación de aprovechamiento */}
      <div id="tour-reports-ranking">
        <RankingTablesPanel data={data} theme={theme} t={t} />
      </div>

      {/* 10. Desempeño por segmento */}
      <div id="tour-reports-segments">
        <SegmentPerformancePanel data={data} theme={theme} t={t} />
      </div>

      {/* 11. Tendencia en el tiempo */}
      <div id="tour-reports-trend">
        <LearningTrendChart data={data} theme={theme} t={t} />
      </div>

      {/* 12. Rendimiento académico */}
      <div id="tour-reports-academic">
        <AcademicPerformanceCards data={data} theme={theme} t={t} />
      </div>

      {/* 13. Calidad SofLIA */}
      <div id="tour-reports-soflia-quality">
        <SofLIAQualityPanel data={data} theme={theme} t={t} />
      </div>

      {/* 14. Planificador de estudio */}
      <div id="tour-reports-planner">
        <PlannerInsightsPanel data={data} theme={theme} t={t} />
      </div>

      {/* 15. Notas y apuntes */}
      <div id="tour-reports-notes">
        <NotesCompositionPanel data={data} theme={theme} t={t} />
      </div>

      {/* 16. Análisis IA */}
      <div id="tour-reports-insights">
        <AiInsightsPanel
          insights={insights}
          isExportingPdf={isExportingInsightsPdf}
          isGenerating={isGeneratingInsights}
          theme={theme}
          t={t}
          onExportPdf={onExportInsightsPdf}
          onGenerate={onGenerateInsights}
        />
      </div>

      {/* 17. Calidad de datos */}
      <DataQualityPanel data={data} theme={theme} t={t} />
    </div>
  )
}
