import { Suspense } from 'react'
import type { Transition } from 'framer-motion'

import { CourseListGroup } from './CourseListGroup'
import type { BusinessUserDashboardShellProps, CourseListSection } from './types'

interface CourseListViewProps {
  assignedCourses: BusinessUserDashboardShellProps['assignedCourses']
  collapsedGroups: Record<string, boolean>
  disableHeavyEffects: boolean
  groupedListSections: CourseListSection[]
  handleCourseClick: BusinessUserDashboardShellProps['handleCourseClick']
  handleLearningPathCourseClick: BusinessUserDashboardShellProps['handleLearningPathCourseClick']
  interfaceTransition: Transition
  onToggleGroup: (groupId: string) => void
  orgColors: BusinessUserDashboardShellProps['orgColors']
  t: BusinessUserDashboardShellProps['t']
  userDashboardStyles: BusinessUserDashboardShellProps['userDashboardStyles']
}

export function CourseListView({
  assignedCourses,
  collapsedGroups,
  groupedListSections,
  onToggleGroup,
  ...groupProps
}: CourseListViewProps) {
  return (
    <div className="space-y-8">
      <Suspense
        fallback={
          <div className="space-y-4">
            {assignedCourses.map((_, index) => (
              <div
                key={index}
                className="h-20 w-full animate-pulse rounded-2xl"
                style={{
                  backgroundColor: groupProps.orgColors.cardBg,
                  border: `1px solid ${groupProps.orgColors.border}`,
                }}
              />
            ))}
          </div>
        }
      >
        {groupedListSections.map((section) => (
          <CourseListGroup
            key={section.id}
            {...groupProps}
            collapsed={Boolean(collapsedGroups[section.id])}
            onToggle={() => onToggleGroup(section.id)}
            section={section}
          />
        ))}
      </Suspense>
    </div>
  )
}
