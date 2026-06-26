import { Activity, Award, CheckSquare, Clock } from 'lucide-react'
import type { ReportsAnalyticsResponse } from '../../types/reports-analytics.types'
import type { ThemeTokens, ReportsAnalyticsT } from './types'

interface MiniCardProps {
  label: string
  value: string
  icon: typeof Activity
  theme: ThemeTokens
  color?: string
}

function MiniCard({ label, value, icon: Icon, theme, color }: MiniCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border p-4"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: theme.hoverBg }}
      >
        <Icon className="h-4 w-4" style={{ color: color ?? theme.actionColor }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide" style={{ color: theme.mutedTextColor }}>
          {label}
        </p>
        <p className="mt-0.5 text-xl font-bold tabular-nums" style={{ color: color ?? theme.textColor }}>
          {value}
        </p>
      </div>
    </div>
  )
}

interface AcademicPerformanceCardsProps {
  data: Pick<ReportsAnalyticsResponse, 'quality' | 'activities'>
  theme: ThemeTokens
  t: ReportsAnalyticsT
}

export function AcademicPerformanceCards({ data, theme, t }: AcademicPerformanceCardsProps) {
  const { quality, activities } = data
  const pending = activities.totalActivities - activities.completedActivities

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: theme.textColor }}>
          {t('reportsAnalytics.sections.academicPerformance')}
        </h2>
        <p className="mt-1 text-sm" style={{ color: theme.subtextColor }}>
          {t('reportsAnalytics.sections.academicPerformanceSubtitle')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MiniCard
          label={t('reportsAnalytics.metrics.quizAverageScore') || 'Promedio evaluaciones'}
          value={`${Math.round(quality.quizAverageScore)}`}
          icon={Award}
          theme={theme}
          color={quality.quizAverageScore >= 70 ? theme.successColor : '#f59e0b'}
        />
        <MiniCard
          label={t('reportsAnalytics.metrics.quizPassRate') || 'Tasa de aprobación'}
          value={`${Math.round(quality.quizPassRate)}%`}
          icon={CheckSquare}
          theme={theme}
          color={quality.quizPassRate >= 70 ? theme.successColor : '#f59e0b'}
        />
        <MiniCard
          label={t('reportsAnalytics.metrics.completedActivities') || 'Actividades entregadas'}
          value={String(activities.completedActivities)}
          icon={Activity}
          theme={theme}
        />
        <MiniCard
          label={t('reportsAnalytics.metrics.pendingActivities') || 'Actividades pendientes'}
          value={String(Math.max(0, pending))}
          icon={Clock}
          theme={theme}
          color={pending > 0 ? '#f59e0b' : theme.successColor}
        />
      </div>
    </section>
  )
}
