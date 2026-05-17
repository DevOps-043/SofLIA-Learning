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
): ResponsiveDataTableColumn<CourseStatsStudentRow>[] {
  return [
    {
      id: 'student',
      header: 'Estudiante',
      thClassName: HEADER_CLASS,
      tdClassName: 'px-6 py-4',
      mobileHidden: true,
      cell: (user) => <StudentIdentity user={user} />,
    },
    {
      id: 'status',
      header: 'Estado',
      thClassName: HEADER_CLASS,
      tdClassName: 'px-6 py-4',
      mobileLabel: 'Estado',
      mobileOrder: 1,
      cell: (user) => <StatusBadge enrollmentStatus={user.enrollment_status} />,
    },
    {
      id: 'progress',
      header: 'Progreso',
      thClassName: HEADER_CLASS,
      tdClassName: 'px-6 py-4',
      mobileLabel: 'Progreso',
      mobileOrder: 2,
      cell: (user) => <ProgressBar progressPercentage={user.progress_percentage} />,
      mobileValue: (user) => `${Math.round(user.progress_percentage)}%`,
    },
    {
      id: 'enrolledAt',
      header: 'Inscrito',
      thClassName: HEADER_CLASS,
      tdClassName: DATE_CELL_CLASS,
      mobileLabel: 'Inscrito',
      mobileOrder: 3,
      cell: (user) => formatCourseStatsDate(user.enrolled_at, false),
    },
    {
      id: 'lastActivity',
      header: 'Ultima Actividad',
      thClassName: HEADER_CLASS,
      tdClassName: DATE_CELL_CLASS,
      mobileLabel: 'Ultima actividad',
      mobileOrder: 4,
      cell: (user) => formatCourseStatsDate(user.last_accessed_at, true),
    },
    {
      id: 'actions',
      header: 'Acciones',
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
