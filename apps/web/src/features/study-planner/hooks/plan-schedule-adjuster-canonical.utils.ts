import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types'
import type { CanonicalSessionUpdate } from './plan-schedule-adjuster.types'

export function applyCanonicalSessionUpdates(
  distribution: StudyPlannerStoredLessonDistribution[],
  updatedSessions: CanonicalSessionUpdate[],
): StudyPlannerStoredLessonDistribution[] {
  if (updatedSessions.length === 0) {
    return distribution
  }

  const byClientReferenceId = new Map(
    updatedSessions
      .filter((session) => session.clientReferenceId)
      .map((session) => [session.clientReferenceId as string, session]),
  )
  const bySessionId = new Map(updatedSessions.map((session) => [session.id, session]))

  return distribution.map((slot) => {
    const canonicalSession =
      byClientReferenceId.get(slot.clientReferenceId)
      || (slot.sessionId ? bySessionId.get(slot.sessionId) : undefined)

    if (!canonicalSession) {
      return slot
    }

    return applyCanonicalSessionUpdate(slot, canonicalSession)
  })
}

function applyCanonicalSessionUpdate(
  slot: StudyPlannerStoredLessonDistribution,
  canonicalSession: CanonicalSessionUpdate,
): StudyPlannerStoredLessonDistribution {
  const canonicalStart = new Date(canonicalSession.startTime)
  const canonicalEnd = new Date(canonicalSession.endTime)

  return {
    ...slot,
    sessionId: canonicalSession.id,
    dateStr: formatDateKey(canonicalStart),
    dayName: canonicalStart.toLocaleDateString('es-ES', { weekday: 'long' }),
    startTime: formatTimeKey(canonicalStart),
    endTime: formatTimeKey(canonicalEnd),
  }
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function formatTimeKey(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
    2,
    '0',
  )}`
}
