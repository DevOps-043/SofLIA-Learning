import { ResponsiveDataTableColumn } from '@/core/layout'
import { formatCourseStatsDate } from './date'
import { DetailsButton, ProgressBar, StatusBadge } from './StudentMetricAtoms'
import { StudentIdentity } from './StudentIdentity'
import type { CourseStatsStudentRow } from './types'

const HEADER_CLASS = 'px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white'
const CENTER_HEADER_CLASS = 'px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white'
const DATE_CELL_CLASS = 'px-6 py-4 text-sm text-gray-500 dark:text-white/70'

export function buildCourseStatsStudentsColumns(
  onOpenDetails: (user: CourseStatsStudentRow) => void,
  labels: {
    actions: string
    enrolledAt: string
    lastActivity: string
    never: string
    progress: string
    status: string
    student: string
  },
  locale: string,
): ResponsiveDataTableColumn<CourseStatsStudentRow>[] {
  return [
    {
      id: 'student',
      header: labels.student,
      thClassName: HEADER_CLASS,
      tdClassName: 'px-6 py-4',
      mobileHidden: true,
      cell: (user) => <StudentIdentity user={user} />,
    },
    {
      id: 'status',
      header: labels.status,
      thClassName: HEADER_CLASS,
      tdClassName: 'px-6 py-4',
      mobileLabel: labels.status,
      mobileOrder: 1,
      cell: (user) => <StatusBadge enrollmentStatus={user.enrollment_status} />,
    },
    {
      id: 'progress',
      header: labels.progress,
      thClassName: HEADER_CLASS,
      tdClassName: 'px-6 py-4',
      mobileLabel: labels.progress,
      mobileOrder: 2,
      cell: (user) => <ProgressBar progressPercentage={user.progress_percentage} />,
      mobileValue: (user) => `${Math.round(user.progress_percentage)}%`,
    },
    {
      id: 'enrolledAt',
      header: labels.enrolledAt,
      thClassName: HEADER_CLASS,
      tdClassName: DATE_CELL_CLASS,
      mobileLabel: labels.enrolledAt,
      mobileOrder: 3,
      cell: (user) => formatCourseStatsDate(user.enrolled_at, false, locale, labels.never),
    },
    {
      id: 'lastActivity',
      header: labels.lastActivity,
      thClassName: HEADER_CLASS,
      tdClassName: DATE_CELL_CLASS,
      mobileLabel: labels.lastActivity,
      mobileOrder: 4,
      cell: (user) => formatCourseStatsDate(user.last_accessed_at, true, locale, labels.never),
    },
    {
      id: 'actions',
      header: labels.actions,
      thClassName: CENTER_HEADER_CLASS,
      tdClassName: 'px-6 py-4',
      mobileHidden: true,
      cell: (user) => (
        <div className="flex items-center justify-center">
          <DetailsButton onClick={() => onOpenDetails(user)} />
        </div>
      ),
    },
  ]
}
