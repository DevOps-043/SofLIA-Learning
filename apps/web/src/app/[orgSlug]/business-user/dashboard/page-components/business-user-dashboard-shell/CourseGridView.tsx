import { Suspense } from 'react'

import { CourseCard3D } from './dynamic-components'
import type { BusinessUserDashboardShellProps } from './types'

interface CourseGridViewProps {
  assignedCourses: BusinessUserDashboardShellProps['assignedCourses']
  coursePathMap: Map<string, { isUnlocked: boolean; pathTitle: string; position: number }>
  disableHeavyEffects: boolean
  displayedCourses: BusinessUserDashboardShellProps['assignedCourses']
  handleCourseClick: BusinessUserDashboardShellProps['handleCourseClick']
  orgColors: BusinessUserDashboardShellProps['orgColors']
  userDashboardStyles: BusinessUserDashboardShellProps['userDashboardStyles']
}

export function CourseGridView({
  assignedCourses,
  coursePathMap,
  disableHeavyEffects,
  displayedCourses,
  handleCourseClick,
  orgColors,
  userDashboardStyles,
}: CourseGridViewProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
      <Suspense
        fallback={assignedCourses.map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-2xl"
            style={{
              backgroundColor: orgColors.cardBg,
              border: `1px solid ${orgColors.border}`,
            }}
          />
        ))}
      >
        {displayedCourses.map((course, index) => {
          const pathInfo = coursePathMap.get(course.course_id)
          return (
            <CourseCard3D
              key={course.id}
              course={course}
              index={index}
              onClick={() => handleCourseClick(course)}
              onCertificateClick={
                course.progress === 100 && course.has_certificate
                  ? () => handleCourseClick(course, 'certificate')
                  : undefined
              }
              styles={userDashboardStyles}
              viewMode="grid"
              learningPathTitle={pathInfo?.pathTitle}
              learningPathPosition={pathInfo?.position}
              isLockedInPath={pathInfo ? !pathInfo.isUnlocked : false}
              disableHeavyEffects={disableHeavyEffects}
            />
          )
        })}
      </Suspense>
    </div>
  )
}
