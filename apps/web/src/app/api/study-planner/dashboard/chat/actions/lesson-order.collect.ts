import { parseSessionMetrics } from '../calendar.service'
import type { StudySessionRow } from './lesson-order.types'

export function collectLessonIds(
  sessions: StudySessionRow[],
  proposedCreateLessonIds: string[],
): string[] {
  return Array.from(
    new Set([
      ...proposedCreateLessonIds,
      ...sessions.flatMap((session) => {
        const metrics = parseSessionMetrics(session.metrics)
        const plannedLessonIds = (metrics?.plannedLessons || [])
          .map((lesson) => lesson.lessonId)
          .filter((lessonId): lessonId is string => Boolean(lessonId))

        return [
          ...(session.lesson_id ? [session.lesson_id] : []),
          ...plannedLessonIds,
        ]
      }),
    ]),
  )
}
