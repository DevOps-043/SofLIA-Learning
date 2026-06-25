'use client'

import { CheckCircle2, Circle, Clock } from 'lucide-react'
import type { BusinessUserAnalyticsCourseProgressRow } from '@/features/business-panel/types/business-user-analytics.types'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { fmtPercent } from '../shared/dashboard-utils'

interface CourseProgressBarsProps {
  courses: BusinessUserAnalyticsCourseProgressRow[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  completed:   { label: 'Completado',   icon: CheckCircle2, className: 'text-emerald-600 dark:text-emerald-400' },
  in_progress: { label: 'En progreso',  icon: Clock,        className: 'text-blue-500 dark:text-blue-400'       },
  not_started: { label: 'Sin comenzar', icon: Circle,       className: 'text-gray-400 dark:text-gray-500'       },
}

function statusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started
}

export function CourseProgressBars({ courses }: CourseProgressBarsProps) {
  const theme = useBusinessPanelTheme()
  if (courses.length === 0) {
    return (
      <SectionCard title="Avance por curso" subtitle="Comparación de tus cursos por progreso." theme={theme}>
        <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          No tienes cursos asignados en este período.
        </p>
      </SectionCard>
    )
  }

  const sorted = [...courses].sort((a, b) => b.progress - a.progress)

  return (
    <SectionCard
      title="Avance por curso"
      subtitle="Tus cursos ordenados de mayor a menor progreso."
      theme={theme}
    >
      <div className="space-y-6">
        {sorted.map((course) => (
          <CourseRow key={course.courseId} course={course} theme={theme} />
        ))}
      </div>
    </SectionCard>
  )
}

function CourseRow({ course, theme }: { course: BusinessUserAnalyticsCourseProgressRow; theme: ReturnType<typeof useBusinessPanelTheme> }) {
  const progress = Math.min(100, Math.max(0, Math.round(course.progress)))
  const cfg  = statusConfig(course.status)
  const Icon = cfg.icon

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-4">
        <p
          className="min-w-0 flex-1 text-sm font-semibold leading-snug text-gray-800 dark:text-gray-100"
          title={course.courseTitle}
        >
          {course.courseTitle}
        </p>

        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
            {fmtPercent(progress, 0)}
          </span>
          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
          </span>
        </div>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: theme.borderColor }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${progress}%`, backgroundColor: theme.actionColor }}
        />
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
  theme,
}: {
  title:     string
  subtitle?: string
  children:  React.ReactNode
  theme:     ReturnType<typeof useBusinessPanelTheme>
}) {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border p-6 shadow-sm"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}
