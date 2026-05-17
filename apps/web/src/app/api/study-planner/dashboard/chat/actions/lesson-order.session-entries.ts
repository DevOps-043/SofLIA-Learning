import { parseSessionMetrics } from '../calendar.service'
import type {
  PendingLessonRef,
  SessionOrderEntry,
  StudySessionRow,
} from './lesson-order.types'
import { comparePendingLessonRefs } from './lesson-order.validation'

export function buildEntriesForExistingSessions(params: {
  sessions: StudySessionRow[]
  lessonMetadata: Map<string, PendingLessonRef>
  completedLessonIds: Set<string>
  moveOverrides: Map<string, string>
}): SessionOrderEntry[] {
  const entries: SessionOrderEntry[] = []

  for (const session of params.sessions) {
    const pendingLesson = resolvePendingLessonForSession(
      session,
      params.lessonMetadata,
      params.completedLessonIds,
    )
    if (!pendingLesson) continue

    entries.push({
      sessionId: session.id,
      title: session.title,
      courseId: pendingLesson.courseId,
      startTime: params.moveOverrides.get(session.id) || session.start_time,
      sequence: {
        moduleOrderIndex: pendingLesson.moduleOrderIndex,
        lessonOrderIndex: pendingLesson.lessonOrderIndex,
      },
    })
  }

  return entries
}

function resolvePendingLessonForSession(
  session: StudySessionRow,
  lessonMetadata: Map<string, PendingLessonRef>,
  completedLessonIds: Set<string>,
): PendingLessonRef | null {
  const plannedLessons = getPlannedLessonRefs(session, lessonMetadata)
  const pendingFromMetrics = plannedLessons
    .filter((lesson) => !completedLessonIds.has(lesson.lessonId))
    .sort(comparePendingLessonRefs)

  if (pendingFromMetrics.length > 0) return pendingFromMetrics[0]
  if (!session.lesson_id || completedLessonIds.has(session.lesson_id)) return null

  return lessonMetadata.get(session.lesson_id) || null
}

function getPlannedLessonRefs(
  session: StudySessionRow,
  lessonMetadata: Map<string, PendingLessonRef>,
) {
  const metrics = parseSessionMetrics(session.metrics)

  return (metrics?.plannedLessons || [])
    .map((lesson) => {
      if (!lesson.lessonId) return null

      const metadata = lessonMetadata.get(lesson.lessonId)
      const moduleOrderIndex = lesson.moduleOrderIndex ?? metadata?.moduleOrderIndex
      const lessonOrderIndex = lesson.lessonOrderIndex ?? metadata?.lessonOrderIndex
      const courseId = lesson.courseId || metadata?.courseId || session.course_id || undefined

      if (!courseId || moduleOrderIndex === undefined || lessonOrderIndex === undefined) {
        return null
      }

      return {
        courseId,
        lessonId: lesson.lessonId,
        lessonTitle: lesson.lessonTitle,
        moduleOrderIndex,
        lessonOrderIndex,
      } satisfies PendingLessonRef
    })
    .filter((lesson): lesson is PendingLessonRef => Boolean(lesson))
}
