'use client'

import { Suspense } from 'react'

import { LearningPathHoverLayer } from '../../components/LearningPathView/LearningPathHoverLayer'
import { buildStandaloneCoursePreviewContent } from '../../components/LearningPathView/preview-content'
import { useLearningPathPreview } from '../../components/LearningPathView/useLearningPathPreview'
import { CourseCard3D } from './dynamic-components'
import type { BusinessUserDashboardShellProps } from './types'
import styles from '../BusinessUserDashboard.module.css'

interface CourseGridViewProps {
  assignedCourses: BusinessUserDashboardShellProps['assignedCourses']
  coursePathMap: Map<string, { isUnlocked: boolean; pathTitle: string; position: number }>
  disableHeavyEffects: boolean
  displayedCourses: BusinessUserDashboardShellProps['assignedCourses']
  handleCourseClick: BusinessUserDashboardShellProps['handleCourseClick']
  orgColors: BusinessUserDashboardShellProps['orgColors']
  orgSlug?: string
  t: BusinessUserDashboardShellProps['t']
  userDashboardStyles: BusinessUserDashboardShellProps['userDashboardStyles']
}

export function CourseGridView({
  assignedCourses,
  coursePathMap,
  disableHeavyEffects,
  displayedCourses,
  handleCourseClick,
  orgColors,
  orgSlug,
  t,
  userDashboardStyles,
}: CourseGridViewProps) {
  const preview = useLearningPathPreview(orgSlug ?? '', t)

  return (
    <>
      <div className={styles.courseGrid}>
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
                onPreview={(anchor) =>
                  preview.showPreview(
                    anchor,
                    buildStandaloneCoursePreviewContent(course, t),
                  )
                }
                onPreviewEnd={preview.scheduleHidePreview}
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
      <LearningPathHoverLayer
        card={preview.hoverCard}
        orgColors={orgColors}
        onMouseEnter={preview.clearHoverHideTimeout}
        onMouseLeave={preview.scheduleHidePreview}
        onClose={preview.closePreview}
        t={t}
      />
    </>
  )
}
