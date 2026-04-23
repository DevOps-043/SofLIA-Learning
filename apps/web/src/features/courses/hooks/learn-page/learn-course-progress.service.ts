import type { LearnLesson, LearnModule } from '../../components/learn/types'

export function calculateCourseProgress(modules: LearnModule[]): number {
  const allLessons = modules.flatMap((module) => module.lessons)
  const completedLessons = allLessons.filter((lesson) => lesson.is_completed)

  if (allLessons.length === 0) {
    return 0
  }

  return Math.round((completedLessons.length / allLessons.length) * 100)
}

export function resolveCurrentLesson(
  modules: LearnModule[],
  lastWatchedLessonId?: string | null,
): LearnLesson | null {
  const allLessons = modules.flatMap((module) => module.lessons)

  if (allLessons.length === 0) {
    return null
  }

  if (lastWatchedLessonId) {
    const lastWatchedLesson = allLessons.find(
      (lesson) => lesson.lesson_id === lastWatchedLessonId,
    )

    if (lastWatchedLesson) {
      return lastWatchedLesson
    }
  }

  return allLessons.find((lesson) => !lesson.is_completed) || allLessons[0]
}
