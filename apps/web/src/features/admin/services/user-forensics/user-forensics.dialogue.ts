import { fromLoose } from '@/lib/supabase/looseQuery'
import { createAdminClient } from '@/lib/supabase/admin'

import type {
  ForensicDialogueEvaluation,
  ForensicDialogueTranscript,
  ForensicDialogueTurn,
} from './user-forensics.types'

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

interface SessionRow {
  session_id: string
  user_id: string
  state: string | null
  current_score: number | null
  turns_count: number | null
  hints_used: number | null
  attempt_number: number | null
  active_seconds: number | null
  started_at: string | null
  completed_at: string | null
}

interface TurnRow {
  turn_id: string
  role: string | null
  content: string | null
  turn_number: number | null
  created_at: string | null
}

interface EvaluationRow {
  evaluation_id: string
  overall_score: number | null
  decision: string | null
  criteria_met: string[] | null
  criteria_missing: string[] | null
  feedback_for_tutor: string | null
  created_at: string | null
}

interface ResultRow {
  activity_result: string | null
  score: number | null
  student_feedback: string | null
}

function normalizeRole(role: string | null): ForensicDialogueTurn['role'] {
  return role === 'assistant' || role === 'system' ? role : 'user'
}

/**
 * Transcripción forense completa de una sesión de diálogo SofLIA: qué dijo el alumno
 * y qué respondió SofLIA (turnos), más las evaluaciones (score/decisión/feedback) y el
 * resultado final. Acotada por `userId` para no exponer sesiones de otros usuarios.
 */
export async function getDialogueTranscript(
  userId: string,
  sessionId: string,
  supabaseClient?: AdminSupabaseClient,
): Promise<ForensicDialogueTranscript | null> {
  const supabase = supabaseClient ?? createAdminClient()

  const { data: session } = await fromLoose<SessionRow>(supabase, 'soflia_dialogue_sessions')
    .select(
      'session_id, user_id, state, current_score, turns_count, hints_used, attempt_number, active_seconds, started_at, completed_at',
    )
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (!session) return null

  const [turnsRes, evaluationsRes, resultRes] = await Promise.all([
    fromLoose<TurnRow>(supabase, 'soflia_dialogue_turns')
      .select('turn_id, role, content, turn_number, created_at')
      .eq('session_id', sessionId)
      .order('turn_number', { ascending: true })
      .limit(1000),
    fromLoose<EvaluationRow>(supabase, 'soflia_dialogue_evaluations')
      .select(
        'evaluation_id, overall_score, decision, criteria_met, criteria_missing, feedback_for_tutor, created_at',
      )
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(1000),
    fromLoose<ResultRow>(supabase, 'soflia_dialogue_results')
      .select('activity_result, score, student_feedback')
      .eq('session_id', sessionId)
      .limit(1)
      .maybeSingle(),
  ])

  const turns: ForensicDialogueTurn[] = (turnsRes.data ?? []).map((row) => ({
    id: row.turn_id,
    role: normalizeRole(row.role),
    content: row.content ?? '',
    turnNumber: Number(row.turn_number ?? 0),
    createdAtUtc: row.created_at,
  }))

  const evaluations: ForensicDialogueEvaluation[] = (evaluationsRes.data ?? []).map((row) => ({
    id: row.evaluation_id,
    overallScore: row.overall_score === null ? null : Number(row.overall_score),
    decision: row.decision,
    criteriaMet: row.criteria_met ?? [],
    criteriaMissing: row.criteria_missing ?? [],
    feedbackForTutor: row.feedback_for_tutor,
    createdAtUtc: row.created_at,
  }))

  const result = resultRes.data
    ? {
        activityResult: resultRes.data.activity_result,
        score: resultRes.data.score === null ? null : Number(resultRes.data.score),
        studentFeedback: resultRes.data.student_feedback,
      }
    : null

  return {
    sessionId: session.session_id,
    state: session.state,
    currentScore: session.current_score === null ? null : Number(session.current_score),
    turnsCount: session.turns_count === null ? null : Number(session.turns_count),
    hintsUsed: session.hints_used === null ? null : Number(session.hints_used),
    attemptNumber: session.attempt_number === null ? null : Number(session.attempt_number),
    activeSeconds: session.active_seconds === null ? null : Number(session.active_seconds),
    startedAtUtc: session.started_at,
    completedAtUtc: session.completed_at,
    turns,
    evaluations,
    result,
  }
}
