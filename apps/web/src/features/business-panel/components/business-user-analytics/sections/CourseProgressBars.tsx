'use client'

import { ChartNoAxesColumnIncreasing, CheckCircle2, Circle, Clock3 } from 'lucide-react'
import type { BusinessUserAnalyticsCourseProgressRow } from '@/features/business-panel/types/business-user-analytics.types'
import { fmtPercent } from '../shared/dashboard-utils'
import styles from '../BusinessUserAnalytics.module.css'

interface CourseProgressBarsProps {
  courses: BusinessUserAnalyticsCourseProgressRow[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  completed:   { label: 'Completado',   icon: CheckCircle2, className: 'text-emerald-600 dark:text-emerald-400' },
  in_progress: { label: 'En progreso',  icon: Clock3,       className: 'text-blue-500 dark:text-blue-400'       },
  not_started: { label: 'Sin comenzar', icon: Circle,       className: 'text-gray-400 dark:text-gray-500'       },
}

function statusConfig(status: string) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started
}

export function CourseProgressBars({ courses }: CourseProgressBarsProps) {
  if (courses.length === 0) {
    return (
      <SectionCard title="Avance por curso" subtitle="Comparación de tus cursos por progreso.">
        <p className={styles.chartEmpty}>
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
    >
      <div className={styles.courseList}>
        {sorted.map((course) => (
          <CourseRow key={course.courseId} course={course} />
        ))}
      </div>
    </SectionCard>
  )
}

function CourseRow({ course }: { course: BusinessUserAnalyticsCourseProgressRow }) {
  const progress = Math.min(100, Math.max(0, Math.round(course.progress)))
  const cfg  = statusConfig(course.status)
  const Icon = cfg.icon

  return (
    <div className={styles.courseRow}>
      <div className={styles.courseTopline}>
        <p
          className={styles.courseTitle}
          title={course.courseTitle}
        >
          {course.courseTitle}
        </p>

        <div className={styles.courseMeta}>
          <span className={styles.coursePercent}>
            {fmtPercent(progress, 0)}
          </span>
          <span className={`${styles.courseStatus} ${cfg.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
          </span>
        </div>
      </div>

      <div className={`${styles.track} ${styles.trackLarge}`}>
        <div
          className={styles.trackFill}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title:     string
  subtitle?: string
  children:  React.ReactNode
}) {
  return (
    <section
      aria-label={title}
      className={`${styles.sectionCard} ${styles.sectionPadding}`}
    >
      <div className={styles.sectionHeader}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionIcon} aria-hidden="true">
            <ChartNoAxesColumnIncreasing className="h-4 w-4" />
          </span>
          <div>
            <h2 className={styles.sectionTitle}>{title}</h2>
            {subtitle ? <p className={styles.sectionSubtitle}>{subtitle}</p> : null}
          </div>
        </div>
      </div>
      {children}
    </section>
  )
}
