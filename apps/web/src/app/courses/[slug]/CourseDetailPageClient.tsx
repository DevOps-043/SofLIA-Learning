'use client'

import {
  CourseDetailErrorState,
  CourseDetailLoadingState,
  CourseDetailPageContent,
} from '../../../features/courses/components/course-detail'
import { useCourseDetailPageLogic } from '../../../features/courses/hooks/useCourseDetailPageLogic'

export function CourseDetailPageClient() {
  const logic = useCourseDetailPageLogic()

  if (logic.loading) {
    return <CourseDetailLoadingState />
  }

  if (!logic.detail || logic.error) {
    return <CourseDetailErrorState error={logic.error || 'No se pudo cargar el curso'} goBack={logic.goBack} />
  }

  return <CourseDetailPageContent logic={logic} />
}
