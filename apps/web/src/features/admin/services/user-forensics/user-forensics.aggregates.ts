import type { VideoTrackingStat } from './user-forensics.queries.content'
import type {
  ForensicAggregates,
  ForensicEvent,
  ForensicFlag,
  ForensicNote,
  ForensicSession,
} from './user-forensics.types'

/**
 * Cálculo puro de agregados "maquillados" y señales de alerta a partir de los eventos
 * y datos crudos. Sin dependencias de BD: es el cerebro humanizado del panel y se
 * unit-testea con datos sintéticos.
 */

export interface AggregatesInput {
  events: ForensicEvent[]
  sessions: ForensicSession[]
  /** IPs adicionales (user_activity_log, lia_conversations) para el conteo real. */
  accessIps: string[]
  /** Actividades de diálogo SofLIA disponibles en los cursos del usuario (denominador). */
  dialoguesAvailable: number
  videoStats: VideoTrackingStat[]
  notes: ForensicNote[]
  certificate: { count: number; lastIssuedAtUtc: string | null }
  lia: { conversations: number; abandoned: number; totalMessages: number }
}

function countType(events: ForensicEvent[], type: ForensicEvent['type']): number {
  return events.filter((event) => event.type === type).length
}

function minMaxIso(values: Array<string | null>): { min: string | null; max: string | null } {
  let min: string | null = null
  let max: string | null = null
  for (const value of values) {
    if (!value) continue
    const ms = Date.parse(value)
    if (Number.isNaN(ms)) continue
    if (min === null || ms < Date.parse(min)) min = value
    if (max === null || ms > Date.parse(max)) max = value
  }
  return { min, max }
}

function quizKey(event: ForensicEvent): string {
  const refs = event.refIds ?? {}
  return `${refs.lessonId ?? ''}|${refs.materialId ?? ''}|${refs.activityId ?? ''}`
}

// Ventana para considerar dos accesos "al mismo tiempo" (posible cuenta compartida /
// dos dispositivos a la vez). Muchos logins en horas distintas NO son sospechosos.
const CONCURRENCY_WINDOW_MS = 15 * 60 * 1000

/**
 * Cuenta sesiones que tienen OTRA sesión desde una IP distinta iniciada dentro de una
 * ventana corta — la única señal de acceso realmente sospechosa. Ignora accesos
 * repetidos desde la misma IP y logins separados en el tiempo.
 */
function countConcurrentSessions(sessions: ForensicSession[]): number {
  const points = sessions
    .filter((session) => session.ipAddress && session.createdAtUtc)
    .map((session) => ({ ip: session.ipAddress as string, t: Date.parse(session.createdAtUtc as string) }))
    .filter((point) => !Number.isNaN(point.t))
    .sort((a, b) => a.t - b.t)

  let concurrent = 0
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length && points[j].t - points[i].t <= CONCURRENCY_WINDOW_MS; j += 1) {
      if (points[j].ip !== points[i].ip) {
        concurrent += 1
        break
      }
    }
  }
  return concurrent
}

