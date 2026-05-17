import type { CourseWithLessons } from '../../types/business-user-stats.types'
import type { BusinessUserStatsQueryData } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'
import { buildCourseLessons } from './lesson-detail-course'
import { buildLessonDetailIndexes } from './lesson-detail-indexes'

export function buildLessonDetailByCourse(data: BusinessUserStatsQueryData): CourseWithLessons[] {
  const indexes = buildLessonDetailIndexes(data)
  const result: CourseWithLessons[] = []

  data.enrollments.forEach((enrollment) => {
    const courseId = enrollment.course_id
    const courseTitle = unwrapRelation(enrollment.courses)?.title ?? null
    const courseLessons = indexes.lessonsByCourse.get(courseId) ?? []
    result.push({
      course_id: courseId,
      course_title: courseTitle,
      lessons: buildCourseLessons(courseLessons, indexes),
    })
  })

  return result
}
