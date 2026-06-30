'use client'

import { useLanguage } from '@/core/providers/I18nProvider'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTour } from '@/features/tours'
import { businessPanelReportsTour } from '@/features/tours/config/business-panel-reports.tour'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { useBusinessReportsAnalytics } from '../../hooks/useBusinessReportsAnalytics'
import { FiltersBar } from './FiltersBar'
import { ReportsHero } from './ReportsHero'
import { ReportsLoadedContent } from './ReportsLoadedContent'
import { StatePanel } from './StatePanel'
import type { ReportsAnalyticsLocale, ReportsAnalyticsT } from './types'

export function BusinessReportsAnalytics() {
  const { t: tRaw } = useTranslation('business')
  const { language } = useLanguage()
  const theme = useBusinessPanelTheme()
  const { autoStartIfNeeded } = useTour(businessPanelReportsTour)

  useEffect(() => {
    return autoStartIfNeeded()
  }, [autoStartIfNeeded])

  const {
    data,
    insights,
    filters,
    isLoading,
    isValidating,
    isExporting,
    isGeneratingInsights,
    isExportingInsightsPdf,
    error,
    updateFilter,
    resetFilters,
    refetch,
    exportAnalytics,
    generateInsights,
    exportInsightsPdf,
  } = useBusinessReportsAnalytics()

  const locale = language as ReportsAnalyticsLocale
  const t: ReportsAnalyticsT = (key) => tRaw(key)

  return (
    <div className="flex flex-col gap-4">
      <ReportsHero
        data={data}
        isExporting={isExporting}
        isGeneratingInsights={isGeneratingInsights}
        locale={locale}
        theme={theme}
        t={t}
        onExport={exportAnalytics}
        onGenerateInsights={generateInsights}
      />

      <FiltersBar
        data={data}
        filters={filters}
        theme={theme}
        t={t}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        onRefresh={refetch}
        isLoading={isValidating}
      />

      {isLoading && !data ? (
        <StatePanel
          theme={theme}
          icon={Loader2}
          title={t('reportsAnalytics.states.loadingTitle')}
          message={t('reportsAnalytics.states.loadingDescription')}
          spinning
        />
      ) : error && !data ? (
        <StatePanel
          theme={theme}
          icon={AlertCircle}
          title={t('reportsAnalytics.states.errorTitle')}
          message={t('reportsAnalytics.states.errorDescription')}
        />
      ) : data ? (
        <ReportsLoadedContent
          data={data}
          insights={insights}
          isExportingInsightsPdf={isExportingInsightsPdf}
          isGeneratingInsights={isGeneratingInsights}
          locale={locale}
          theme={theme}
          t={t}
          onExportInsightsPdf={() => exportInsightsPdf(locale)}
          onGenerateInsights={() => generateInsights(locale)}
        />
      ) : null}
    </div>
  )
}
