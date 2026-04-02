import type {
  CourseLessonCountRow,
  UserCourseProgressSummaryRow,
} from './types'

export interface CourseProgressSnapshot {
  progressPercentage: number
  completedLessons: number
  totalLessons: number
  lastAccessedAt?: string
}

export function createDefaultCourseProgress(): CourseProgressSnapshot {
  return {
    progressPercentage: 0,
    completedLessons: 0,
    totalLessons: 0,
    lastAccessedAt: undefined,
  }
}

export function buildCourseProgressMap(params: {
  courseIds: string[]
  lessonCountRows: CourseLessonCountRow[]
  progressRows: UserCourseProgressSummaryRow[]
}): Map<string, CourseProgressSnapshot> {
  const uniqueCourseIds = Array.from(
    new Set(params.courseIds.filter((courseId) => Boolean(courseId))),
  )
  const progressByCourseId = new Map(
    params.progressRows.map((progress) => [progress.course_id, progress] as const),
  )
  const lessonCountByCourseId = new Map<string, number>()

  for (const row of params.lessonCountRows) {
    const currentCount = lessonCountByCourseId.get(row.course_id) ?? 0
    const publishedLessons = (row.course_lessons ?? []).filter(
      (lesson) => lesson.is_published !== false,
    )

    lessonCountByCourseId.set(row.course_id, currentCount + publishedLessons.length)
  }

  return new Map(
    uniqueCourseIds.map((courseId) => {
      const progress = progressByCourseId.get(courseId)

      return [
        courseId,
        {
          progressPercentage: progress?.progress_percentage ?? 0,
          completedLessons: progress?.completed_lessons_count ?? 0,
          totalLessons: lessonCountByCourseId.get(courseId) ?? 0,
          lastAccessedAt: progress?.last_accessed_at ?? undefined,
        },
      ] as const
    }),
  )
}
