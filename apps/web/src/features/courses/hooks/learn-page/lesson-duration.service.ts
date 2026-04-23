import type { LearnLesson } from '../../components/learn/types'

export function resolveVerifiedLessonDurationMinutes(
  lesson?: LearnLesson | null,
): number | undefined {
  if (!lesson) {
    return undefined
  }

  if (
    typeof lesson.total_duration_minutes === 'number' &&
    lesson.total_duration_minutes > 0
  ) {
    return lesson.total_duration_minutes
  }

  if (
    typeof lesson.duration_seconds === 'number' &&
    lesson.duration_seconds > 0
  ) {
    return Math.ceil(lesson.duration_seconds / 60)
  }

  return undefined
}
