import {
  attemptsInWindow,
  attemptWindowStart,
  retryAvailableAt,
} from '@/features/courses/services/attempt-cooldown'
import {
  MAX_ACTIVITY_COMPLETION_ATTEMPTS,
  MAX_DIALOGUE_ACTIVITY_ATTEMPTS,
  MAX_QUIZ_ATTEMPTS,
} from '@/features/courses/services/attempt-limits'
import {
  attemptCountsAfterUnlock,
  resolveLatestUnlock,
} from '@/features/courses/services/attempt-unlocks/attempt-unlock.rules'
import type { AttemptUnlockRecord } from '@/features/courses/services/attempt-unlocks/attempt-unlock.types'

import type {
  ForensicAttemptLock,
  ForensicContentRefs,
  ForensicLockScope,
  ForensicLockStatus,
} from './user-forensics.types'

/**
 * Detección PURA de bloqueos por tope de intentos (sin BD, unit-testeable).
 *
 * Responde a la pregunta operativa del panel forense: *¿por qué este alumno no
 * avanza?*. Reproduce exactamente la aritmética de los tres motores de intentos —quiz,
 * diálogo SofLIA y actividades LIA, todos con la MISMA ventana deslizante— incluyendo
 * el efecto de los desbloqueos administrativos, para que lo que muestra el panel
 * coincida con lo que el alumno ve en el curso.
 *
 * Topes y ventana se IMPORTAN de los motores (`attempt-limits`, `attempt-cooldown`): si
 * producto cambia un número, el panel se entera solo. Nunca se duplican aquí.
 */

export interface QuizAttemptRecord {
  attemptId: string
  lessonId: string | null
  materialId: string | null
  activityId: string | null
  enrollmentId: string | null
  createdAtUtc: string | null
  isPassed: boolean
}

export interface DialogueSessionRecord {
  sessionId: string
  lessonId: string | null
  activityId: string | null
  enrollmentId: string | null
  /** Estado terminal; solo los terminales consumen intento. */
  state: string | null
  startedAtUtc: string | null
}

export interface LiaActivityCompletionRecord {
  completionId: string
  activityId: string | null
  enrollmentId: string | null
  status: string | null
  startedAtUtc: string | null
}

export interface AttemptLockInput {
  quizAttempts: QuizAttemptRecord[]
  dialogueSessions: DialogueSessionRecord[]
  liaCompletions: LiaActivityCompletionRecord[]
  unlocks: AttemptUnlockRecord[]
  /** Email del admin que concedió cada desbloqueo, por `granted_by`. */
  grantedByEmails: Map<string, string>
}

/** Estados de sesión de diálogo que consumen intento (espejo de `terminalDialogueStates`). */
const TERMINAL_DIALOGUE_STATES = new Set(['COMPLETE', 'FAIL_OR_RETRY', 'SESSION_SUMMARY'])

function parseMs(value: string | null): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

function maxIso(a: string | null, b: string | null): string | null {
  const aMs = parseMs(a)
  const bMs = parseMs(b)
  if (aMs === null) return b
  if (bMs === null) return a
  return bMs > aMs ? b : a
}

/**
 * Estado del tope a partir del cupo consumido. `at_risk` avisa del último intento
 * disponible; `cleared` deja constancia de un desbloqueo ya aplicado.
 */
function resolveLockStatus(input: {
  attemptsUsed: number
  maxAttempts: number
  recoversAutomatically: boolean
  hasUnlock: boolean
}): ForensicLockStatus | null {
  const { attemptsUsed, maxAttempts, recoversAutomatically, hasUnlock } = input

  if (attemptsUsed >= maxAttempts) {
    return recoversAutomatically ? 'cooldown' : 'locked'
  }
  if (hasUnlock) return 'cleared'
  if (attemptsUsed === maxAttempts - 1) return 'at_risk'
  return null
}

/** Grupo de intentos que comparten un mismo tope (mismo quiz o misma actividad). */
interface LockGroup {
  refs: ForensicContentRefs & { materialId?: string | null; enrollmentId?: string | null }
  passed: boolean
  lastAttemptAtUtc: string | null
  /** Marcas de tiempo de los intentos que consumen cupo (estado terminal, etc.). */
  attemptTimestamps: Array<string | null>
}

