import { BarChart3 } from 'lucide-react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { ReportsHeroActions } from './ReportsHeroActions'
import type { ReportsAnalyticsExporter, ReportsAnalyticsExportingState, ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'

export function ReportsHero({
  data,
  isExporting,
  isGeneratingInsights,
  locale,
  theme,
  t,
  onExport,
  onGenerateInsights,
}: {
  data: ReportsAnalyticsResponse | null
  isExporting: ReportsAnalyticsExportingState
  isGeneratingInsights: boolean
  locale: ReportsAnalyticsLocale
  theme: ThemeTokens
  t: ReportsAnalyticsT
  onExport: ReportsAnalyticsExporter
  onGenerateInsights: (locale: ReportsAnalyticsLocale) => void
}) {
  return (
    <section id="tour-reports-hero" className="relative overflow-hidden rounded-lg border px-5 py-7 sm:px-8" style={{ background: theme.heroBackground, borderColor: theme.heroBorderColor }}>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: `radial-gradient(${theme.inverseBorderColor} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ borderColor: theme.inverseBorderColor, color: theme.inverseSubtextColor, backgroundColor: theme.inverseSurface }}
          >
            <BarChart3 className="h-4 w-4" />
            <span>{t('reportsAnalytics.eyebrow')}</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl" style={{ color: theme.inverseTextColor }}>
            {t('reportsAnalytics.title')}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 sm:text-base" style={{ color: theme.inverseSubtextColor }}>
            {t('reportsAnalytics.description')}
          </p>
        </div>
        <ReportsHeroActions
          canUseData={Boolean(data)}
          isExporting={isExporting}
          isGeneratingInsights={isGeneratingInsights}
          locale={locale}
          theme={theme}
          t={t}
          onExport={onExport}
          onGenerateInsights={onGenerateInsights}
        />
      </div>
    </section>
  )
}
