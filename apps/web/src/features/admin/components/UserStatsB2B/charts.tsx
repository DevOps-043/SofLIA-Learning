'use client'

import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../../hooks/useAdminTheme'

type ChartDatum = Record<string, string | number | null | undefined>

const getChartNumber = (value: ChartDatum[string]): number => (
  typeof value === 'number' ? value : Number(value ?? 0)
)

const getChartLabel = (value: ChartDatum[string]): string => (
  typeof value === 'string' || typeof value === 'number' ? String(value) : ''
)

interface BarChartProps {
  data: ChartDatum[]
  dataKey: string
  nameKey: string
  color?: string
}

export function BarChartComponent({ data, dataKey, nameKey, color }: BarChartProps) {
  const theme = useAdminTheme()
  const validData = data.filter((item) => item && item[dataKey] != null)
  const maxValue = validData.length > 0 ? Math.max(...validData.map((item) => getChartNumber(item[dataKey]))) : 1

  if (validData.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-2">
      {validData.slice(0, 10).map((item, index) => {
        const dataValue = getChartNumber(item[dataKey])
        const labelValue = getChartLabel(item[nameKey])
        const percentage = maxValue > 0 ? (dataValue / maxValue) * 100 : 0
        const displayName = labelValue.length > 30 ? `${labelValue.substring(0, 30)}...` : labelValue
        const resolvedColor = color || theme.chartColors[index % theme.chartColors.length]

        return (
          <div
            key={index}
            className="group flex items-center gap-4 rounded-xl p-2 transition-all duration-200"
            style={{ backgroundColor: 'transparent' }}
          >
            <div className="w-32 flex-shrink-0 text-right">
              <span className="text-sm font-semibold transition-colors" style={{ color: theme.textMuted }}>
                {displayName}
              </span>
            </div>
            <div className="relative h-6 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: theme.surfaceSubtle }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.05, duration: 0.8 }}
                className="h-full rounded-full transition-opacity duration-200 group-hover:opacity-85"
                style={{ backgroundColor: resolvedColor }}
              />
            </div>
            <div className="w-16 text-left">
              <span className="text-sm font-bold" style={{ color: theme.text }}>
                {Number.isFinite(dataValue) && !Number.isInteger(dataValue)
                  ? dataValue.toFixed(1)
                  : dataValue}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface PieChartProps {
  data: ChartDatum[]
  dataKey: string
  nameKey: string
}

export function PieChartComponent({ data, dataKey, nameKey }: PieChartProps) {
  const theme = useAdminTheme()
  const validData = data.filter((item) => item && item[dataKey] != null && getChartNumber(item[dataKey]) > 0)
  const total = validData.reduce((sum, item) => sum + getChartNumber(item[dataKey]), 0)

  if (total === 0 || validData.length === 0) {
    return <EmptyState />
  }

  let currentAngle = 0
  const radius = 80
  const centerX = 100
  const centerY = 100

  return (
    <div className="flex flex-col items-center justify-center gap-6 xl:flex-row">
      <div className="flex-shrink-0">
        <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90 transform">
          <circle cx={centerX} cy={centerY} r={radius} fill={theme.surfaceSubtle} stroke={theme.border} strokeWidth="1" />
          {validData.map((item, index) => {
            const itemValue = getChartNumber(item[dataKey])
            const percentage = (itemValue / total) * 100
            const angle = (percentage / 100) * 360
            const fillColor = theme.chartColors[index % theme.chartColors.length]

            if (percentage >= 99.9) {
              return (
                <motion.circle
                  key={index}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill={fillColor}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  stroke={theme.surface}
                  strokeWidth="2"
                />
              )
            }

            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180)
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180)
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180)
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180)
            const largeArcFlag = angle > 180 ? 1 : 0
            const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
            currentAngle += angle

            return (
              <motion.path
                key={index}
                d={pathData}
                fill={fillColor}
                className="cursor-pointer transition-opacity hover:opacity-80"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                stroke={theme.surface}
                strokeWidth="2"
              />
            )
          })}
        </svg>
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-3">
        {validData.map((item, index) => {
          const itemValue = getChartNumber(item[dataKey])
          const percentage = (itemValue / total) * 100

          return (
            <div key={index} className="flex min-w-0 items-center gap-3 text-sm">
              <div
                className="h-4 w-4 flex-shrink-0 rounded-full"
                style={{ backgroundColor: theme.chartColors[index % theme.chartColors.length] }}
              />
              <span className="min-w-0 flex-1 truncate" style={{ color: theme.textMuted }}>
                {getChartLabel(item[nameKey])}
              </span>
              <span className="font-semibold" style={{ color: theme.text }}>
                {itemValue}
              </span>
              <span className="text-xs" style={{ color: theme.textSubtle }}>
                ({percentage.toFixed(1)}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface GroupedBarChartProps {
  data: ChartDatum[]
  keys: { key: string; label: string; color: string }[]
  nameKey: string
}

export function GroupedBarChartComponent({ data, keys, nameKey }: GroupedBarChartProps) {
  const theme = useAdminTheme()
  const maxValue = Math.max(...data.flatMap((item) => keys.map((key) => getChartNumber(item[key.key]))), 1)

  if (data.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4">
      <div className="mb-2 flex justify-center gap-4">
        {keys.map((key) => (
          <div key={key.key} className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: key.color }} />
            {key.label}
          </div>
        ))}
      </div>
      {data.slice(0, 8).map((item, index) => (
        <div key={index} className="space-y-1">
          <span className="text-xs" style={{ color: theme.textMuted }}>
            {getChartLabel(item[nameKey])}
          </span>
          {keys.map((key) => {
            const value = getChartNumber(item[key.key])
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

            return (
              <div key={key.key} className="flex items-center gap-2">
                <div className="h-4 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: theme.surfaceSubtle }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: index * 0.05, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: key.color }}
                  />
                </div>
                <span className="w-8 text-right text-xs" style={{ color: theme.text }}>
                  {value}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ message }: { message?: string }) {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()

  return (
    <div className="flex h-48 flex-col items-center justify-center text-center" style={{ color: theme.textMuted }}>
      <Inbox className="mb-3 h-12 w-12 opacity-50" />
      <p className="text-sm">{message || t('userStatsPage.empty')}</p>
    </div>
  )
}