interface LockGroupInput {
  scope: ForensicLockScope
  key: string
  group: LockGroup
  maxAttempts: number
  unlocks: AttemptUnlockRecord[]
  grantedByEmails: Map<string, string>
  userId: string
  now: Date
}

/**
 * Aplica la ventana deslizante a un grupo y decide si hay hallazgo.
 *
 * Es el ÚNICO sitio donde se cuenta cupo en el panel: los tres motores comparten
 * `attemptWindowStart` / `attemptsInWindow` / `retryAvailableAt` con la aplicación,
 * así que lo que ve el auditor es exactamente lo que vive el alumno.
 */
function buildLock(input: LockGroupInput): ForensicAttemptLock | null {
  const unlock = resolveLatestUnlock(input.unlocks, {
    userId: input.userId,
    scope: input.scope,
    lessonId: input.group.refs.lessonId ?? null,
    materialId: input.group.refs.materialId ?? null,
    activityId: input.group.refs.activityId ?? null,
    enrollmentId: input.group.refs.enrollmentId ?? null,
  })

  // Un quiz/actividad ya superado no bloquea a nadie: no es un hallazgo.
  if (input.group.passed) return null

  const unlockedFrom = unlock?.effectiveFromUtc ?? null
  const windowStart = attemptWindowStart(input.now, unlockedFrom)
  const inWindow = attemptsInWindow(input.group.attemptTimestamps, windowStart)

  // Intentos que siguen contando desde el último desbloqueo, aunque hayan salido de la
  // ventana: sin este dato, un bloqueo de ayer sería invisible para quien audita hoy.
  const attemptsSinceUnlock = input.group.attemptTimestamps.filter((iso) =>
    attemptCountsAfterUnlock(iso, unlockedFrom),
  ).length

  const attemptsUsed = inWindow.length
  const retryAvailableAtUtc = inWindow.length ? retryAvailableAt(inWindow[0]) : null

  const status = resolveLockStatus({
    attemptsUsed,
    maxAttempts: input.maxAttempts,
    recoversAutomatically: retryAvailableAtUtc !== null,
    hasUnlock: unlock !== null,
  })
  if (!status) return null

  return {
    id: `${input.scope}:${input.key}`,
    scope: input.scope,
    status,
    attemptsUsed,
    attemptsSinceUnlock,
    maxAttempts: input.maxAttempts,
    passed: input.group.passed,
    lastAttemptAtUtc: input.group.lastAttemptAtUtc,
    retryAvailableAtUtc: status === 'cooldown' ? retryAvailableAtUtc : null,
    // El contexto legible lo rellena el servicio con el índice de contenido.
    context: {
      courseTitle: null,
      moduleTitle: null,
      lessonTitle: null,
      activityTitle: null,
      learningPathTitle: null,
    },
    target: {
      lessonId: input.group.refs.lessonId ?? null,
      materialId: input.group.refs.materialId ?? null,
      activityId: input.group.refs.activityId ?? null,
      enrollmentId: input.group.refs.enrollmentId ?? null,
    },
    unlock: unlock
      ? {
          unlockId: unlock.unlockId,
          effectiveFromUtc: unlock.effectiveFromUtc,
          grantedByEmail: input.grantedByEmails.get(unlock.grantedBy) ?? null,
          reason: unlock.reason,
        }
      : null,
  }
}

/** Acumula un intento en su grupo, creándolo la primera vez. */
function pushAttempt(
  groups: Map<string, LockGroup>,
  key: string,
  refs: LockGroup['refs'],
  attempt: { atUtc: string | null; consumesQuota: boolean; passed: boolean },
): void {
  const group = groups.get(key) ?? {
    refs,
    passed: false,
    lastAttemptAtUtc: null,
    attemptTimestamps: [],
  }

  if (attempt.passed) group.passed = true
  if (attempt.consumesQuota) {
    group.attemptTimestamps.push(attempt.atUtc)
    group.lastAttemptAtUtc = maxIso(group.lastAttemptAtUtc, attempt.atUtc)
  }

  groups.set(key, group)
}

