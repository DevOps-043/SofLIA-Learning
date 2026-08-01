
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { ReportsHeroActions } from './ReportsHeroActions'
import styles from './ReportsAnalytics.module.css'
import type { ReportsAnalyticsExporter, ReportsAnalyticsExportingState, ReportsAnalyticsLocale, ReportsAnalyticsT, ThemeTokens } from './types'

export function ReportsHero({
  data,
  isExporting,
  isGeneratingInsights,
  canGenerateInsights,
  hasInsights,
  locale,
  theme,
  t,
  onExport,
  onGenerateInsights,
}: {
  data: ReportsAnalyticsResponse | null
  isExporting: ReportsAnalyticsExportingState
  isGeneratingInsights: boolean
  canGenerateInsights: boolean
  hasInsights: boolean
  locale: ReportsAnalyticsLocale
  theme: ThemeTokens
  t: ReportsAnalyticsT
  onExport: ReportsAnalyticsExporter
  onGenerateInsights: (locale: ReportsAnalyticsLocale) => void
}) {
  return (
    <section
      id="tour-reports-hero"
      className={styles.hero}
      style={{ background: theme.heroBackground, borderColor: theme.heroBorderColor }}
      aria-labelledby="reports-page-title"
    >
      <div className={styles.heroAtmosphere} aria-hidden="true" />
      <div className={styles.heroRingLarge} aria-hidden="true" />
      <div className={styles.heroRingSmall} aria-hidden="true" />
      <div className={styles.heroDot} aria-hidden="true" />

      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>{t('reportsAnalytics.eyebrow')}</p>
        <h1 id="reports-page-title" className={styles.heroTitle}>
          {t('reportsAnalytics.title')}
        </h1>
        <p className={styles.heroDescription}>
          {t('reportsAnalytics.description')}
        </p>
      </div>

      <ReportsHeroActions
        canUseData={Boolean(data)}
        isExporting={isExporting}
        isGeneratingInsights={isGeneratingInsights}
        canGenerateInsights={canGenerateInsights}
        hasInsights={hasInsights}
        locale={locale}
        t={t}
        onExport={onExport}
        onGenerateInsights={onGenerateInsights}
      />
    </section>
  )
}
