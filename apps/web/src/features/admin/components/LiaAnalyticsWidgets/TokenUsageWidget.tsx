'use client'

import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BoltIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminSurface } from '../ui'

interface ModelUsage {
  model: string
  tokens: number
  cost: number
  count: number
  percentage: number
}

interface TokenUsageWidgetProps {
  modelUsage: ModelUsage[]
  totalTokens: number
  isLoading?: boolean
}

type TokenChartDataPoint = ModelUsage & {
  color: string
  displayName: string
}

interface TokenTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: TokenChartDataPoint
  }>
}

export function TokenUsageWidget({ modelUsage, totalTokens, isLoading }: TokenUsageWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const chartData = useMemo(() => {
    return modelUsage.map((item, index) => ({
      ...item,
      displayName: item.model.replace('gpt-', 'GPT-'),
      color: theme.chartColors[index % theme.chartColors.length],
    }))
  }, [modelUsage, theme.chartColors])

  const formatTokens = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const CustomTooltip = ({ active, payload }: TokenTooltipProps) => {
    if (!active || !payload?.length) {
      return null
    }

    const data = payload[0].payload

    return (
      <div className="rounded-xl border p-3 shadow-xl" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <p className="mb-2 font-semibold" style={{ color: theme.text }}>
          {data.displayName}
        </p>
        <div className="space-y-1 text-sm" style={{ color: theme.textMuted }}>
          <p>{t('liaAnalyticsWidgets.token.tokens')}: <span className="font-semibold" style={{ color: theme.text }}>{data.tokens.toLocaleString()}</span></p>
          <p>{t('liaAnalyticsWidgets.token.cost')}: <span className="font-semibold" style={{ color: theme.text }}>${data.cost.toFixed(4)}</span></p>
          <p>{t('liaAnalyticsWidgets.token.calls')}: <span className="font-semibold" style={{ color: theme.text }}>{data.count}</span></p>
          <p>{t('liaAnalyticsWidgets.token.percentage')}: <span className="font-semibold" style={{ color: theme.text }}>{data.percentage}%</span></p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <AdminSurface className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
          <div className="h-48 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
        </div>
      </AdminSurface>
    )
  }

  return (
    <AdminSurface className="p-6">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
          <BoltIcon className="h-5 w-5" style={{ color: theme.action }} />
          {t('liaAnalyticsWidgets.token.title')}
        </h3>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
          {t('liaAnalyticsWidgets.token.total', { value: formatTokens(totalTokens) })}
        </p>
      </div>

      {chartData.length > 0 ? (
        <>
          <div className="mb-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.divider} opacity={0.8} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={theme.textMuted}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatTokens}
                />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  stroke={theme.textMuted}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tokens" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {chartData.map((item) => (
              <div
                key={item.model}
                className="flex items-center gap-2 rounded-xl p-3"
                style={{ backgroundColor: theme.surfaceSubtle }}
              >
                <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: theme.text }}>
                    {item.displayName}
                  </p>
                  <p className="text-xs" style={{ color: theme.textMuted }}>
                    {t('liaAnalyticsWidgets.token.legendMeta', {
                      percentage: item.percentage,
                      cost: `$${item.cost.toFixed(4)}`,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex h-48 items-center justify-center text-sm" style={{ color: theme.textMuted }}>
          {t('liaAnalyticsWidgets.token.empty')}
        </div>
      )}
    </AdminSurface>
  )
}
