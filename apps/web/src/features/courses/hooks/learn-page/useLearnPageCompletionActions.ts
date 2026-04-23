import { useCallback } from 'react'

import { CourseCertificateService } from '../../services/course-certificate.service'
import { useCourseCompletionFlow } from '../useCourseCompletionFlow'
import type { LearnCourseData, LearnLesson } from '../../components/learn/types'
import type { useLearnPageBase } from './useLearnPageBase'

interface UseLearnPageCompletionActionsParams {
  base: ReturnType<typeof useLearnPageBase>
  canCompleteLesson: (lessonId: string) => boolean
  course: LearnCourseData | null
  currentLesson: LearnLesson | null
  markLessonAsCompleted: (lessonId: string) => Promise<boolean>
}

export function useLearnPageCompletionActions({
  base,
  canCompleteLesson,
  course,
  currentLesson,
  markLessonAsCompleted,
}: UseLearnPageCompletionActionsParams) {
  const courseId = course?.id ?? course?.course_id ?? null
  const enrollmentId = course?.enrollment_id ?? null
  const organizationId = course?.organization_id ?? base.organizationId ?? null
  const handleCertificateReady = useCallback(
    (route: string) => {
      CourseCertificateService.navigateToCertificateRoute(route, base.router)
    },
    [base.router],
  )
  const completionFlow = useCourseCompletionFlow({
    courseId,
    enrollmentId,
    organizationId,
    courseSlug: base.slug,
    onCertificateReady: handleCertificateReady,
  })
  const completeCurrentCourse = useCallback(async () => {
    if (!currentLesson?.lesson_id) {
      return
    }

    if (!canCompleteLesson(currentLesson.lesson_id)) {
      completionFlow.openCannotCompleteModal()
      return
    }

    const success = await markLessonAsCompleted(currentLesson.lesson_id)

    if (success) {
      completionFlow.openCourseCompletedModal()
    }
  }, [
    canCompleteLesson,
    completionFlow,
    currentLesson?.lesson_id,
    markLessonAsCompleted,
  ])

  return {
    ...completionFlow,
    completeCurrentCourse,
  }
}
