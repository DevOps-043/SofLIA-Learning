import { DialogueResultRecord } from './dialogue-result-record'
import { DialogueSessionRecord } from './dialogue-session-record'

/**
 * Métricas de actividades de "Conversación guiada con SofLIA" (`ai_chat`) derivadas
 * de su fuente AUTORITATIVA (`soflia_dialogue_results` + `soflia_dialogue_sessions`).
 * Funciones puras y testeables, separadas de `build-activities` para mantenerlo legible.
 *
 * Reglas de negocio (definición de "Entrega" = actividad con interacción real):
 * - Una actividad cuenta como UNA entrega si tiene un RESULTADO finalizado o una
 *   SESIÓN con interacción real (≥1 turno o `current_score` > 0). Las conversaciones
 *   solo abiertas (0 turnos, score 0, sin resultado) NO cuentan (ruido).
 * - Se deduplica por `(activity_id, enrollment_id)`: varios intentos = una entrega,
 *   prefiriendo el mejor resultado/score.
 * - "Aprobación" = `activity_result === 'completed'`.
 * - "Calidad" = `score` real (0–100): del resultado si existe, si no del mejor
 *   `current_score` de la sesión en progreso.
 * - "Feedback SofLIA" = entregas con `student_feedback` no vacío.
 */

export function dialogueActivityKey(activityId: string, enrollmentId: string): string {
  return `${activityId}|${enrollmentId}`
}

function clampScore(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function isCompleted(result: DialogueResultRecord): boolean {
  return result.activity_result === 'completed'
}

/** Una sesión cuenta como interacción real si el usuario conversó o avanzó. */
function isEngagedSession(session: DialogueSessionRecord): boolean {
  return (session.turns_count ?? 0) >= 1 || (session.current_score ?? 0) > 0
}

/** Prefiere el mejor de dos resultados de la misma actividad: completado > score > reciente. */
function preferResult(
  current: DialogueResultRecord,
  candidate: DialogueResultRecord,
): DialogueResultRecord {
  const currentCompleted = isCompleted(current)
  const candidateCompleted = isCompleted(candidate)
  if (candidateCompleted !== currentCompleted) return candidateCompleted ? candidate : current

  const currentScore = clampScore(current.score)
  const candidateScore = clampScore(candidate.score)
  if (candidateScore !== currentScore) return candidateScore > currentScore ? candidate : current

  return (candidate.created_at ?? '') > (current.created_at ?? '') ? candidate : current
}

export function dedupeDialogueResultsByActivity(
  results: DialogueResultRecord[],
): DialogueResultRecord[] {
  const best = new Map<string, DialogueResultRecord>()
  for (const result of results) {
    const key = dialogueActivityKey(result.activity_id, result.enrollment_id)
    const existing = best.get(key)
    best.set(key, existing ? preferResult(existing, result) : result)
  }
  return Array.from(best.values())
}

export interface DialogueActivityMetrics {
  /** Claves `(activity|enrollment)` de actividades entregadas (para deduplicar submissions). */
  keys: Set<string>
  /** Nº de actividades de diálogo entregadas (resultado o sesión con interacción real). */
  entregas: number
  /** Nº con `activity_result === 'completed'`. */
  passes: number
  /** Nº con resultado finalizado NO completado (needs_retry). */
  needsRevision: number
  /** Nº entregadas sin resultado finalizado (en progreso con interacción real). */
  inProgress: number
  /** Score real 0–100 por entrega (resultado o mejor score de sesión). */
  qualityScores: number[]
  /** Nº con `student_feedback` no vacío. */
  withFeedback: number
  /** Fechas por entrega, para la tendencia. */
  trendDates: string[]
}

export function buildDialogueActivityMetrics(
  results: DialogueResultRecord[],
  sessions: DialogueSessionRecord[],
): DialogueActivityMetrics {
  const bestResultByKey = new Map<string, DialogueResultRecord>()
  for (const result of dedupeDialogueResultsByActivity(results)) {
    bestResultByKey.set(dialogueActivityKey(result.activity_id, result.enrollment_id), result)
  }

  // Mejor `current_score` por actividad entre sesiones CON interacción real.
  const engagedSessionScoreByKey = new Map<string, number>()
  const engagedSessionDateByKey = new Map<string, string | null>()
  for (const session of sessions) {
    if (!isEngagedSession(session)) continue
    const key = dialogueActivityKey(session.activity_id, session.enrollment_id)
    const score = clampScore(session.current_score)
    if (score > (engagedSessionScoreByKey.get(key) ?? -1)) {
      engagedSessionScoreByKey.set(key, score)
    }
    if (!engagedSessionDateByKey.has(key)) {
      engagedSessionDateByKey.set(key, session.started_at ?? session.updated_at)
    }
  }

  const attemptedKeys = new Set<string>([
    ...bestResultByKey.keys(),
    ...engagedSessionScoreByKey.keys(),
  ])

  let passes = 0
  let needsRevision = 0
  let inProgress = 0
  let withFeedback = 0
  const qualityScores: number[] = []
  const trendDates: string[] = []

  for (const key of attemptedKeys) {
    const result = bestResultByKey.get(key)
    if (result) {
      if (isCompleted(result)) passes += 1
      else needsRevision += 1
      qualityScores.push(clampScore(result.score))
      if (result.student_feedback?.trim()) withFeedback += 1
      if (result.created_at) trendDates.push(result.created_at)
    } else {
      inProgress += 1
      qualityScores.push(engagedSessionScoreByKey.get(key) ?? 0)
      const date = engagedSessionDateByKey.get(key)
      if (date) trendDates.push(date)
    }
  }

  return {
    keys: attemptedKeys,
    entregas: attemptedKeys.size,
    passes,
    needsRevision,
    inProgress,
    qualityScores,
    withFeedback,
    trendDates,
  }
}
