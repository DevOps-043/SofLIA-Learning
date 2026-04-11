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
      <div className="min-h-screen bg-gradient-to-br from-[#E9ECEF] via-white to-[#E9ECEF]/50 dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]">
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
