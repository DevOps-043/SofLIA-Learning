import type { ReportsAnalyticsTimeGranularity } from '../../types/reports-analytics.types'
import type { ReportsAnalyticsT, ThemeTokens } from './types'

const granularityOptions: ReportsAnalyticsTimeGranularity[] = ['day', 'month', 'year']

export function GranularityControl({
  value,
  theme,
  t,
  onChange,
}: {
  value: ReportsAnalyticsTimeGranularity
  theme: ThemeTokens
  t: ReportsAnalyticsT
  onChange: (value: ReportsAnalyticsTimeGranularity) => void
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: theme.mutedTextColor }}>
        {t('reportsAnalytics.filters.granularity')}
      </span>
      <div className="inline-flex w-fit rounded-xl border-2 p-1" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
        {granularityOptions.map((option) => {
          const isSelected = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition"
              style={{ backgroundColor: isSelected ? theme.actionColor : 'transparent', color: isSelected ? theme.onActionColor : theme.subtextColor }}
            >
              {t(`reportsAnalytics.granularity.${option}`)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
