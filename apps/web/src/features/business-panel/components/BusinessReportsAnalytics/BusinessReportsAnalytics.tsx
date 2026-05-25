'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { useBusinessReportsAnalytics } from '../../hooks/useBusinessReportsAnalytics'
import { FiltersBar } from './FiltersBar'
import { ReportsHero } from './ReportsHero'
import { ReportsLoadedContent } from './ReportsLoadedContent'
import { StatePanel } from './StatePanel'
import { isReportsAnalyticsLocale, useReportsAnalyticsText } from './translations'
import { useReportFormatters } from './useReportFormatters'
import type { ReportsAnalyticsLocale } from './types'

export function BusinessReportsAnalytics() {
  const { t: baseT, i18n } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const analytics = useBusinessReportsAnalytics()
  const locale: ReportsAnalyticsLocale = isReportsAnalyticsLocale(i18n.language) ? i18n.language : 'es'
  const t = useReportsAnalyticsText(baseT as (key: string) => string, locale)
  const formatters = useReportFormatters(t)

  return (
    <div className="w-full space-y-6">
      <ReportsHero
        data={analytics.data}
        isExporting={analytics.isExporting}
        isGeneratingInsights={analytics.isGeneratingInsights}
        locale={locale}
        theme={theme}
        t={t}
        onExport={analytics.exportAnalytics}
        onGenerateInsights={analytics.generateInsights}
      />
      <FiltersBar
        data={analytics.data}
        filters={analytics.filters}
        isLoading={analytics.isLoading}
        theme={theme}
        t={t}
        onFilterChange={analytics.updateFilter}
        onRefresh={analytics.refetch}
        onReset={analytics.resetFilters}
      />
      {analytics.error ? (
        <StatePanel theme={theme} icon={AlertTriangle} title={t('reportsAnalytics.states.errorTitle')} message={t('reportsAnalytics.states.errorDescription')} />
      ) : null}
      {analytics.isLoading ? (
        <StatePanel theme={theme} icon={Loader2} title={t('reportsAnalytics.states.loadingTitle')} message={t('reportsAnalytics.states.loadingDescription')} spinning />
      ) : null}
      {!analytics.isLoading && analytics.data ? (
        <ReportsLoadedContent
          data={analytics.data}
          formatters={formatters}
          insights={analytics.insights}
          isExportingInsightsPdf={analytics.isExportingInsightsPdf}
          isGeneratingInsights={analytics.isGeneratingInsights}
          locale={locale}
          theme={theme}
          t={t}
          onExportInsightsPdf={() => analytics.exportInsightsPdf(locale)}
          onGenerateInsights={() => analytics.generateInsights(locale)}
        />
      ) : null}
    </div>
  )
}
