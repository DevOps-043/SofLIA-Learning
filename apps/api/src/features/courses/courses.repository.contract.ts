import type {
  CourseListItem,
  LessonProgress,
  NormalizedCourseListQuery,
  UpdateProgressInput,
} from './courses.types'

export interface CoursesRepository {
  findCourses(
    query: NormalizedCourseListQuery,
  ): Promise<{ courses: CourseListItem[]; total: number }>
  findCourseBySlug(slug: string): Promise<CourseListItem>
  findLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<LessonProgress | null>
  upsertLessonProgress(
    userId: string,
    courseId: string,
    lessonId: string,
    data: UpdateProgressInput,
  ): Promise<LessonProgress>
  findUserEnrollments(
    userId: string,
  ): Promise<{ course_id: string; enrolled_at: string }[]>
}
