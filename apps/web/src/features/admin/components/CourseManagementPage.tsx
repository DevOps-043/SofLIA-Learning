'use client'

import {
  CourseManagementDialogs,
  CourseManagementFeedbackToast,
  CourseManagementHeader,
  CourseManagementProvider,
  CourseManagementTabContent,
  CourseManagementTabs,
} from './CourseManagement'
import { useCourseManagementLogic } from './CourseManagement/hooks/useCourseManagementLogic'
import type { CourseManagementPageProps } from './CourseManagement/types'

export function CourseManagementPage({ courseId }: CourseManagementPageProps) {
  const state = useCourseManagementLogic(courseId)

  return (
    <CourseManagementProvider courseId={courseId} state={state}>
      <div className="min-h-screen bg-gradient-to-br from-[#E9ECEF] via-white to-[#E9ECEF]/50 dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]">
        <CourseManagementFeedbackToast />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <CourseManagementHeader />
          <CourseManagementTabs />
          <CourseManagementTabContent />
          <CourseManagementDialogs />
        </div>
      </div>
    </CourseManagementProvider>
  )
}
