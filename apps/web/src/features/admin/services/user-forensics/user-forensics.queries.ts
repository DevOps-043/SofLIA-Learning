import { fromLoose } from '@/lib/supabase/looseQuery'

import type {
  ForensicEvent,
  ForensicSession,
} from './user-forensics.types'

/**
 * Sub-consultas forenses por dominio. Cada una:
 *  - filtra por `user_id` (server-side, service-role),
 *  - selecciona columnas explícitas,
 *  - limita filas (`DOMAIN_ROW_LIMIT`) y reporta truncamiento,
 *  - normaliza a `ForensicEvent` con `atUtc` en ISO UTC.
 *
 * Usa `fromLoose` porque varias tablas (soflia_dialogue_*, user_quiz_attempts) no están
 * en los tipos generados de Supabase — mismo patrón que el resto del proyecto.
 */

export const DOMAIN_ROW_LIMIT = 500

export interface DomainResult {
  events: ForensicEvent[]
  truncated: boolean
}

const EMPTY: DomainResult = { events: [], truncated: false }

type LooseClient = unknown

function toIso(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : new Date(ms).toISOString()
}

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

// ---------------------------------------------------------------------------
// Logins / sesiones (refresh_tokens): fuente fiable de IP + dispositivo.
// ---------------------------------------------------------------------------

interface RefreshTokenRow {
  id: string
  ip_address: string | null
  user_agent: string | null
  device_fingerprint: string | null
  created_at: string | null
  last_used_at: string | null
  expires_at: string | null
  is_revoked: boolean | null
  revoked_at: string | null
  revoked_reason: string | null
}

interface UserSessionRow {
  id: string
  ip: string | null
  user_agent: string | null
  issued_at: string | null
  expires_at: string | null
  revoked: boolean | null
}

/**
 * Sesiones/accesos del usuario desde AMBAS fuentes de sesión del proyecto:
 * `refresh_tokens` (auth actual, con IP/dispositivo) y `user_session` (auth legacy,
 * con IP/user-agent). Combinarlas evita mostrar "0 accesos" para usuarios que
 * entraron por el flujo legacy y previene falsos positivos de "bot" en el dictamen.
 */
export async function fetchLoginSessions(
  supabase: LooseClient,
  userId: string,
): Promise<{ sessions: ForensicSession[]; truncated: boolean }> {
  const [refreshRes, legacyRes] = await Promise.all([
    fromLoose<RefreshTokenRow>(supabase, 'refresh_tokens')
      .select(
        'id, ip_address, user_agent, device_fingerprint, created_at, last_used_at, expires_at, is_revoked, revoked_at, revoked_reason',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(DOMAIN_ROW_LIMIT),
    fromLoose<UserSessionRow>(supabase, 'user_session')
      .select('id, ip, user_agent, issued_at, expires_at, revoked')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false })
      .limit(DOMAIN_ROW_LIMIT),
  ])

  const refreshRows = refreshRes.data ?? []
  const legacyRows = legacyRes.data ?? []

  const sessions: ForensicSession[] = [
    ...refreshRows.map((row) => ({
      id: `rt:${row.id}`,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      deviceFingerprint: row.device_fingerprint,
      createdAtUtc: toIso(row.created_at),
      lastUsedAtUtc: toIso(row.last_used_at),
      expiresAtUtc: toIso(row.expires_at),
      isRevoked: Boolean(row.is_revoked),
      revokedAtUtc: toIso(row.revoked_at),
      revokedReason: row.revoked_reason,
    })),
    ...legacyRows.map((row) => ({
      id: `us:${row.id}`,
      ipAddress: row.ip,
      userAgent: row.user_agent,
      deviceFingerprint: null,
      createdAtUtc: toIso(row.issued_at),
      lastUsedAtUtc: null,
      expiresAtUtc: toIso(row.expires_at),
      isRevoked: Boolean(row.revoked),
      revokedAtUtc: null,
      revokedReason: null,
    })),
  ].sort((a, b) => {
    const at = a.createdAtUtc ? Date.parse(a.createdAtUtc) : 0
    const bt = b.createdAtUtc ? Date.parse(b.createdAtUtc) : 0
    return bt - at
  })

  return {
    sessions,
    truncated: refreshRows.length >= DOMAIN_ROW_LIMIT || legacyRows.length >= DOMAIN_ROW_LIMIT,
  }
}

