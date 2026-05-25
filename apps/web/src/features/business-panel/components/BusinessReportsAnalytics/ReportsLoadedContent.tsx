import type { ReportsAnalyticsAiInsights, ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { AiInsightsPanel } from './AiInsightsPanel'
import { CourseRiskTable } from './CourseRiskTable'
import { DataQualityPanel } from './DataQualityPanel'
import { LeaderboardPanel } from './LeaderboardPanel'
import { OverviewGrid } from './OverviewGrid'
import { QualityScorePanel } from './QualityScorePanel'
import { ReportsChartsGrid } from './ReportsChartsGrid'
import { ReportsSummaryGrid } from './ReportsSummaryGrid'
import { SegmentComparisonPanel } from './SegmentComparisonPanel'
import type { ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'
import type { useReportFormatters } from './useReportFormatters'

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
