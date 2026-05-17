import { Download, FileSpreadsheet, FileText, Loader2, Sparkles, type LucideIcon } from 'lucide-react'
import type { ReportsAnalyticsExporter, ReportsAnalyticsExportingState, ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'
import type { ReportsAnalyticsExportFormat } from '../../types/reports-analytics.types'

const exportActions: Array<{
  format: ReportsAnalyticsExportFormat
  labelKey: string
  icon: LucideIcon
  primary?: boolean
}> = [
  { format: 'xlsx', labelKey: 'reportsAnalytics.actions.exportExcel', icon: FileSpreadsheet, primary: true },
  { format: 'csv_zip', labelKey: 'reportsAnalytics.actions.exportCsv', icon: Download },
  { format: 'pdf', labelKey: 'reportsAnalytics.actions.exportPdf', icon: FileText },
]

export function ReportsHeroActions({
  canUseData,
  isExporting,
  isGeneratingInsights,
  locale,
  theme,
  t,
  onExport,
  onGenerateInsights,
}: {
  canUseData: boolean
  isExporting: ReportsAnalyticsExportingState
  isGeneratingInsights: boolean
  locale: ReportsAnalyticsLocale
  theme: ThemeTokens
  t: ReportsAnalyticsT
  onExport: ReportsAnalyticsExporter
  onGenerateInsights: (locale: ReportsAnalyticsLocale) => void
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
      <button type="button" onClick={() => onGenerateInsights(locale)} disabled={!canUseData || isGeneratingInsights} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" style={{ borderColor: theme.inverseBorderColor, backgroundColor: theme.inverseSurface, color: theme.inverseTextColor }}>
        {isGeneratingInsights ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {t('reportsAnalytics.actions.generateInsights')}
      </button>
      {exportActions.map((action) => {
        const Icon = action.icon
        const isCurrentExport = isExporting === action.format
        const style = action.primary
          ? { backgroundColor: theme.onActionColor, color: theme.actionColor }
          : { borderColor: theme.inverseBorderColor, backgroundColor: theme.inverseSurface, color: theme.inverseTextColor }
        const className = action.primary
          ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
          : 'inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'

        return (
          <button key={action.format} type="button" onClick={() => onExport(action.format, locale)} disabled={!canUseData || Boolean(isExporting)} className={className} style={style}>
            {isCurrentExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {t(action.labelKey)}
          </button>
        )
      })}
    </div>
  )
}
