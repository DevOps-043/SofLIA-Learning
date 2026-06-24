import dynamic from 'next/dynamic'
import type { ReportsAnalyticsAiInsights, ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { AiInsightsPanel } from './AiInsightsPanel'
import { CourseRiskTable } from './CourseRiskTable'
import { DataQualityPanel } from './DataQualityPanel'
import { LeaderboardPanel } from './LeaderboardPanel'
import { OverviewGrid } from './OverviewGrid'
import { QualityScorePanel } from './QualityScorePanel'
import { ReportsSummaryGrid } from './ReportsSummaryGrid'
import type { ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'
import type { useReportFormatters } from './useReportFormatters'

// Heavy chart panels — imported dynamically so Recharts is not bundled in the initial chunk.
// They render only after the page is interactive; the skeleton prevents layout shift.
const ChartSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800 ${className ?? 'h-64'}`} />
)

const ReportsChartsGrid = dynamic(() => import('./ReportsChartsGrid').then(m => ({ default: m.ReportsChartsGrid })), {
  ssr: false,
  loading: () => <ChartSkeleton className="h-80" />,
})

const SegmentComparisonPanel = dynamic(
  () => import('./SegmentComparisonPanel').then(m => ({ default: m.SegmentComparisonPanel })),
  {
    ssr: false,
    loading: () => <ChartSkeleton className="h-64" />,
  }
)

export function ReportsLoadedContent({
  data,
  formatters,
  insights,
  isExportingInsightsPdf,
  isGeneratingInsights,
  locale,
  theme,
  t,
  onExportInsightsPdf,
  onGenerateInsights,
}: {
  data: ReportsAnalyticsResponse
  formatters: ReturnType<typeof useReportFormatters>
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
    <>
      <div id="tour-reports-overview"><OverviewGrid data={data} theme={theme} t={t} /></div>
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
      <ReportsChartsGrid data={data} formatters={formatters} locale={locale} theme={theme} t={t} />
      <ReportsSummaryGrid data={data} theme={theme} t={t} />
      <QualityScorePanel data={data} theme={theme} t={t} />
      <SegmentComparisonPanel data={data} theme={theme} t={t} />
      <LeaderboardPanel data={data} theme={theme} t={t} />
      <CourseRiskTable courses={data.courses} theme={theme} t={t} />
      <DataQualityPanel data={data} theme={theme} t={t} />
    </>
  )
}
