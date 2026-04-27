'use client'

import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartPieIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'
import { AdminSurface } from '../ui'

interface ContextData {
  contextType: string
  count: number
  cost: number
  tokens: number
  percentage: number
}

interface ContextDistributionWidgetProps {
  data: ContextData[]
  isLoading?: boolean
}

interface ChartContextData extends ContextData {
  name: string
  color: string
}

interface ContextTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: ChartContextData
  }>
}

interface ContextLabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}

export function ContextDistributionWidget({ data, isLoading }: ContextDistributionWidgetProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const chartData = useMemo<ChartContextData[]>(() => {
    return data.map((item, index) => ({
      ...item,
      name: t(`liaAnalyticsWidgets.context.labels.${item.contextType}`, { defaultValue: item.contextType }),
      color: theme.chartColors[index % theme.chartColors.length],
    }))
  }, [data, t, theme.chartColors])

  const totalConversations = useMemo(() => data.reduce((sum, item) => sum + item.count, 0), [data])
  const totalCost = useMemo(() => data.reduce((sum, item) => sum + item.cost, 0), [data])

  const CustomTooltip = ({ active, payload }: ContextTooltipProps) => {
    const tooltipData = payload?.[0]?.payload
    if (!active || !tooltipData) {
      return null
    }

    return (
      <div className="rounded-xl border p-3 shadow-xl" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
        <div className="mb-2 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tooltipData.color }} />
          <p className="font-semibold" style={{ color: theme.text }}>{tooltipData.name}</p>
        </div>
        <div className="space-y-1 text-sm" style={{ color: theme.textMuted }}>
          <p>{t('liaAnalyticsWidgets.context.conversations')}: <span className="font-semibold" style={{ color: theme.text }}>{tooltipData.count}</span></p>
          <p>{t('liaAnalyticsWidgets.context.cost')}: <span className="font-semibold" style={{ color: theme.text }}>${tooltipData.cost.toFixed(4)}</span></p>
          <p>{t('liaAnalyticsWidgets.context.tokens')}: <span className="font-semibold" style={{ color: theme.text }}>{tooltipData.tokens.toLocaleString()}</span></p>
          <p>{t('liaAnalyticsWidgets.context.percentage')}: <span className="font-semibold" style={{ color: theme.text }}>{tooltipData.percentage}%</span></p>
        </div>
      </div>
    )
  }

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: ContextLabelProps) => {
    const safePercent = percent ?? 0
    if (safePercent < 0.05) {
      return null
    }

    const radian = Math.PI / 180
    const safeCx = cx ?? 0
    const safeCy = cy ?? 0
    const safeMidAngle = midAngle ?? 0
    const safeInnerRadius = innerRadius ?? 0
    const safeOuterRadius = outerRadius ?? 0
    const radius = safeInnerRadius + (safeOuterRadius - safeInnerRadius) * 0.5
    const x = safeCx + radius * Math.cos(-safeMidAngle * radian)
    const y = safeCy + radius * Math.sin(-safeMidAngle * radian)

    return (
      <text
        x={x}
        y={y}
        fill={theme.inverseText}
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(safePercent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (isLoading) {
    return (
      <AdminSurface className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded" style={{ backgroundColor: theme.surfaceSubtle }} />
          <div className="mx-auto h-64 w-64 rounded-full" style={{ backgroundColor: theme.surfaceSubtle }} />
        </div>
      </AdminSurface>
    )
  }

  return (
    <AdminSurface className="p-6">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: theme.text }}>
          <ChartPieIcon className="h-5 w-5" style={{ color: theme.action }} />
          {t('liaAnalyticsWidgets.context.title')}
        </h3>
        <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
          {t('liaAnalyticsWidgets.context.summary', {
            conversations: totalConversations,
            cost: `$${totalCost.toFixed(4)}`,
          })}
        </p>
      </div>

      {chartData.length > 0 ? (
        <div className="flex flex-col items-center gap-4 lg:flex-row">
          <div className="h-56 w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full space-y-2 lg:w-1/2">
            {chartData.map((item) => (
              <div
                key={item.contextType}
                className="flex items-center justify-between gap-3 rounded-xl p-3 transition-opacity hover:opacity-85"
                style={{ backgroundColor: theme.surfaceSubtle }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-sm font-semibold" style={{ color: theme.text }}>
                    {item.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs" style={{ color: theme.textMuted }}>
                  <span>{t('liaAnalyticsWidgets.context.conversationShort', { count: item.count })}</span>
                  <span className="font-semibold" style={{ color: theme.action }}>
                    ${item.cost.toFixed(4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-56 items-center justify-center text-sm" style={{ color: theme.textMuted }}>
          {t('liaAnalyticsWidgets.context.empty')}
        </div>
      )}
    </AdminSurface>
  )
}
