/**
 * Resultado finalizado de una actividad de "Conversación guiada con SofLIA"
 * (`activity_type = 'ai_chat'`). Es la fuente AUTORITATIVA del puntaje, criterios
 * y feedback de estas actividades: vive en `soflia_dialogue_results` y es escrita
 * por el runtime de diálogo (no en `user_activity_submissions`, donde solo se
 * sincroniza una fila-proxy por actividad+enrollment).
 *
 * Columnas alineadas con `SELECT_COLUMNS.soflia_dialogue_results`.
 */
export interface DialogueResultRecord {
  result_id: string
  session_id: string
  activity_id: string
  user_id: string
  enrollment_id: string
  /** 'completed' = aprobada; 'needs_retry' = entregada pero requiere otro intento. */
  activity_result: string
  /** Puntaje real 0–100 de la conversación. */
  score: number | null
  criteria_met: string[] | null
  criteria_missing: string[] | null
  student_feedback: string | null
  created_at: string | null
}
