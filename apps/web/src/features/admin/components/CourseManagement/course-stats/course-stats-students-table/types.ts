import type { useCourseManagementContext } from '../../CourseManagementContext'

export type CourseStatsStudentRow = ReturnType<
  typeof useCourseManagementContext
>['state']['enrolledUsers'][number]
