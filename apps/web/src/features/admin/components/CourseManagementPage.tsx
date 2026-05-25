'use client'

import {
  CourseManagementDialogs,
  CourseManagementFeedbackToast,
  CourseManagementHeader,
  CourseManagementProvider,
  CourseManagementTabContent,
  CourseManagementTabs,
} from './CourseManagement'
import { PageShell } from '@/core/layout'
import { useCourseManagementLogic } from './CourseManagement/hooks/useCourseManagementLogic'
import type { CourseManagementPageProps } from './CourseManagement/types'

export function CourseManagementPage({ courseId }: CourseManagementPageProps) {
  const state = useCourseManagementLogic(courseId)

  return (
    <CourseManagementProvider courseId={courseId} state={state}>
      <div className="min-h-screen bg-gradient-to-br from-gray-200 via-white to-gray-200/50 dark:from-carbon-900 dark:via-carbon-950 dark:to-carbon-900">
        <CourseManagementFeedbackToast />

        <PageShell spacing="relaxed">
          <CourseManagementHeader />
          <CourseManagementTabs />
          <CourseManagementTabContent />
          <CourseManagementDialogs />
        </PageShell>
      </div>
    </CourseManagementProvider>
  )
}
