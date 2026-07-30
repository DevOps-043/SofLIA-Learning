'use client'

import type { ComponentType } from 'react'
import { BadgeCheck, BookOpenCheck, Clock3, LibraryBig } from 'lucide-react'
import type { BusinessUserAnalyticsResponse } from '@/features/business-panel/types/business-user-analytics.types'
import { estimateTotalLessons, fmtDuration, fmtNumber, fmtPercent } from '../shared/dashboard-utils'
import styles from '../BusinessUserAnalytics.module.css'

interface OverviewKPIsProps {
  data: BusinessUserAnalyticsResponse
}

export function OverviewKPIs({ data }: OverviewKPIsProps) {
  const { overview } = data
  const totalLessons = estimateTotalLessons(data)
  const progress = Math.min(100, Math.max(0, Math.round(overview.averageProgress)))

  return (
    <section
      aria-label="Resumen general"
      className={styles.kpiGrid}
    >
      <ProgressCard
        progress={progress}
        lessonsCompleted={overview.lessonsCompleted}
        totalLessons={totalLessons}
      />

      <KPICard
        icon={LibraryBig}
        label="Cursos completados"
        value={`${fmtNumber(overview.completedCourses)} / ${fmtNumber(overview.totalAssigned)}`}
        detail={
          overview.inProgressCourses > 0
            ? `${overview.inProgressCourses} en progreso`
            : 'Sin cursos en progreso'
        }
      />

      <KPICard
        icon={Clock3}
        label="Tiempo de aprendizaje"
        value={fmtDuration(overview.timeSpentMinutes)}
        detail={`${overview.activeDays} días activo en el período`}
      />

      <KPICard
        icon={BadgeCheck}
        label="Certificados obtenidos"
        value={fmtNumber(overview.certificates)}
        detail={
          overview.certificates === 0
            ? 'Completa un curso para obtener uno'
            : overview.certificates === 1
              ? '1 curso terminado al 100%'
              : `${overview.certificates} cursos terminados al 100%`
        }
      />
    </section>
  )
}

// ─── Progress card ─────────────────────────────────────────────────────────────

function ProgressCard({
  progress,
  lessonsCompleted,
  totalLessons,
}: {
  progress: number
  lessonsCompleted: number
  totalLessons: number
}) {
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (progress / 100) * circumference

  return (
    <article
      className={styles.kpiCard}
    >
      <div className={styles.progressOverview}>
        <div className={styles.progressRing}>
          <svg viewBox="0 0 100 100" className={styles.progressRingSvg} aria-hidden="true">
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="var(--analytics-border)"
              strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="var(--analytics-accent)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <span
            className={styles.progressRingValue}
            aria-label={`${progress}% de progreso`}
          >
            {progress}%
          </span>
        </div>

        <div className={styles.progressMeta}>
          <p className={styles.kpiLabel}>
            Progreso general
          </p>
          <p className={styles.kpiValue}>
            {fmtPercent(progress, 0)}
          </p>
        </div>
      </div>

      <div>
        <div className={styles.progressLessonRow}>
          <span className={styles.progressLessonLabel}>
            <BookOpenCheck className="h-3.5 w-3.5" />
            Lecciones
          </span>
          {totalLessons > 0 ? (
            <span className={styles.progressLessonValue}>
              {fmtNumber(lessonsCompleted)} / {fmtNumber(totalLessons)}
            </span>
          ) : (
            <span className={styles.progressLessonValue}>
              {fmtNumber(lessonsCompleted)} completadas
            </span>
          )}
        </div>
        <div className={styles.track}>
          <div
            className={styles.trackFill}
            style={{ width: `${progress}%` }}
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
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
}) {
  return (
    <article
      className={styles.kpiCard}
    >
      <div className={styles.kpiIcon}>
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className={styles.kpiLabel}>
          {label}
        </p>
        <p className={styles.kpiValue}>
          {value}
        </p>
      </div>

      <p className={styles.kpiDetail}>{detail}</p>
    </article>
  )
}
