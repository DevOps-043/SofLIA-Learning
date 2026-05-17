import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReportsAnalyticsT, SegmentDisplayRow, ThemeTokens } from './types'

export function SegmentComparisonChart({
  chartRows,
  theme,
  t,
}: {
  chartRows: Array<SegmentDisplayRow & { shortLabel: string }>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={chartRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 16, left: 4 }}>
        <CartesianGrid stroke={theme.dividerColor} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: theme.subtextColor, fontSize: 11 }} />
        <YAxis type="category" dataKey="shortLabel" width={104} tick={{ fill: theme.subtextColor, fontSize: 11 }} />
        <Tooltip
          contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }}
          formatter={(value, name) => [
            `${value}%`,
            name === 'averageProgress' ? t('reportsAnalytics.table.progress') : t('reportsAnalytics.table.quality'),
          ]}
        />
        <Bar dataKey="averageProgress" radius={[0, 6, 6, 0]} fill={theme.actionColor} />
        <Bar dataKey="qualityScore" radius={[0, 6, 6, 0]} fill={theme.successColor} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