/** Cada creación de sesión es un evento de "inicio de sesión" en el timeline. */
export function loginSessionsToEvents(sessions: ForensicSession[]): ForensicEvent[] {
  return sessions
    .filter((session) => session.createdAtUtc)
    .map((session) => ({
      id: `login:${session.id}`,
      type: 'login' as const,
      atUtc: session.createdAtUtc as string,
      title: 'Inicio de sesión',
      detail: [session.ipAddress ?? 'IP desconocida', session.userAgent ?? '']
        .filter(Boolean)
        .join(' · '),
      refIds: { sessionTokenId: session.id },
      meta: {
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        deviceFingerprint: session.deviceFingerprint,
        isRevoked: session.isRevoked,
      },
    }))
}

// ---------------------------------------------------------------------------
// Inscripciones a cursos (user_course_enrollments)
// ---------------------------------------------------------------------------

interface EnrollmentRow {
  enrollment_id: string
  course_id: string | null
  enrollment_status: string | null
  overall_progress_percentage: number | null
  enrolled_at: string | null
  started_at: string | null
  completed_at: string | null
}

export async function fetchEnrollmentEvents(
  supabase: LooseClient,
  userId: string,
): Promise<DomainResult> {
  const { data, error } = await fromLoose<EnrollmentRow>(supabase, 'user_course_enrollments')
    .select(
      'enrollment_id, course_id, enrollment_status, overall_progress_percentage, enrolled_at, started_at, completed_at',
    )
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })
    .limit(DOMAIN_ROW_LIMIT)

  if (error || !data) return EMPTY

  const events: ForensicEvent[] = []
  for (const row of data) {
    const refIds = { courseId: row.course_id, enrollmentId: row.enrollment_id }
    const enrolledAt = toIso(row.enrolled_at)
    if (enrolledAt) {
      events.push({
        id: `enroll:${row.enrollment_id}`,
        type: 'course_enrolled',
        atUtc: enrolledAt,
        title: 'Inscripción a curso',
        detail: `Estado: ${row.enrollment_status ?? '—'} · Progreso: ${num(row.overall_progress_percentage) ?? 0}%`,
        refIds,
        meta: {
          status: row.enrollment_status,
          completed: Boolean(row.completed_at),
          progress: num(row.overall_progress_percentage) ?? 0,
        },
      })
    }
  }
  return { events, truncated: data.length >= DOMAIN_ROW_LIMIT }
}

// ---------------------------------------------------------------------------
// Asignación de rutas de aprendizaje (user_learning_path_assignments)
// ---------------------------------------------------------------------------

interface LpAssignmentRow {
  id: string
  learning_path_id: string | null
  status: string | null
  assigned_at: string | null
  assignment_source: string | null
}

export async function fetchLearningPathAssignmentEvents(
  supabase: LooseClient,
  userId: string,
): Promise<DomainResult> {
  const { data, error } = await fromLoose<LpAssignmentRow>(
    supabase,
    'user_learning_path_assignments',
  )
    .select('id, learning_path_id, status, assigned_at, assignment_source')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false })
    .limit(DOMAIN_ROW_LIMIT)

  if (error || !data) return EMPTY

  const events: ForensicEvent[] = []
  for (const row of data) {
    const at = toIso(row.assigned_at)
    if (!at) continue
    events.push({
      id: `lp-assign:${row.id}`,
      type: 'learning_path_assigned',
      atUtc: at,
      title: 'Ruta de aprendizaje asignada',
      detail: `Origen: ${row.assignment_source ?? 'manual'} · Estado: ${row.status ?? '—'}`,
      refIds: { learningPathId: row.learning_path_id },
    })
  }
  return { events, truncated: data.length >= DOMAIN_ROW_LIMIT }
}

// ---------------------------------------------------------------------------
// Progreso de lecciones (user_lesson_progress): inicio/fin
// ---------------------------------------------------------------------------

interface LessonProgressRow {
  progress_id: string
  lesson_id: string | null
  enrollment_id: string | null
  is_completed: boolean | null
  started_at: string | null
  completed_at: string | null
  video_progress_percentage: number | null
  quiz_passed: boolean | null
  quiz_progress_percentage: number | null
  activity_progress_percentage: number | null
  time_spent_minutes: number | null
}

