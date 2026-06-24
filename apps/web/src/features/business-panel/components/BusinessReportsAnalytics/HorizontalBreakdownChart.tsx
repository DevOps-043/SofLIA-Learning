import { memo, useMemo } from 'react'
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReportsAnalyticsBreakdownItem } from '../../types/reports-analytics.types'
import { truncateLabel } from './text.utils'
import type { ThemeTokens } from './types'

export const HorizontalBreakdownChart = memo(function HorizontalBreakdownChart({
  data,
  theme,
}: {
  data: Array<ReportsAnalyticsBreakdownItem & { fill: string }>
  theme: ThemeTokens
}) {
  const visibleData = useMemo(() => data.slice(0, 8), [data])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={visibleData} layout="vertical" margin={{ left: 4, right: 16, top: 8, bottom: 8 }}>
        <CartesianGrid stroke={theme.dividerColor} horizontal={false} />
        <XAxis type="number" tick={{ fill: theme.subtextColor, fontSize: 11 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={104}
          tick={{ fill: theme.subtextColor, fontSize: 11 }}
          tickFormatter={(value) => truncateLabel(String(value), 16)}
          interval={0}
        />
        <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={theme.actionColor}>
          {visibleData.map((entry) => <Cell key={entry.key} fill={entry.fill} />)}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  )
})
