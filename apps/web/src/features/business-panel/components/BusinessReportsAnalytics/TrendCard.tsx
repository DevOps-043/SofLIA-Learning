import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReportsAnalyticsTrendPoint } from '../../types/reports-analytics.types'
import { ChartShell } from './ChartShell'
import { EmptyChart } from './EmptyChart'
import type { ThemeTokens } from './types'

export function TrendCard({
  title,
  subtitle,
  data,
  theme,
  valueLabel,
}: {
  title: string
  subtitle: string
  data: ReportsAnalyticsTrendPoint[]
  theme: ThemeTokens
  valueLabel: string
}) {
  return (
    <ChartShell title={title} subtitle={subtitle} theme={theme}>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -4, right: 12, top: 10, bottom: 20 }}>
            <CartesianGrid stroke={theme.dividerColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: theme.subtextColor, fontSize: 11 }} minTickGap={12} />
            <YAxis tick={{ fill: theme.subtextColor, fontSize: 11 }} width={36} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }}
              formatter={(value) => [value, valueLabel]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.actionColor}
              strokeWidth={3}
              fill={theme.actionSurface}
              dot={{ r: 3, fill: theme.actionColor }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart theme={theme} />
      )}
    </ChartShell>
  )
}
