'use client'

import type { BusinessUserAnalyticsResponse } from '@/features/business-panel/types/business-user-analytics.types'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import {
  fmtNumber,
  fmtPercent,
  PERFORMANCE_COLORS,
  PERFORMANCE_LABELS,
  type PerformanceLevel,
  performanceLevel,
} from '../shared/dashboard-utils'

interface PerformanceCardsProps {
  data: BusinessUserAnalyticsResponse
}

const BAR_COLORS: Record<PerformanceLevel, string> = {
  excellent: 'bg-emerald-500',
  good:      'bg-amber-500',
  attention: 'bg-red-500',
}

export function PerformanceCards({ data }: PerformanceCardsProps) {
  const theme = useBusinessPanelTheme()
  const { quizzes, activities, overview } = data

  const quizAvg = quizzes.scoredCount > 0 ? quizzes.averageScore : null

  // Approved count: passRate × totalSubmissions.
  // activities.validated tracks a specific DB status; passRate is the reliable source.
  const activitiesTotal    = activities.totalSubmissions
  const activitiesApproved = activitiesTotal > 0
    ? Math.round((activities.passRate / 100) * activitiesTotal)
    : 0

  const completionRate = Math.round(overview.completionRate)

  return (
    <section
      aria-label="Rendimiento"
      className="rounded-2xl border p-6 shadow-sm"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rendimiento</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Indicadores clave de tu desempeño en el período.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <PerformanceCard
          label="Promedio de Quizzes"
          value={quizAvg !== null ? fmtPercent(quizAvg) : '—'}
          score={quizAvg ?? 0}
          detail={
            quizzes.quizzesTaken > 0
              ? `${quizzes.quizzesTaken} quiz${quizzes.quizzesTaken > 1 ? 'zes' : ''} presentado${quizzes.quizzesTaken > 1 ? 's' : ''}`
              : 'Sin quizzes presentados'
          }
          noData={quizAvg === null}
        />

        <PerformanceCard
          label="Actividades Aprobadas"
          value={activitiesTotal > 0 ? `${fmtNumber(activitiesApproved)} de ${fmtNumber(activitiesTotal)}` : '—'}
          score={activities.passRate}
          detail={activitiesTotal > 0 ? `${fmtPercent(activities.passRate)} de aprobación` : 'Sin actividades entregadas'}
          noData={activitiesTotal === 0}
        />

        <PerformanceCard
          label="Tasa de Finalización"
          value={fmtPercent(completionRate, 0)}
          score={completionRate}
          detail={`${overview.completedCourses} de ${overview.totalAssigned} cursos terminados`}
          noData={overview.totalAssigned === 0}
        />
      </div>
    </section>
  )
}

function PerformanceCard({
  label,
  value,
  score,
  detail,
  noData,
}: {
  label:  string
  value:  string
  score:  number
  detail: string
  noData: boolean
}) {
  const theme  = useBusinessPanelTheme()
  const level  = noData ? null : performanceLevel(score)
  const colors = level ? PERFORMANCE_COLORS[level] : null

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border p-5"
      style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </p>

      <p className="text-3xl font-bold tracking-tight tabular-nums text-gray-900 dark:text-white">
        {value}
      </p>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">{detail}</p>

        {level && colors ? (
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.badge}`}>
            {PERFORMANCE_LABELS[level]}
          </span>
        ) : null}
      </div>

      {/* Mini progress bar — semantic color classes, not hardcoded hex */}
      {!noData && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: theme.borderColor }}
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ${level ? BAR_COLORS[level] : 'bg-gray-400'}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      )}
    </div>
  )
}
