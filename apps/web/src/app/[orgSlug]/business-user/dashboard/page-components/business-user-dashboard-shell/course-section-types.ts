import type { Transition } from 'framer-motion'

import type {
  BusinessUserDashboardShellProps,
  CourseListSection,
  CourseViewMode,
} from './types'

export interface DashboardCoursesSectionState {
  collapsedGroups: Record<string, boolean>
  coursePathMap: Map<string, { isUnlocked: boolean; pathTitle: string; position: number }>
  courseView: CourseViewMode
  displayedCourses: BusinessUserDashboardShellProps['assignedCourses']
  groupedListSections: CourseListSection[]
  interfaceTransition: Transition
  onCourseViewChange: (view: CourseViewMode) => void
  onLoadMoreCourses: () => void
  onToggleGroup: (groupId: string) => void
  showLearningPathCarousel: boolean
}

export type ShellCourseProps = Pick<
  BusinessUserDashboardShellProps,
  | 'assignedCourses'
  | 'disableHeavyEffects'
  | 'handleCourseClick'
  | 'handleLearningPathCourseClick'
  | 'learningPaths'
  | 'orgColors'
  | 'orgSlug'
  | 't'
  | 'userDashboardStyles'
>

export type DashboardCoursesSectionProps =
  DashboardCoursesSectionState & ShellCourseProps
