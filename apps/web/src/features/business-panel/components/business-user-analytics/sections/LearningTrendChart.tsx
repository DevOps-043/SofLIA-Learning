'use client'

import { useMemo } from 'react'
import type { BusinessUserAnalyticsRange, BusinessUserAnalyticsTrendPoint } from '@/features/business-panel/types/business-user-analytics.types'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

const RANGE_OPTIONS: { value: BusinessUserAnalyticsRange; label: string }[] = [
  { value: '30d',  label: '30 días' },
  { value: '90d',  label: '90 días' },
  { value: '365d', label: '1 año'   },
]

interface LearningTrendChartProps {
  lessonTrend:    BusinessUserAnalyticsTrendPoint[]
  activityTrend:  BusinessUserAnalyticsTrendPoint[]
  range:          BusinessUserAnalyticsRange
  onRangeChange:  (r: BusinessUserAnalyticsRange) => void
}

const W        = 800
const H        = 220
const PAD      = { top: 16, right: 16, bottom: 36, left: 40 }
const PLOT_W   = W - PAD.left - PAD.right
const PLOT_H   = H - PAD.top  - PAD.bottom
const Y_TICKS  = 5
const MAX_X_LABELS = 8

interface MergedPoint {
  key:        string
  label:      string
  lessons:    number
  activities: number
}

export function LearningTrendChart({
  lessonTrend,
  activityTrend,
  range,
  onRangeChange,
}: LearningTrendChartProps) {
  const theme = useBusinessPanelTheme()
  const points = useMemo<MergedPoint[]>(() => {
    const map = new Map<string, MergedPoint>()
    for (const p of lessonTrend) {
      map.set(p.key, { key: p.key, label: p.label, lessons: p.value, activities: 0 })
    }
    for (const p of activityTrend) {
      const existing = map.get(p.key)
      if (existing) {
        existing.activities = p.value
      } else {
        map.set(p.key, { key: p.key, label: p.label, lessons: 0, activities: p.value })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
  }, [lessonTrend, activityTrend])

  const isEmpty = points.length === 0

  const maxValue = useMemo(
    () => Math.max(1, ...points.map((p) => Math.max(p.lessons, p.activities))),
    [points],
  )

  const xFor = (index: number) =>
    PAD.left + (points.length <= 1 ? PLOT_W / 2 : (index / (points.length - 1)) * PLOT_W)

  const yFor = (value: number) =>
    PAD.top + PLOT_H - (Math.max(0, value) / maxValue) * PLOT_H

  const yTicks = useMemo(() => {
    const step = Math.ceil(maxValue / Y_TICKS) || 1
    return Array.from({ length: Y_TICKS + 1 }, (_, i) => Math.round(step * i))
  }, [maxValue])

  const labelStep = Math.max(1, Math.ceil(points.length / MAX_X_LABELS))
  const lessonPath   = points.map((p, i) => `${xFor(i)},${yFor(p.lessons)}`).join(' ')
  const activityPath = points.map((p, i) => `${xFor(i)},${yFor(p.activities)}`).join(' ')

  return (
    <section
      aria-label="Evolución de aprendizaje"
      className="rounded-2xl border p-6 shadow-sm"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Evolución de aprendizaje
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Mira si estás aprendiendo más o menos que antes.
          </p>
        </div>

        {/* Range selector */}
        <div
          className="flex gap-1 rounded-xl border p-1"
          style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
        >
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onRangeChange(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                range === opt.value
                  ? 'no-theme text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              style={range === opt.value ? { backgroundColor: theme.actionColor, color: theme.onActionColor } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="flex h-48 items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Sin datos de actividad en este período.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <svg
              aria-hidden="true"
              viewBox={`0 0 ${W} ${H}`}
              className="h-56 w-full min-w-[400px]"
              style={{ overflow: 'visible' }}
            >
              {yTicks.map((tick) => {
                const y = yFor(tick)
                return (
                  <g key={tick}>
                    <line
                      x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
                      stroke={theme.borderColor}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={PAD.left - 8} y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize="11"
                      fill="currentColor"
                      className="text-gray-400 dark:text-gray-500"
                    >
                      {tick}
                    </text>
                  </g>
                )
              })}

              {points.length >= 2 && (
                <>
                  <polyline
                    points={`${xFor(0)},${yFor(0)} ${lessonPath} ${xFor(points.length - 1)},${yFor(0)}`}
                    fill={theme.actionColor}
                    fillOpacity="0.08"
                    stroke="none"
                  />
                  <polyline
                    points={`${xFor(0)},${yFor(0)} ${activityPath} ${xFor(points.length - 1)},${yFor(0)}`}
                    fill={theme.accentColor}
                    fillOpacity="0.08"
                    stroke="none"
                  />
                </>
              )}

              <polyline
                points={lessonPath}
                fill="none"
                stroke={theme.actionColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={activityPath}
                fill="none"
                stroke={theme.accentColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((p, i) => (
                <g key={p.key}>
                  <circle cx={xFor(i)} cy={yFor(p.lessons)}    r="3.5" fill={theme.actionColor} />
                  <circle cx={xFor(i)} cy={yFor(p.activities)} r="3.5" fill={theme.accentColor}  />
                </g>
              ))}

              {points.map((p, i) => {
                const isLast = i === points.length - 1
                if (i % labelStep !== 0 && !isLast) return null
                return (
                  <text
                    key={`x-${p.key}`}
                    x={xFor(i)} y={H - 4}
                    textAnchor="middle"
                    fontSize="11"
                    fill="currentColor"
                    className="text-gray-400 dark:text-gray-500"
                  >
                    {p.label}
                  </text>
                )
              })}
            </svg>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.actionColor }} />
              Lecciones completadas
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />
              Actividades entregadas
            </span>
          </div>
        </>
      )}
    </section>
  )
}
