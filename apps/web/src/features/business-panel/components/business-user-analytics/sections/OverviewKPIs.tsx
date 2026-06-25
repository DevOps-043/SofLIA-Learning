'use client'

import type { ComponentType } from 'react'
import { Award, BookOpen, Clock, GraduationCap } from 'lucide-react'
import type { BusinessUserAnalyticsResponse } from '@/features/business-panel/types/business-user-analytics.types'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { estimateTotalLessons, fmtDuration, fmtNumber, fmtPercent } from '../shared/dashboard-utils'

interface OverviewKPIsProps {
  data: BusinessUserAnalyticsResponse
}

export function OverviewKPIs({ data }: OverviewKPIsProps) {
  const theme = useBusinessPanelTheme()
  const { overview } = data
  const totalLessons = estimateTotalLessons(data)
  const progress = Math.min(100, Math.max(0, Math.round(overview.averageProgress)))

  return (
    <section
      aria-label="Resumen general"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <ProgressCard
        progress={progress}
        lessonsCompleted={overview.lessonsCompleted}
        totalLessons={totalLessons}
        theme={theme}
      />

      <KPICard
        icon={GraduationCap}
        label="Cursos completados"
        value={`${fmtNumber(overview.completedCourses)} / ${fmtNumber(overview.totalAssigned)}`}
        detail={
          overview.inProgressCourses > 0
            ? `${overview.inProgressCourses} en progreso`
            : 'Sin cursos en progreso'
        }
        theme={theme}
      />

      <KPICard
        icon={Clock}
        label="Tiempo de aprendizaje"
        value={fmtDuration(overview.timeSpentMinutes)}
        detail={`${overview.activeDays} días activo en el período`}
        theme={theme}
      />

      <KPICard
        icon={Award}
        label="Certificados obtenidos"
        value={fmtNumber(overview.certificates)}
        detail={
          overview.certificates === 0
            ? 'Completa un curso para obtener uno'
            : overview.certificates === 1
              ? '1 curso terminado al 100%'
              : `${overview.certificates} cursos terminados al 100%`
        }
        theme={theme}
      />
    </section>
  )
}

// ─── Progress card ─────────────────────────────────────────────────────────────

function ProgressCard({
  progress,
  lessonsCompleted,
  totalLessons,
  theme,
}: {
  progress: number
  lessonsCompleted: number
  totalLessons: number
  theme: ReturnType<typeof useBusinessPanelTheme>
}) {
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (progress / 100) * circumference

  return (
    <article
      className="flex flex-col justify-between gap-4 rounded-2xl border p-6 shadow-sm"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 88, height: 88 } as CSSProperties}>
          <svg width="88" height="88" viewBox="0 0 100 100" className="-rotate-90" aria-hidden="true">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={theme.borderColor}
              strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={theme.accentColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white"
            aria-label={`${progress}% de progreso`}
          >
            {progress}%
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Progreso general
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {fmtPercent(progress, 0)}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            Lecciones
          </span>
          {totalLessons > 0 ? (
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {fmtNumber(lessonsCompleted)} / {fmtNumber(totalLessons)}
            </span>
          ) : (
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {fmtNumber(lessonsCompleted)} completadas
            </span>
          )}
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: theme.borderColor }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, backgroundColor: theme.accentColor }}
          />
        </div>
      </div>
    </article>
  )
}

// ─── Generic KPI card ─────────────────────────────────────────────────────────

function KPICard({
  icon: Icon,
  label,
  value,
  detail,
  theme,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
  theme: ReturnType<typeof useBusinessPanelTheme>
}) {
  return (
    <article
      className="flex flex-col justify-between gap-3 rounded-2xl border p-6 shadow-sm"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `color-mix(in srgb, ${theme.actionColor} 12%, transparent)`,
          color: theme.actionColor,
        }}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {value}
        </p>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">{detail}</p>
    </article>
  )
}
