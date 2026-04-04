import {
  SupabaseCoursesRepository,
  type CoursesRepository,
} from './courses.repository'
import type {
  CourseListQuery,
  CourseListResult,
  CourseListItem,
  LessonProgress,
  UpdateProgressInput,
} from './courses.types'
import { calculateTotalPages, normalizeCourseListQuery } from './courses.utils'

export class CoursesService {
  constructor(
    private readonly repository: CoursesRepository = new SupabaseCoursesRepository(),
  ) {}

  async getCourses(query: CourseListQuery): Promise<CourseListResult> {
    const normalized = normalizeCourseListQuery(query)
    const { courses, total } = await this.repository.findCourses(normalized)

    return {
      courses,
      total,
      page: normalized.page,
      limit: normalized.limit,
      total_pages: calculateTotalPages(total, normalized.limit),
    }
  }

  async getCourseBySlug(slug: string): Promise<CourseListItem> {
    return this.repository.findCourseBySlug(slug)
  }

  async getLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<LessonProgress | null> {
    return this.repository.findLessonProgress(userId, courseId, lessonId)
  }

  async updateLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    data: UpdateProgressInput,
  ): Promise<LessonProgress> {
    return this.repository.upsertLessonProgress(userId, courseId, lessonId, data)
  }

  async getUserEnrollments(userId: string): Promise<{ course_id: string; enrolled_at: string }[]> {
    return this.repository.findUserEnrollments(userId)
  }
}
