import { memo, useMemo } from 'react'
import { Cell, Pie, PieChart, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { ReportsAnalyticsBreakdownItem } from '../../types/reports-analytics.types'
import type { BreakdownChartVariant } from './BreakdownCard'
import { BreakdownLegend } from './BreakdownLegend'
import type { ThemeTokens } from './types'

export const CircularBreakdownChart = memo(function CircularBreakdownChart({
  data,
  theme,
  variant,
}: {
  data: Array<ReportsAnalyticsBreakdownItem & { fill: string }>
  theme: ThemeTokens
  variant: Exclude<BreakdownChartVariant, 'horizontalBar'>
}) {
  const chartData = useMemo<Array<Record<string, string | number>>>(
    () => data.map((item) => ({
      fill: item.fill,
      key: item.key,
      label: item.label,
      percentage: item.percentage,
      value: item.value,
    })),
    [data],
  )

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4 md:grid-cols-[minmax(0,1fr)_180px] md:grid-rows-1">
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'radial' ? (
          <RadialBarChart innerRadius="26%" outerRadius="94%" barSize={12} data={chartData}>
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: theme.hoverBg }} />
            <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }} />
          </RadialBarChart>
        ) : (
          <PieChart>
            <Tooltip contentStyle={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor, color: theme.textColor }} />
            <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={64} outerRadius={98} paddingAngle={2}>
              {data.map((entry) => <Cell key={entry.key} fill={entry.fill} />)}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
      <BreakdownLegend data={data} theme={theme} />
    </div>
  )
})
