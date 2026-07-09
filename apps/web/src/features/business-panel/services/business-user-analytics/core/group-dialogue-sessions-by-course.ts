import { DialogueSessionRecord } from './dialogue-session-record'

export function groupDialogueSessionsByCourse(
  dialogueSessions: DialogueSessionRecord[],
): Map<string, DialogueSessionRecord[]> {
  const map = new Map<string, DialogueSessionRecord[]>()

  dialogueSessions.forEach((session) => {
    if (!session.course_id) return
    map.set(session.course_id, [...(map.get(session.course_id) || []), session])
  })

  return map
}
