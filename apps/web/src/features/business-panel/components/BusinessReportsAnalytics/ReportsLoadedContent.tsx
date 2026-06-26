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
      <ExecutiveKpiGrid data={data} theme={theme} t={t} />

      {/* 2. Estado de la fuerza laboral — headcounts visuales para C-Level */}
      <WorkforceStatusPanel data={data} theme={theme} t={t} />

      {/* 3. Radar multidimensional de salud org */}
      <OrgRadarChart data={data} theme={theme} t={t} />

      {/* 4. Cumplimiento por área — gráfica más accionable para RRHH */}
      <ComplianceBarChart data={data} theme={theme} t={t} />

      {/* 5. Usuarios en riesgo — para seguimiento inmediato */}
      <RiskPrioritiesTable priorityUsers={data.priorityUsers} theme={theme} t={t} />

      {/* 6. Embudo — dónde se pierde el avance */}
      <LearningFunnelChart data={data} theme={theme} t={t} />

      {/* 7. Riesgo por curso */}
      <CourseRiskTable courses={data.courses} theme={theme} t={t} />

      {/* 8. Mapa de posicionamiento de equipos */}
      <TeamScatterChart data={data} theme={theme} t={t} />

      {/* 9. Clasificación de aprovechamiento */}
      <RankingTablesPanel data={data} theme={theme} t={t} />

      {/* 10. Desempeño por segmento */}
      <SegmentPerformancePanel data={data} theme={theme} t={t} />

      {/* 11. Tendencia en el tiempo */}
      <LearningTrendChart data={data} theme={theme} t={t} />

      {/* 12. Rendimiento académico */}
      <AcademicPerformanceCards data={data} theme={theme} t={t} />

      {/* 13. Calidad SofLIA — métricas de uso y calidad de la IA */}
      <SofLIAQualityPanel data={data} theme={theme} t={t} />

      {/* 14. Planificador de estudio — adherencia y varianza de tiempo */}
      <PlannerInsightsPanel data={data} theme={theme} t={t} />

      {/* 15. Notas — composición y adopción */}
      <NotesCompositionPanel data={data} theme={theme} t={t} />

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