export async function fetchLessonProgressEvents(
  supabase: LooseClient,
  userId: string,
): Promise<DomainResult> {
  const { data, error } = await fromLoose<LessonProgressRow>(supabase, 'user_lesson_progress')
    .select(
      'progress_id, lesson_id, enrollment_id, is_completed, started_at, completed_at, video_progress_percentage, quiz_passed, quiz_progress_percentage, activity_progress_percentage, time_spent_minutes',
    )
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(DOMAIN_ROW_LIMIT)

  if (error || !data) return EMPTY

  const events: ForensicEvent[] = []
  for (const row of data) {
    const refIds = { lessonId: row.lesson_id, enrollmentId: row.enrollment_id }
    const startedAt = toIso(row.started_at)
    if (startedAt) {
      events.push({
        id: `lesson-start:${row.progress_id}`,
        type: 'lesson_started',
        atUtc: startedAt,
        title: 'Lección iniciada',
        detail: null,
        refIds,
      })
    }
    const completedAt = toIso(row.completed_at)
    if (completedAt && row.is_completed) {
      events.push({
        id: `lesson-done:${row.progress_id}`,
        type: 'lesson_completed',
        atUtc: completedAt,
        title: 'Lección completada',
        detail: `Video ${num(row.video_progress_percentage) ?? 0}% · Quiz ${row.quiz_passed ? 'aprobado' : 'no aprobado'} (${num(row.quiz_progress_percentage) ?? 0}%) · Actividades ${num(row.activity_progress_percentage) ?? 0}% · ${num(row.time_spent_minutes) ?? 0} min`,
        refIds,
      })
    }
  }
  return { events, truncated: data.length >= DOMAIN_ROW_LIMIT }
}

// ---------------------------------------------------------------------------
// Quiz: intentos (user_quiz_attempts)
// ---------------------------------------------------------------------------

interface QuizAttemptRow {
  attempt_id: string
  lesson_id: string | null
  material_id: string | null
  activity_id: string | null
  percentage_score: number | null
  is_passed: boolean | null
  attempt_number: number | null
  duration_seconds: number | null
  created_at: string | null
}

