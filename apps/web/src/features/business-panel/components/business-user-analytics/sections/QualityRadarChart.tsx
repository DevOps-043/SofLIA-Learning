'use client'

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Gauge } from 'lucide-react'
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
import styles from '../BusinessUserAnalytics.module.css'

interface QualityRadarChartProps {
  quality: BusinessUserAnalyticsQuality
}

export function QualityRadarChart({ quality }: QualityRadarChartProps) {
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('business')

  // The server returns raw dimension keys ('courses', 'quizzes', ...) as labels;
  // translate them client-side so the chart follows the user's language.
  const dimensionLabel = useCallback(
    (key: string, fallback: string) => t(`analytics.quality.radar.${key}`, fallback),
    [t],
  )

  const radarData = useMemo(
    () =>
      quality.radar.map((item) => ({
        subject: dimensionLabel(item.key, item.label),
        value: Math.round(item.value),
        fullMark: 100,
      })),
    [quality.radar, dimensionLabel],
  )

  const level = performanceLevel(quality.overallScore)
  const colors = PERFORMANCE_COLORS[level]

  if (radarData.length === 0) return null

  return (
    <section
      aria-label="Perfil de calidad"
      className={`${styles.sectionCard} ${styles.sectionPadding}`}
    >
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionIcon} aria-hidden="true">
            <Gauge className="h-4 w-4" />
          </span>
          <div>
          <h2 className={styles.sectionTitle}>Perfil de calidad</h2>
          <p className={styles.sectionSubtitle}>
            Evaluación de tu desempeño en cada dimensión de aprendizaje.
          </p>
          </div>
        </div>
        <div className={styles.qualityScore}>
          <p className={styles.qualityValue}>
            {Math.round(quality.overallScore)}
            <span className={styles.qualityScale}>/100</span>
          </p>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
            {PERFORMANCE_LABELS[level]}
          </span>
        </div>
      </div>

      <div className={styles.qualityGrid}>
        {/* Radar chart */}
        <div className={styles.radarWrap}>
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
                stroke="var(--analytics-action)"
                fill="var(--analytics-action)"
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ r: 4, fill: 'var(--analytics-action)', strokeWidth: 0 }}
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
        <div className={styles.dimensionList}>
          {quality.radar.map((item) => {
            const dimLevel = performanceLevel(item.value)
            const dimColors = PERFORMANCE_COLORS[dimLevel]
            return (
              <div key={item.key} className={styles.dimensionRow}>
                <span className={styles.dimensionLabel}>
                  {dimensionLabel(item.key, item.label)}
                </span>
                <div className={styles.track}>
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
                <span className={`${styles.dimensionValue} ${dimColors.text}`}>
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
