import { FileText, Loader2, Sparkles } from 'lucide-react'
import type { ReportsAnalyticsAiInsights } from '../../types/reports-analytics.types'
import { AiInsightsContent } from './AiInsightsContent'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

export function AiInsightsPanel({
  insights,
  isGenerating,
  isExportingPdf,
  theme,
  t,
  onGenerate,
  onExportPdf,
}: {
  insights: ReportsAnalyticsAiInsights | null
  isGenerating: boolean
  isExportingPdf: boolean
  theme: ThemeTokens
  t: ReportsAnalyticsT
  onGenerate: () => void
  onExportPdf: () => void
}) {
  return (
    <section className="rounded-lg border p-4" style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: theme.textColor }}>{t('reportsAnalytics.sections.aiInsights')}</h2>
            <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>{t('reportsAnalytics.sections.aiInsightsSubtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onGenerate} disabled={isGenerating} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: theme.actionSurface, color: theme.actionColor }}>
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {t('reportsAnalytics.actions.generateInsights')}
          </button>
          <button type="button" onClick={onExportPdf} disabled={!insights || isExportingPdf} className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ borderColor: theme.borderColor, color: theme.textColor }}>
            {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {t('reportsAnalytics.actions.exportInsightsPdf')}
          </button>
        </div>
      </div>
      <AiInsightsContent insights={insights} theme={theme} t={t} />
    </section>
  )
}