export async function fetchQuizAttemptEvents(
  supabase: LooseClient,
  userId: string,
): Promise<DomainResult> {
  const { data, error } = await fromLoose<QuizAttemptRow>(supabase, 'user_quiz_attempts')
    .select(
      'attempt_id, lesson_id, material_id, activity_id, percentage_score, is_passed, attempt_number, duration_seconds, created_at',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(DOMAIN_ROW_LIMIT)

  if (error || !data) return EMPTY

  const events: ForensicEvent[] = data.flatMap((row): ForensicEvent[] => {
    const at = toIso(row.created_at)
    if (!at) return []
    const pct = num(row.percentage_score) ?? 0
    return [
      {
        id: `quiz:${row.attempt_id}`,
        type: 'quiz_attempt',
        atUtc: at,
        title: `Intento de quiz #${num(row.attempt_number) ?? 1}`,
        detail: `${pct}% · ${row.is_passed ? 'aprobado' : 'no aprobado'} · ${num(row.duration_seconds) ?? 0}s`,
        score: pct,
        refIds: {
          lessonId: row.lesson_id,
          materialId: row.material_id,
          activityId: row.activity_id,
        },
        meta: { isPassed: Boolean(row.is_passed), attemptNumber: num(row.attempt_number) },
      },
    ]
  })

  return { events, truncated: data.length >= DOMAIN_ROW_LIMIT }
}

// ---------------------------------------------------------------------------
// Diálogo SofLIA: sesiones + evaluaciones + resultados
// ---------------------------------------------------------------------------

interface DialogueSessionRow {
  session_id: string
  lesson_id: string | null
  activity_id: string | null
  state: string | null
  current_score: number | null
  turns_count: number | null
  hints_used: number | null
  attempt_number: number | null
  active_seconds: number | null
  started_at: string | null
  completed_at: string | null
}

interface DialogueEvaluationRow {
  evaluation_id: string
  session_id: string | null
  overall_score: number | null
  decision: string | null
  created_at: string | null
}

interface DialogueResultRow {
  result_id: string
  session_id: string | null
  activity_id: string | null
  activity_result: string | null
  score: number | null
  created_at: string | null
}

export async function fetchDialogueEvents(
  supabase: LooseClient,
  userId: string,
): Promise<DomainResult> {
  // Las sesiones y los resultados llevan `user_id`; las EVALUACIONES no (se enlazan por
  // `session_id`). Por eso primero obtenemos las sesiones del usuario y luego las
  // evaluaciones acotadas a esos `session_id`.
  const [sessionsRes, resultsRes] = await Promise.all([
    fromLoose<DialogueSessionRow>(supabase, 'soflia_dialogue_sessions')
      .select(
        'session_id, lesson_id, activity_id, state, current_score, turns_count, hints_used, attempt_number, active_seconds, started_at, completed_at',
      )
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(DOMAIN_ROW_LIMIT),
    fromLoose<DialogueResultRow>(supabase, 'soflia_dialogue_results')
      .select('result_id, session_id, activity_id, activity_result, score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(DOMAIN_ROW_LIMIT),
  ])

  const sessions = sessionsRes.data ?? []
  const sessionIds = sessions.map((row) => row.session_id).filter(Boolean)

  const evaluationsRes = sessionIds.length
    ? await fromLoose<DialogueEvaluationRow>(supabase, 'soflia_dialogue_evaluations')
        .select('evaluation_id, session_id, overall_score, decision, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false })
        .limit(DOMAIN_ROW_LIMIT)
    : { data: [] as DialogueEvaluationRow[], error: null }

  const events: ForensicEvent[] = []

  for (const row of sessions) {
    const at = toIso(row.started_at)
    if (!at) continue
    events.push({
      id: `dlg-start:${row.session_id}`,
      type: 'dialogue_started',
      atUtc: at,
      title: 'Diálogo SofLIA iniciado',
      detail: `Estado: ${row.state ?? 'START'} · Intento ${num(row.attempt_number) ?? 1} · Turnos: ${num(row.turns_count) ?? 0} · Pistas: ${num(row.hints_used) ?? 0} · ${num(row.active_seconds) ?? 0}s activos`,
      score: num(row.current_score),
      refIds: { sessionId: row.session_id, lessonId: row.lesson_id, activityId: row.activity_id },
      meta: { state: row.state, turnsCount: num(row.turns_count) },
    })
  }

  for (const row of evaluationsRes.data ?? []) {
    const at = toIso(row.created_at)
    if (!at) continue
    events.push({
      id: `dlg-eval:${row.evaluation_id}`,
      type: 'dialogue_evaluation',
      atUtc: at,
      title: 'Evaluación de diálogo',
      detail: `Score ${num(row.overall_score) ?? 0} · ${row.decision ?? '—'}`,
      score: num(row.overall_score),
      refIds: { sessionId: row.session_id },
    })
  }

  for (const row of resultsRes.data ?? []) {
    const at = toIso(row.created_at)
    if (!at) continue
    events.push({
      id: `dlg-result:${row.result_id}`,
      type: 'dialogue_result',
      atUtc: at,
      title: 'Resultado de diálogo',
      detail: `${row.activity_result ?? '—'} · Score ${num(row.score) ?? 0}`,
      score: num(row.score),
      refIds: { sessionId: row.session_id, activityId: row.activity_id },
      meta: { activityResult: row.activity_result },
    })
  }

  const truncated =
    sessions.length >= DOMAIN_ROW_LIMIT ||
    (evaluationsRes.data?.length ?? 0) >= DOMAIN_ROW_LIMIT ||
    (resultsRes.data?.length ?? 0) >= DOMAIN_ROW_LIMIT

  return { events, truncated }
}

// ---------------------------------------------------------------------------
// Envíos de actividades (user_activity_submissions)
// ---------------------------------------------------------------------------

interface ActivitySubmissionRow {
  submission_id: string
  lesson_id: string | null
  activity_id: string | null
  status: string | null
  response_text: string | null
  submitted_at: string | null
  last_validated_at: string | null
  created_at: string | null
  updated_at: string | null
}

/** Extrae un texto legible de lo que escribió el alumno (HTML plano recortado). */
function extractResponseSnippet(responseText: string | null): string | null {
  if (!responseText) return null
  const plain = responseText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return null
  return plain.length > 280 ? `${plain.slice(0, 280)}…` : plain
}

export async function fetchActivitySubmissionEvents(
  supabase: LooseClient,
  userId: string,
): Promise<DomainResult> {
  const { data, error } = await fromLoose<ActivitySubmissionRow>(
    supabase,
    'user_activity_submissions',
  )
    .select(
      'submission_id, lesson_id, activity_id, status, response_text, submitted_at, last_validated_at, created_at, updated_at',
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(DOMAIN_ROW_LIMIT)

  if (error || !data) return EMPTY

  const events: ForensicEvent[] = data.flatMap((row): ForensicEvent[] => {
    const at = toIso(row.submitted_at) ?? toIso(row.updated_at) ?? toIso(row.created_at)
    if (!at) return []
    const snippet = extractResponseSnippet(row.response_text)
    return [
      {
        id: `activity:${row.submission_id}`,
        type: 'activity_submission',
        atUtc: at,
        title: 'Envío de actividad',
        detail: `Estado: ${row.status ?? '—'}${snippet ? ` — "${snippet}"` : ''}`,
        refIds: { lessonId: row.lesson_id, activityId: row.activity_id },
        meta: {
          status: row.status,
          responseText: snippet,
          lastValidatedAt: toIso(row.last_validated_at),
        },
      },
    ]
  })

  return { events, truncated: data.length >= DOMAIN_ROW_LIMIT }
}
