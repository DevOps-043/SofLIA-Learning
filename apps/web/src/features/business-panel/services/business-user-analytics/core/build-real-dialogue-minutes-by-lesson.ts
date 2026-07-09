import { DialogueSessionRecord } from './dialogue-session-record'

/**
 * Real per-user active time for SofLIA Dialogue activities, keyed by lesson.
 * `active_seconds` is the gap-capped sum of inter-turn gaps computed in
 * computeDialogueActiveSeconds (see soflia-dialogue/dialogue-session/compute-active-seconds.ts) —
 * it reflects how long THIS user actually spent, unlike the static
 * `estimated_time_minutes` configured by an admin for all users alike.
 */
export function buildRealDialogueMinutesByLesson(
  dialogueSessions: DialogueSessionRecord[],
): Map<string, number> {
  const map = new Map<string, number>()

  dialogueSessions.forEach((session) => {
    if (!session.lesson_id || !session.active_seconds) return
    const minutes = session.active_seconds / 60
    map.set(session.lesson_id, (map.get(session.lesson_id) || 0) + minutes)
  })

  map.forEach((minutes, lessonId) => {
    map.set(lessonId, Math.round(minutes * 10) / 10)
  })

  return map
}
