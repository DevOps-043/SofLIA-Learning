import { ShieldCheck } from 'lucide-react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { SummaryCard } from './SummaryCard'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function QualityScorePanel({ data, theme, t }: { data: ReportsAnalyticsResponse; theme: ThemeTokens; t: ReportsAnalyticsT }) {
  return (
    <SummaryCard
      title={t('reportsAnalytics.sections.responseQuality')}
      icon={ShieldCheck}
      theme={theme}
      rows={[
        [t('reportsAnalytics.metrics.qualityScore'), `${data.quality.overallScore}%`],
        [t('reportsAnalytics.metrics.quizScore'), `${data.quality.quizScore}%`],
        [t('reportsAnalytics.metrics.activityScore'), `${data.quality.activityScore}%`],
        [t('reportsAnalytics.metrics.sofliaScore'), `${data.quality.sofliaScore}%`],
        [t('reportsAnalytics.metrics.offTopicRate'), `${data.quality.offTopicRate}%`],
        [t('reportsAnalytics.metrics.helpRate'), `${data.quality.helpRate}%`],
      ]}
    />
  )
}
