'use client'

import { motion } from 'framer-motion'
import { SOFLIA_ADMIN_CHART_COLORS } from '../../constants/admin-color-tokens'

const COLORS = SOFLIA_ADMIN_CHART_COLORS

interface BarChartProps {
  data: Record<string, any>[]
  dataKey: string
  nameKey: string
  color?: string
}

export function BarChartComponent({ data, dataKey, nameKey, color }: BarChartProps) {
  const validData = data.filter(d => d && d[dataKey] != null)
  const maxValue = validData.length > 0 ? Math.max(...validData.map(d => d[dataKey])) : 1

  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>No hay datos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {validData.slice(0, 10).map((item, index) => {
        const percentage = maxValue > 0 ? ((item[dataKey] / maxValue) * 100) : 0
        const displayName = item[nameKey]?.length > 30 ? item[nameKey].substring(0, 30) + '...' : item[nameKey]

        return (
          <div
            key={index}
            className="group flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer"
          >
            <div className="w-32 text-right flex-shrink-0">
              <span className="text-sm font-medium text-gray-600 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {displayName}
              </span>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-full h-6 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: index * 0.05, duration: 1 }}
                className="h-full rounded-full relative overflow-hidden group-hover:brightness-125 transition-all duration-300"
                style={{
                  background: color
                    ? color
                    : `linear-gradient(to right, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`
                }}
              />
            </div>
            <div className="w-16 text-left">
              <span className="text-sm font-bold text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {typeof item[dataKey] === 'number' && !Number.isInteger(item[dataKey])
                  ? item[dataKey].toFixed(1)
                  : item[dataKey]}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface PieChartProps {
  data: Record<string, any>[]
  dataKey: string
  nameKey: string
}

export function PieChartComponent({ data, dataKey, nameKey }: PieChartProps) {
  const validData = data.filter(d => d && d[dataKey] != null && d[dataKey] > 0)
  const total = validData.reduce((sum, item) => sum + item[dataKey], 0)

  if (total === 0 || validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>No hay datos para mostrar</p>
      </div>
    )
  }

  let currentAngle = 0
  const radius = 80
  const centerX = 100
  const centerY = 100

  return (
    <div className="flex items-center justify-center gap-6">
      <div className="flex-shrink-0">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          <circle cx={centerX} cy={centerY} r={radius} fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          {validData.map((item, index) => {
            const percentage = (item[dataKey] / total) * 100
            const angle = (percentage / 100) * 360

            if (percentage >= 99.9) {
              return (
                <motion.circle
                  key={index}
                  cx={centerX}
                  cy={centerY}
                  r={radius}
                  fill={COLORS[index % COLORS.length]}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  stroke="white"
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
                fill={COLORS[index % COLORS.length]}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                stroke="white"
                strokeWidth="2"
              />
            )
          })}
        </svg>
      </div>

      <div className="flex flex-col justify-center gap-3 flex-shrink-0">
        {validData.map((item, index) => {
          const percentage = (item[dataKey] / total) * 100
          return (
            <div key={index} className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="text-gray-600 dark:text-gray-300 min-w-0 flex-1">{item[nameKey]}</span>
              <span className="text-gray-900 dark:text-white font-semibold">{item[dataKey]}</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">({percentage.toFixed(1)}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface GroupedBarChartProps {
  data: Record<string, any>[]
  keys: { key: string; label: string; color: string }[]
  nameKey: string
}

export function GroupedBarChartComponent({ data, keys, nameKey }: GroupedBarChartProps) {
  const maxValue = Math.max(...data.flatMap(d => keys.map(k => d[k.key] ?? 0)), 1)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>No hay datos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 justify-center mb-2">
        {keys.map(k => (
          <div key={k.key} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: k.color }} />
            {k.label}
          </div>
        ))}
      </div>
      {data.slice(0, 8).map((item, index) => (
        <div key={index} className="space-y-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">{item[nameKey]}</span>
          {keys.map(k => {
            const val = item[k.key] ?? 0
            const pct = maxValue > 0 ? (val / maxValue) * 100 : 0
            return (
              <div key={k.key} className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: index * 0.05, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: k.color }}
                  />
                </div>
                <span className="text-xs text-gray-900 dark:text-white w-8 text-right">{val}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
      <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-sm">{message || 'No hay datos disponibles'}</p>
    </div>
  )
}