function buildLocks(
  groups: Map<string, LockGroup>,
  scope: ForensicLockScope,
  maxAttempts: number,
  input: AttemptLockInput,
  userId: string,
  now: Date,
): ForensicAttemptLock[] {
  const locks: ForensicAttemptLock[] = []

  for (const [key, group] of groups) {
    const lock = buildLock({
      scope,
      key,
      group,
      maxAttempts,
      unlocks: input.unlocks,
      grantedByEmails: input.grantedByEmails,
      userId,
      now,
    })
    if (lock) locks.push(lock)
  }

  return locks
}

function computeQuizLocks(
  input: AttemptLockInput,
  userId: string,
  now: Date,
): ForensicAttemptLock[] {
  const groups = new Map<string, LockGroup>()

  for (const attempt of input.quizAttempts) {
    const key = [
      attempt.lessonId ?? '',
      attempt.materialId ?? '',
      attempt.activityId ?? '',
      attempt.enrollmentId ?? '',
    ].join('|')

    pushAttempt(
      groups,
      key,
      {
        lessonId: attempt.lessonId,
        materialId: attempt.materialId,
        activityId: attempt.activityId,
        enrollmentId: attempt.enrollmentId,
      },
      { atUtc: attempt.createdAtUtc, consumesQuota: true, passed: attempt.isPassed },
    )
  }

  return buildLocks(groups, 'quiz', MAX_QUIZ_ATTEMPTS, input, userId, now)
}

function computeDialogueLocks(
  input: AttemptLockInput,
  userId: string,
  now: Date,
): ForensicAttemptLock[] {
  const groups = new Map<string, LockGroup>()

  for (const session of input.dialogueSessions) {
    if (!session.activityId) continue

    pushAttempt(
      groups,
      [session.activityId, session.enrollmentId ?? ''].join('|'),
      {
        lessonId: session.lessonId,
        activityId: session.activityId,
        enrollmentId: session.enrollmentId,
      },
      {
        atUtc: session.startedAtUtc,
        // Solo las sesiones terminales consumen intento: una abandonada o rota por un
        // fallo del evaluador no es un intento real del alumno.
        consumesQuota: TERMINAL_DIALOGUE_STATES.has(session.state ?? ''),
        passed: session.state === 'COMPLETE',
      },
    )
  }

  return buildLocks(groups, 'dialogue', MAX_DIALOGUE_ACTIVITY_ATTEMPTS, input, userId, now)
}

function computeLiaActivityLocks(
  input: AttemptLockInput,
  userId: string,
  now: Date,
): ForensicAttemptLock[] {
  const groups = new Map<string, LockGroup>()

  for (const completion of input.liaCompletions) {
    if (!completion.activityId) continue

    pushAttempt(
      groups,
      completion.activityId,
      // El tope de las actividades LIA se cuenta por usuario + actividad (sin
      // inscripción): el desbloqueo debe concederse con el MISMO alcance, o la
      // pre-validación de la aplicación seguiría viendo los intentos consumidos.
      { activityId: completion.activityId, enrollmentId: null },
      {
        atUtc: completion.startedAtUtc,
        consumesQuota: true,
        passed: completion.status === 'completed',
      },
    )
  }

  return buildLocks(groups, 'lia_activity', MAX_ACTIVITY_COMPLETION_ATTEMPTS, input, userId, now)
}

const STATUS_PRIORITY: Record<ForensicLockStatus, number> = {
  locked: 0,
  cooldown: 1,
  at_risk: 2,
  cleared: 3,
}

/**
 * Todos los topes de intentos relevantes del alumno, ordenados por gravedad y, dentro
 * de cada nivel, por recencia del último intento.
 */
export function computeAttemptLocks(
  input: AttemptLockInput,
  userId: string,
  now: Date = new Date(),
): ForensicAttemptLock[] {
  return [
    ...computeQuizLocks(input, userId, now),
    ...computeDialogueLocks(input, userId, now),
    ...computeLiaActivityLocks(input, userId, now),
  ].sort((a, b) => {
    const byStatus = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    if (byStatus !== 0) return byStatus
    return (parseMs(b.lastAttemptAtUtc) ?? 0) - (parseMs(a.lastAttemptAtUtc) ?? 0)
  })
}

/** ¿Hay algún tope que impida avanzar ahora mismo? */
export function countBlockingLocks(locks: ForensicAttemptLock[]): number {
  return locks.filter((lock) => lock.status === 'locked' || lock.status === 'cooldown').length
}
