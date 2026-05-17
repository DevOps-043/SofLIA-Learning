import {
  findCourseBySlug,
  findCourses,
} from './courses.repository.reads'
import { findUserEnrollments } from './courses.repository.enrollments'
import {
  findLessonProgress,
  upsertLessonProgress,
} from './courses.repository.progress'
import type { CoursesRepository } from './courses.repository.contract'
import type { NormalizedCourseListQuery, UpdateProgressInput } from './courses.types'

export type { CoursesRepository } from './courses.repository.contract'

export class SupabaseCoursesRepository implements CoursesRepository {
  findCourses(query: NormalizedCourseListQuery) {
    return findCourses(query)
  }

  findCourseBySlug(slug: string) {
    return findCourseBySlug(slug)
  }

  findLessonProgress(userId: string, courseId: string, lessonId: string) {
    return findLessonProgress(userId, courseId, lessonId)
  }

  upsertLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    data: UpdateProgressInput,
  ) {
    return upsertLessonProgress(userId, courseId, lessonId, data)
  }

  findUserEnrollments(userId: string) {
    return findUserEnrollments(userId)
  }
}
