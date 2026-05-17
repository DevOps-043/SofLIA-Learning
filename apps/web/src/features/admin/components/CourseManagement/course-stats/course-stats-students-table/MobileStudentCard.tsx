import type React from 'react'
import { formatCourseStatsDate } from './date'
import { StudentIdentity } from './StudentIdentity'
import {
  DetailsButton,
  MetadataCard,
  ProgressBar,
  StatusBadge,
} from './StudentMetricAtoms'
import type { CourseStatsStudentRow } from './types'

interface MobileStudentCardProps {
  user: CourseStatsStudentRow
  onOpenDetails: (user: CourseStatsStudentRow) => void
}

export function MobileStudentCard({ user, onOpenDetails }: MobileStudentCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-500/30 dark:bg-carbon-800">
      <StudentIdentity avatarSize="md" user={user} />

      <div className="mt-4 space-y-3">
        <MobileMetric label="Estado">
          <StatusBadge enrollmentStatus={user.enrollment_status} />
        </MobileMetric>
        <MobileMetric label="Progreso">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {Math.round(user.progress_percentage)}%
          </span>
        </MobileMetric>
        <ProgressBar compact progressPercentage={user.progress_percentage} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <MetadataCard label="Inscrito" value={formatCourseStatsDate(user.enrolled_at, false)} />
          <MetadataCard label="Ultima actividad" value={formatCourseStatsDate(user.last_accessed_at, true)} />
        </div>
      </div>

      <div className="mt-4">
        <DetailsButton fullWidth onClick={() => onOpenDetails(user)} />
      </div>
    </div>
  )
}

function MobileMetric({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/60">
        {label}
      </span>
      {children}
    </div>
  )
}
