import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import { ChartShell } from './ChartShell'
import { EmptyChart } from './EmptyChart'
import type { ThemeTokens, ReportsAnalyticsT } from './types'

interface LearningTrendChartProps {
  data: Pick<ReportsAnalyticsResponse, 'learning'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

export function LearningTrendChart({ data, theme, t }: LearningTrendChartProps) {
  const trendData = data.learning.completionsTrend

  return (
    <ChartShell
      title={t('reportsAnalytics.sections.evolutionTitle')}
      subtitle={t('reportsAnalytics.sections.evolutionSubtitle')}
      theme={theme}
    >
      {trendData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ left: -4, right: 12, top: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="completionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.successColor} stopOpacity={0.18} />
                <stop offset="95%" stopColor={theme.successColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={theme.dividerColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: theme.subtextColor, fontSize: 11 }} minTickGap={12} />
            <YAxis tick={{ fill: theme.subtextColor, fontSize: 11 }} width={36} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor, fontSize: 12 }}
              formatter={(value) => [value, t('reportsAnalytics.funnel.completed')]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.successColor}
              strokeWidth={2.5}
              fill="url(#completionGrad)"
              dot={{ r: 3, fill: theme.successColor, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: theme.successColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart theme={theme} />
      )}
    </ChartShell>
  )
}
