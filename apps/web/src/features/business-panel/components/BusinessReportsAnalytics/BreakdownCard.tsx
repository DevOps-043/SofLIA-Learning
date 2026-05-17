import { useMemo } from 'react'
import type { ReportsAnalyticsBreakdownItem } from '../../types/reports-analytics.types'
import { ChartShell } from './ChartShell'
import { CircularBreakdownChart } from './CircularBreakdownChart'
import { EmptyChart } from './EmptyChart'
import { HorizontalBreakdownChart } from './HorizontalBreakdownChart'
import type { ReportFormatter, ThemeTokens } from './types'

export type BreakdownChartVariant = 'horizontalBar' | 'donut' | 'radial'

export function BreakdownCard({
  title,
  subtitle,
  data,
  labelFormatter,
  theme,
  variant,
}: {
  title: string
  subtitle: string
  data: ReportsAnalyticsBreakdownItem[]
  labelFormatter: ReportFormatter
  theme: ThemeTokens
  variant: BreakdownChartVariant
}) {
  const chartData = useMemo(() => {
    return data
      .map((item, index) => ({ ...item, label: labelFormatter(item), fill: theme.chartColors[index % theme.chartColors.length] }))
      .filter((item) => item.value > 0)
  }, [data, theme.chartColors, labelFormatter])

  return (
    <ChartShell title={title} subtitle={subtitle} theme={theme}>
      {chartData.length === 0 ? (
        <EmptyChart theme={theme} />
      ) : variant === 'horizontalBar' ? (
        <HorizontalBreakdownChart data={chartData} theme={theme} />
      ) : (
        <CircularBreakdownChart data={chartData} theme={theme} variant={variant} />
      )}
    </ChartShell>
  )
}
