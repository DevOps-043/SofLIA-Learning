/**
 * Sesión de "Conversación guiada con SofLIA" (`activity_type = 'ai_chat'`). Vive en
 * `soflia_dialogue_sessions`. Se usa en analytics SOLO para detectar conversaciones
 * EN PROGRESO (sesión sin `soflia_dialogue_results` y en estado no terminal), que
 * cuentan como "en progreso" pero NO como una entrega.
 *
 * Columnas alineadas con `SELECT_COLUMNS.soflia_dialogue_sessions`.
 */
export interface DialogueSessionRecord {
  session_id: string
  activity_id: string
  course_id: string | null
  lesson_id: string | null
  enrollment_id: string
  organization_id: string | null
  user_id: string
  state: string | null
  current_score: number | null
  turns_count: number | null
  completed_at: string | null
  started_at: string | null
  updated_at: string | null
}