export function computeForensicAggregates(input: AggregatesInput): ForensicAggregates {
  const { events, sessions, accessIps, dialoguesAvailable, videoStats, notes, certificate, lia } = input

  // --- Accesos ---
  // IPs distintas de TODAS las fuentes (sesiones de login + actividad + LIA).
  const ipSet = new Set<string>()
  for (const session of sessions) {
    if (session.ipAddress) ipSet.add(session.ipAddress)
  }
  for (const ip of accessIps) {
    if (ip) ipSet.add(ip)
  }
  const ipAddresses = [...ipSet]
  const distinctIps = ipAddresses.length
  const distinctDevices = new Set(
    sessions.map((s) => s.deviceFingerprint ?? s.userAgent).filter(Boolean),
  ).size
  const loginBounds = minMaxIso(sessions.map((s) => s.createdAtUtc))

  // --- Videos ---
  const videosWithProgress = videoStats.filter((s) => s.hasProgress).length
  const videosWatchedFull = videoStats.filter((s) => s.watchedFull).length
  const videosSpedUp = videoStats.filter((s) => s.hasProgress && s.spedUp).length
  const videosBarelyWatched = videoStats.filter((s) => s.barelyWatched).length
  const totalVideoMinutes = Math.round(
    videoStats.reduce((sum, s) => sum + (s.videoMinutes ?? 0), 0),
  )
  const playbackRates = videoStats.map((s) => s.playbackRate).filter((r): r is number => r !== null)
  const maxPlaybackRate = playbackRates.length ? Math.max(...playbackRates) : null

  // --- Diálogos ---
  const dialogueStarted = countType(events, 'dialogue_started')
  const dialogueResults = events.filter((e) => e.type === 'dialogue_result')
  const dialogueCompleted = dialogueResults.filter(
    (e) => (e.meta?.activityResult as string | undefined) === 'completed',
  ).length
  const resultSessions = new Set(
    dialogueResults.map((e) => e.refIds?.sessionId).filter(Boolean),
  ).size
  const dialogueScores = dialogueResults
    .map((e) => e.score)
    .filter((s): s is number => typeof s === 'number')
  const averageScore = dialogueScores.length
    ? Math.round(dialogueScores.reduce((a, b) => a + b, 0) / dialogueScores.length)
    : null

  // --- Quizzes ---
  const quizAttempts = events.filter((e) => e.type === 'quiz_attempt')
  const attemptsByQuiz = new Map<string, { count: number; passed: boolean }>()
  for (const attempt of quizAttempts) {
    const key = quizKey(attempt)
    const prev = attemptsByQuiz.get(key) ?? { count: 0, passed: false }
    prev.count += 1
    if (attempt.meta?.isPassed === true) prev.passed = true
    attemptsByQuiz.set(key, prev)
  }
  const passedQuizzes = [...attemptsByQuiz.values()].filter((q) => q.passed).length
  const maxAttemptsOnSingleQuiz = attemptsByQuiz.size
    ? Math.max(...[...attemptsByQuiz.values()].map((q) => q.count))
    : 0

  // --- Actividades ---
  const activityEvents = events.filter((e) => e.type === 'activity_submission')
  const validatedActivities = activityEvents.filter(
    (e) => (e.meta?.status as string | undefined) === 'validated',
  ).length

  // --- Cursos ---
  const enrollEvents = events.filter((e) => e.type === 'course_enrolled')
  const completedCourses = enrollEvents.filter((e) => e.meta?.completed === true).length

  return {
    access: {
      totalLogins: sessions.length,
      distinctIps,
      ipAddresses,
      distinctDevices,
      concurrentSessions: countConcurrentSessions(sessions),
      firstLoginAtUtc: loginBounds.min,
      lastLoginAtUtc: loginBounds.max,
    },
    courses: {
      enrolled: enrollEvents.length,
      completed: completedCourses,
      certificatesIssued: certificate.count,
      lastCertificateAtUtc: certificate.lastIssuedAtUtc,
    },
    lessons: {
      started: countType(events, 'lesson_started'),
      completed: countType(events, 'lesson_completed'),
      videosWithProgress,
      videosWatchedFull,
      videosSpedUp,
      videosBarelyWatched,
      totalVideoMinutes,
      maxPlaybackRate,
    },
    dialogues: {
      total: dialogueStarted,
      completed: dialogueCompleted,
      abandoned: Math.max(0, dialogueStarted - resultSessions),
      passed: dialogueCompleted,
      averageScore,
      available: dialoguesAvailable,
    },
    quizzes: {
      totalAttempts: quizAttempts.length,
      distinctQuizzes: attemptsByQuiz.size,
      passed: passedQuizzes,
      maxAttemptsOnSingleQuiz,
    },
    activities: {
      submitted: activityEvents.length,
      validated: validatedActivities,
    },
    notes: {
      total: notes.length,
      userWritten: notes.filter((n) => !n.isAutoGenerated || n.isUserEdited).length,
      autoGenerated: notes.filter((n) => n.isAutoGenerated && !n.isUserEdited).length,
    },
    lia: {
      conversations: lia.conversations,
      abandonedConversations: lia.abandoned,
      totalMessages: lia.totalMessages,
    },
  }
}

/**
 * Señales de alerta forenses derivadas de los agregados: posibles indicios de trampa o
 * anomalías (video acelerado, video casi sin ver, muchos intentos de quiz, varias IPs).
 */
export function computeForensicFlags(aggregates: ForensicAggregates): ForensicFlag[] {
  const flags: ForensicFlag[] = []

  if (aggregates.lessons.videosSpedUp > 0) {
    flags.push({
      key: 'videosSpedUp',
      severity: 'warning',
      params: { count: aggregates.lessons.videosSpedUp, rate: aggregates.lessons.maxPlaybackRate ?? 2 },
    })
  }
  if (aggregates.lessons.videosBarelyWatched > 0) {
    flags.push({
      key: 'videosBarelyWatched',
      severity: 'warning',
      params: { count: aggregates.lessons.videosBarelyWatched },
    })
  }
  if (aggregates.quizzes.maxAttemptsOnSingleQuiz >= 3) {
    flags.push({
      key: 'manyQuizAttempts',
      severity: 'warning',
      params: { count: aggregates.quizzes.maxAttemptsOnSingleQuiz },
    })
  }
  if (aggregates.dialogues.abandoned > 0) {
    flags.push({
      key: 'dialoguesAbandoned',
      severity: 'warning',
      params: { count: aggregates.dialogues.abandoned },
    })
  }
  // Completó cursos pero hizo muchos menos diálogos SofLIA de los disponibles: fuerte
  // indicio de que saltó las actividades guiadas.
  if (
    aggregates.courses.completed > 0 &&
    aggregates.dialogues.available > 0 &&
    aggregates.dialogues.completed < aggregates.dialogues.available * 0.5
  ) {
    flags.push({
      key: 'dialoguesSkipped',
      severity: 'danger',
      params: { done: aggregates.dialogues.completed, available: aggregates.dialogues.available },
    })
  }
  // SOLO accesos concurrentes (dos IPs casi al mismo tiempo) son sospechosos. Muchos
  // logins en horas distintas NO se marcan.
  if (aggregates.access.concurrentSessions > 0) {
    flags.push({
      key: 'concurrentSessions',
      severity: 'danger',
      params: { count: aggregates.access.concurrentSessions },
    })
  }

  return flags
}
