'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminSurface } from '../ui'

interface CostDataPoint {
  date: string
  cost: number
  tokens: number
  messages: number
}

interface CostOverviewWidgetProps {
  data: CostDataPoint[]
  isLoading?: boolean
  chartType?: 'area' | 'bar'
}

type CostChartDataPoint = CostDataPoint & {
  costFormatted: string
}

interface CostTooltipProps {
  active?: boolean
  label?: string
  payload?: Array<{
    payload: CostChartDataPoint
    value?: number
  }>
}

export function CostOverviewWidget({ data, isLoading, chartType = 'area' }: CostOverviewWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const chartData = useMemo(() => {
    return data.map((item) => {
      const [year, month, day] = item.date.split('-').map(Number)
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

      return {
        ...item,
        date: date.toLocaleDateString(undefined, {
          day: '2-digit',
          month: 'short',
          timeZone: 'UTC',
        }),
        costFormatted: `$${item.cost.toFixed(4)}`,
      }
    })
  }, [data])

  const totalCost = useMemo(() => data.reduce((sum, item) => sum + item.cost, 0), [data])
  const avgDailyCost = useMemo(() => (data.length > 0 ? totalCost / data.length : 0), [data.length, totalCost])

  const CustomTooltip = ({ active, payload, label }: CostTooltipProps) => {
    if (!active || !payload?.length) {
      return null
    }

    return (
      <div className="rounded-xl border p-3 shadow-xl" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <p className="mb-2 text-sm font-semibold" style={{ color: theme.text }}>
          {label}
        </p>
        <div className="space-y-1 text-sm">
          <p style={{ color: theme.textMuted }}>
            {t('liaAnalyticsWidgets.cost.cost')}: <span className="font-semibold" style={{ color: theme.action }}>${payload[0]?.value?.toFixed(4)}</span>
          </p>
          {payload[0]?.payload?.tokens ? (
            <p style={{ color: theme.textMuted }}>
              {t('liaAnalyticsWidgets.cost.tokens')}: <span className="font-semibold" style={{ color: theme.text }}>{payload[0].payload.tokens.toLocaleString()}</span>
            </p>
          ) : null}
          {payload[0]?.payload?.messages ? (
            <p style={{ color: theme.textMuted }}>
              {t('liaAnalyticsWidgets.cost.messages')}: <span className="font-semibold" style={{ color: theme.text }}>{payload[0].payload.messages}</span>
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <AdminSurface className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
          <div className="h-64 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
        </div>
      </AdminSurface>
    )
  }

  return (
    <AdminSurface className="p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
            <ChartBarIcon className="h-5 w-5" style={{ color: theme.action }} />
            {t('liaAnalyticsWidgets.cost.title')}
          </h3>
          <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
            {t('liaAnalyticsWidgets.cost.summary', {
              total: `$${totalCost.toFixed(4)}`,
              average: `$${avgDailyCost.toFixed(4)}`,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.action }} />
          {t('liaAnalyticsWidgets.cost.usdCost')}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="liaCostGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.action} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={theme.action} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.divider} opacity={0.8} />
              <XAxis dataKey="date" stroke={theme.textMuted} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke={theme.textMuted}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(3)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cost"
                stroke={theme.action}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#liaCostGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.divider} opacity={0.8} />
              <XAxis dataKey="date" stroke={theme.textMuted} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke={theme.textMuted}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(3)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" fill={theme.action} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </AdminSurface>
  )
}
