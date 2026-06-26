import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { deriveLearningFunnel } from './derive-learning-funnel'
import type { ThemeTokens, ReportsAnalyticsT } from './types'

interface LearningFunnelChartProps {
  data: Pick<ReportsAnalyticsResponse, 'overview' | 'learning'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

export function LearningFunnelChart({ data, theme, t }: LearningFunnelChartProps) {
  const stages = deriveLearningFunnel(data, t)
  const maxValue = stages[0]?.value ?? 1

  if (stages.length === 0 || maxValue === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border py-10 text-center"
        style={{ borderColor: theme.borderColor, backgroundColor: theme.cardBg }}
      >
        <p className="text-sm" style={{ color: theme.mutedTextColor }}>
          {t('reportsAnalytics.emptyStates.noTrendData')}
        </p>
      </div>
    )
  }

  return (
    <section
      className="overflow-hidden rounded-lg border"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <div className="border-b p-4" style={{ borderColor: theme.borderColor }}>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.sections.learningFunnel')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
          {t('reportsAnalytics.sections.learningFunnelSubtitle')}
        </p>
      </div>
      <div className="space-y-1 p-4">
        {stages.map((stage, i) => {
          const widthPct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0
          const isFirst = i === 0
          const isLast = i === stages.length - 1

          const barColor = isFirst
            ? theme.actionColor
            : isLast
              ? theme.successColor
              : theme.accentColor

          return (
            <div key={stage.key} className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-right">
                <span className="text-xs font-medium" style={{ color: theme.subtextColor }}>
                  {stage.label}
                </span>
              </div>
              <div className="relative flex flex-1 items-center">
                <div className="h-7 w-full overflow-hidden rounded-sm" style={{ backgroundColor: theme.hoverBg }}>
                  <div
                    className="flex h-full items-center rounded-sm px-2 transition-all duration-500"
                    style={{ width: `${widthPct}%`, backgroundColor: barColor, minWidth: stage.value > 0 ? '2rem' : '0' }}
                  >
                    {stage.value > 0 && (
                      <span className="truncate text-xs font-semibold text-white">
                        {stage.value}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-20 shrink-0 text-right">
                <span className="text-xs font-medium tabular-nums" style={{ color: theme.textColor }}>
                  {stage.percentage}%
                </span>
                {stage.dropoffRate !== null && stage.dropoffRate > 0 && (
                  <span className="ml-1 text-xs" style={{ color: '#ef4444' }}>
                    −{stage.dropoffRate}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
