'use client'

import { useLanguage } from '@/core/providers/I18nProvider'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { CSSProperties } from 'react'
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
import styles from './ReportsAnalytics.module.css'
import type { ReportsAnalyticsLocale, ReportsAnalyticsT } from './types'

interface BusinessReportsAnalyticsProps {
  orgSlug?: string
}

type ReportsAnalyticsVariables = CSSProperties & Record<`--reports-${string}`, string>

export function BusinessReportsAnalytics({ orgSlug }: BusinessReportsAnalyticsProps = {}) {
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
  } = useBusinessReportsAnalytics(orgSlug)

  const locale = language as ReportsAnalyticsLocale
  const t: ReportsAnalyticsT = (key) => tRaw(key)
  const reportsVariables: ReportsAnalyticsVariables = {
    '--reports-accent': theme.accentColor,
    '--reports-action': theme.actionColor,
    '--reports-border': theme.borderColor,
    '--reports-card': theme.cardBg,
    '--reports-danger': theme.dangerColor,
    '--reports-divider': theme.dividerColor,
    '--reports-input': theme.inputBg,
    '--reports-muted': theme.subtextColor,
    '--reports-on-action': theme.onActionColor,
    '--reports-success': theme.successColor,
    '--reports-text': theme.textColor,
    '--reports-warning': theme.warningColor,
  }

  return (
    <div className={styles.page} style={reportsVariables}>
      <div className={styles.pageStack}>
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
            onCourseFilterChange={(courseId) => updateFilter('courseId', courseId)}
            onExportInsightsPdf={() => exportInsightsPdf(locale)}
            onGenerateInsights={() => generateInsights(locale)}
          />
        ) : null}
      </div>
    </div>
  )
}
