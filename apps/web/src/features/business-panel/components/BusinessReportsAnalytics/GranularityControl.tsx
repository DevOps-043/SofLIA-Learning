import type { ReportsAnalyticsTimeGranularity } from '../../types/reports-analytics.types'
import styles from './ReportsAnalytics.module.css'
import type { ReportsAnalyticsT } from './types'

const granularityOptions: ReportsAnalyticsTimeGranularity[] = ['day', 'month', 'year']

export function GranularityControl({
  value,
  t,
  onChange,
}: {
  value: ReportsAnalyticsTimeGranularity
  t: ReportsAnalyticsT
  onChange: (value: ReportsAnalyticsTimeGranularity) => void
}) {
  return (
    <div className={styles.granularity}>
      <span className={styles.filterLabel}>
        {t('reportsAnalytics.filters.granularity')}
      </span>
      <div className={styles.granularityGroup}>
        {granularityOptions.map((option) => {
          const isSelected = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={styles.granularityButton}
              data-active={isSelected}
              aria-pressed={isSelected}
            >
              {t(`reportsAnalytics.granularity.${option}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
