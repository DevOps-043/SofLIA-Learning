/**
 * Intento individual de quiz (`user_quiz_attempts`, append-only). A diferencia de
 * `user_quiz_submissions` (1 fila "mejor/actual" por quiz), aquí hay una fila por cada
 * envío, lo que permite medir intentos totales, reintentos y aprobación al primer intento.
 */
export interface QuizAttemptRecord {
  attempt_id: string
  lesson_id: string
  enrollment_id: string | null
  percentage_score: number | null
  is_passed: boolean | null
  attempt_number: number | null
  created_at: string | null
}
