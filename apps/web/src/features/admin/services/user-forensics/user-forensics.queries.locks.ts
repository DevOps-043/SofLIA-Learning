import { fromLoose } from '@/lib/supabase/looseQuery'
import { fetchAttemptUnlocksForUser } from '@/features/courses/services/attempt-unlocks/attempt-unlock.server.service'
import type { AttemptUnlockRecord } from '@/features/courses/services/attempt-unlocks/attempt-unlock.types'

import { DOMAIN_ROW_LIMIT } from './user-forensics.queries'
import type {
  DialogueSessionRecord,
  LiaActivityCompletionRecord,
  QuizAttemptRecord,
} from './user-forensics.locks'

/**
 * Filas crudas necesarias para reconstruir los topes de intentos del alumno.
 *
 * Se consultan aparte de la línea de tiempo porque el cálculo necesita campos que el
 * timeline no transporta (`enrollment_id`, estado de la sesión) y porque debe reflejar
 * la aritmética exacta de los motores de intentos, no una aproximación.
 */

type LooseClient = unknown

export interface AttemptLockSourceRows {
  quizAttempts: QuizAttemptRecord[]
  dialogueSessions: DialogueSessionRecord[]
  liaCompletions: LiaActivityCompletionRecord[]
  unlocks: AttemptUnlockRecord[]
  /** Email del super-admin que concedió cada desbloqueo, por id. */
  grantedByEmails: Map<string, string>
}

interface QuizAttemptRow {
  attempt_id: string
  lesson_id: string | null
  material_id: string | null
  activity_id: string | null
  enrollment_id: string | null
  is_passed: boolean | null
  created_at: string | null
}

interface DialogueSessionRow {
  session_id: string
  lesson_id: string | null
  activity_id: string | null
  enrollment_id: string | null
  state: string | null
  started_at: string | null
}

interface LiaCompletionRow {
  completion_id: string
  activity_id: string | null
  enrollment_id: string | null
  status: string | null
  started_at: string | null
  created_at: string | null
}

async function fetchGrantedByEmails(
  supabase: LooseClient,
  unlocks: AttemptUnlockRecord[],
): Promise<Map<string, string>> {
  const adminIds = [...new Set(unlocks.map((unlock) => unlock.grantedBy).filter(Boolean))]
  if (adminIds.length === 0) return new Map()

  const { data } = await fromLoose<{ id: string; email: string | null }>(supabase, 'users')
    .select('id, email')
    .in('id', adminIds)

  const emails = new Map<string, string>()
  for (const row of data ?? []) {
    if (row.email) emails.set(row.id, row.email)
  }
  return emails
}

export async function fetchAttemptLockSourceRows(
  supabase: LooseClient,
  userId: string,
): Promise<AttemptLockSourceRows> {
  const [quizRes, dialogueRes, liaRes, unlocks] = await Promise.all([
    fromLoose<QuizAttemptRow>(supabase, 'user_quiz_attempts')
      .select('attempt_id, lesson_id, material_id, activity_id, enrollment_id, is_passed, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(DOMAIN_ROW_LIMIT),
    fromLoose<DialogueSessionRow>(supabase, 'soflia_dialogue_sessions')
      .select('session_id, lesson_id, activity_id, enrollment_id, state, started_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(DOMAIN_ROW_LIMIT),
    fromLoose<LiaCompletionRow>(supabase, 'lia_activity_completions')
      .select('completion_id, activity_id, enrollment_id, status, started_at, created_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(DOMAIN_ROW_LIMIT),
    fetchAttemptUnlocksForUser(supabase, userId),
  ])

  return {
    quizAttempts: (quizRes.data ?? []).map((row) => ({
      attemptId: row.attempt_id,
      lessonId: row.lesson_id,
      materialId: row.material_id,
      activityId: row.activity_id,
      enrollmentId: row.enrollment_id,
      createdAtUtc: row.created_at,
      isPassed: Boolean(row.is_passed),
    })),
    dialogueSessions: (dialogueRes.data ?? []).map((row) => ({
      sessionId: row.session_id,
      lessonId: row.lesson_id,
      activityId: row.activity_id,
      enrollmentId: row.enrollment_id,
      state: row.state,
      startedAtUtc: row.started_at,
    })),
    liaCompletions: (liaRes.data ?? []).map((row) => ({
      completionId: row.completion_id,
      activityId: row.activity_id,
      enrollmentId: row.enrollment_id,
      status: row.status,
      startedAtUtc: row.started_at ?? row.created_at,
    })),
    unlocks,
    grantedByEmails: await fetchGrantedByEmails(supabase, unlocks),
  }
}
