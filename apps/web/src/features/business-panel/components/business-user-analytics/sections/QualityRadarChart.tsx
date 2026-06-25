'use client'

import { useMemo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { BusinessUserAnalyticsQuality } from '@/features/business-panel/types/business-user-analytics.types'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { performanceLevel, PERFORMANCE_COLORS, PERFORMANCE_LABELS } from '../shared/dashboard-utils'

interface QualityRadarChartProps {
  quality: BusinessUserAnalyticsQuality
}

export function QualityRadarChart({ quality }: QualityRadarChartProps) {
  const theme = useBusinessPanelTheme()

  const radarData = useMemo(
    () =>
      quality.radar.map((item) => ({
        subject: item.label,
        value: Math.round(item.value),
        fullMark: 100,
      })),
    [quality.radar],
  )

  const level = performanceLevel(quality.overallScore)
  const colors = PERFORMANCE_COLORS[level]

  if (radarData.length === 0) return null

  return (
    <section
      aria-label="Perfil de calidad"
      className="rounded-2xl border p-6 shadow-sm"
      style={{ backgroundColor: 'var(--dash-card)', borderColor: 'var(--dash-border)' }}
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Perfil de calidad</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Evaluación de tu desempeño en cada dimensión de aprendizaje.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold tracking-tight tabular-nums text-gray-900 dark:text-white">
            {Math.round(quality.overallScore)}
            <span className="ml-0.5 text-lg font-normal text-gray-400">/100</span>
          </p>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
            {PERFORMANCE_LABELS[level]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Radar chart */}
        <div className="flex h-64 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 28, bottom: 10, left: 28 }}>
              <PolarGrid
                stroke={theme.borderColor}
                strokeOpacity={0.6}
              />
              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fill: theme.subtextColor,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <Radar
                name="Puntuación"
                dataKey="value"
                stroke={theme.actionColor}
                fill={theme.actionColor}
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ r: 4, fill: theme.actionColor, strokeWidth: 0 }}
              />
              <Tooltip
                formatter={(val: unknown) => [`${val as number}/100`, 'Puntuación']}
                contentStyle={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                  borderRadius: 8,
                  fontSize: 12,
                  color: theme.textColor,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Dimension bars */}
        <div className="flex flex-col justify-center gap-3.5">
          {quality.radar.map((item) => {
            const dimLevel = performanceLevel(item.value)
            const dimColors = PERFORMANCE_COLORS[dimLevel]
            return (
              <div key={item.key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {item.label}
                </span>
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full"
                  style={{ backgroundColor: theme.borderColor }}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      dimLevel === 'excellent'
                        ? 'bg-emerald-500'
                        : dimLevel === 'good'
                          ? 'bg-amber-500'
                          : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                  />
                </div>
                <span className={`w-10 shrink-0 text-right text-xs font-bold tabular-nums ${dimColors.text}`}>
                  {Math.round(item.value)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
