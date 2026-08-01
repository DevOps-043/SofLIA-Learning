import { Download, FileSpreadsheet, FileText, Loader2, Sparkles, type LucideIcon } from 'lucide-react'
import type { ReportsAnalyticsExportFormat } from '../../types/reports-analytics.types'
import styles from './ReportsAnalytics.module.css'
import type { ReportsAnalyticsExporter, ReportsAnalyticsExportingState, ReportsAnalyticsLocale, ReportsAnalyticsT } from './types'

const exportActions: Array<{
  format: ReportsAnalyticsExportFormat
  labelKey: string
  icon: LucideIcon
}> = [
  { format: 'xlsx', labelKey: 'reportsAnalytics.actions.exportExcel', icon: FileSpreadsheet },
  { format: 'csv_zip', labelKey: 'reportsAnalytics.actions.exportCsv', icon: Download },
  { format: 'pdf', labelKey: 'reportsAnalytics.actions.exportPdf', icon: FileText },
]

export function ReportsHeroActions({
  canUseData,
  isExporting,
  isGeneratingInsights,
  canGenerateInsights,
  hasInsights,
  locale,
  t,
  onExport,
  onGenerateInsights,
}: {
  canUseData: boolean
  isExporting: ReportsAnalyticsExportingState
  isGeneratingInsights: boolean
  canGenerateInsights: boolean
  hasInsights: boolean
  locale: ReportsAnalyticsLocale
  t: ReportsAnalyticsT
  onExport: ReportsAnalyticsExporter
  onGenerateInsights: (locale: ReportsAnalyticsLocale) => void
}) {
  return (
    <div className={styles.heroActions}>
      <button
        type="button"
        onClick={() => onGenerateInsights(locale)}
        disabled={!canUseData || !canGenerateInsights || isGeneratingInsights}
        title={!canGenerateInsights ? t('reportsAnalytics.ai.dailyLimitReached') : undefined}
        className={styles.heroPrimaryButton}
      >
        {isGeneratingInsights ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {t('reportsAnalytics.actions.generateInsights')}
      </button>
      {exportActions.map((action) => {
        const Icon = action.icon
        const isCurrentExport = isExporting === action.format

        return (
          <button
            key={action.format}
            type="button"
            onClick={() => onExport(action.format, locale)}
            disabled={!canUseData || Boolean(isExporting) || (action.format === 'pdf' && !hasInsights)}
            className={styles.heroButton}
          >
            {isCurrentExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {t(action.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
