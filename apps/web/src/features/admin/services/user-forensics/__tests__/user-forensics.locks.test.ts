import { describe, expect, it } from 'vitest'

import { retryAvailableAt } from '@/features/courses/services/attempt-cooldown'
import {
  MAX_ACTIVITY_COMPLETION_ATTEMPTS,
  MAX_DIALOGUE_ACTIVITY_ATTEMPTS,
  MAX_QUIZ_ATTEMPTS,
} from '@/features/courses/services/attempt-limits'
import type { AttemptUnlockRecord } from '@/features/courses/services/attempt-unlocks/attempt-unlock.types'

import {
  computeAttemptLocks,
  countBlockingLocks,
  type AttemptLockInput,
} from '../user-forensics.locks'

const USER_ID = 'user-1'
const NOW = new Date('2026-08-03T12:00:00.000Z')

/** Marcas dentro de la ventana vigente (11:05, 11:15, 11:25, …). */
function withinWindow(index: number): string {
  return `2026-08-03T11:${String(index * 10 + 5).padStart(2, '0')}:00.000Z`
}

/** Marcas ya expiradas: el alumno recuperó ese cupo. */
function beforeWindow(index: number): string {
  return `2026-08-03T0${index + 1}:00:00.000Z`
}

function input(overrides: Partial<AttemptLockInput> = {}): AttemptLockInput {
  return {
    quizAttempts: [],
    dialogueSessions: [],
    liaCompletions: [],
    unlocks: [],
    grantedByEmails: new Map(),
    ...overrides,
  }
}

function quizAttempt(index: number, atUtc: string, isPassed = false) {
  return {
    attemptId: `attempt-${index}`,
    lessonId: 'lesson-1',
    materialId: 'material-1',
    activityId: null,
    enrollmentId: 'enroll-1',
    createdAtUtc: atUtc,
    isPassed,
  }
}

function dialogueSession(index: number, state: string, startedAtUtc: string) {
  return {
    sessionId: `session-${index}`,
    lessonId: 'lesson-9',
    activityId: 'activity-9',
    enrollmentId: 'enroll-1',
    state,
    startedAtUtc,
  }
}

function liaCompletion(index: number, startedAtUtc: string, status = 'failed') {
  return {
    completionId: `completion-${index}`,
    activityId: 'activity-lia',
    enrollmentId: 'enroll-1',
    status,
    startedAtUtc,
  }
}

function unlock(overrides: Partial<AttemptUnlockRecord> = {}): AttemptUnlockRecord {
  return {
    unlockId: 'unlock-1',
    scope: 'quiz',
    lessonId: null,
    materialId: null,
    activityId: null,
    enrollmentId: null,
    effectiveFromUtc: '2026-08-03T11:50:00.000Z',
    grantedBy: 'admin-1',
    reason: 'Fallo técnico',
    createdAtUtc: '2026-08-03T11:50:00.000Z',
    ...overrides,
  }
}

describe('computeAttemptLocks — quiz', () => {
  it('reports a cooldown once the attempts in the window are consumed', () => {
    const attempts = Array.from({ length: MAX_QUIZ_ATTEMPTS }, (_, i) =>
      quizAttempt(i, withinWindow(i)),
    )

    const locks = computeAttemptLocks(input({ quizAttempts: attempts }), USER_ID, NOW)

    expect(locks).toHaveLength(1)
    expect(locks[0].scope).toBe('quiz')
    expect(locks[0].status).toBe('cooldown')
    expect(locks[0].attemptsUsed).toBe(MAX_QUIZ_ATTEMPTS)
    // El intento más antiguo (11:05) libera cupo una hora después.
    expect(locks[0].retryAvailableAtUtc).toBe(retryAvailableAt(withinWindow(0)))
    expect(countBlockingLocks(locks)).toBe(1)
  })

  it('does not report a quiz the student already passed', () => {
    const attempts = Array.from({ length: MAX_QUIZ_ATTEMPTS }, (_, i) =>
      quizAttempt(i, withinWindow(i), i === MAX_QUIZ_ATTEMPTS - 1),
    )

    expect(computeAttemptLocks(input({ quizAttempts: attempts }), USER_ID, NOW)).toEqual([])
  })

  it('ignores attempts older than the cooldown window', () => {
    const attempts = Array.from({ length: MAX_QUIZ_ATTEMPTS }, (_, i) =>
      quizAttempt(i, beforeWindow(i)),
    )

    expect(computeAttemptLocks(input({ quizAttempts: attempts }), USER_ID, NOW)).toEqual([])
  })

  it('clears the lock when an admin unlock is newer than the attempts', () => {
    const attempts = Array.from({ length: MAX_QUIZ_ATTEMPTS }, (_, i) =>
      quizAttempt(i, withinWindow(i)),
    )

    const locks = computeAttemptLocks(
      input({
        quizAttempts: attempts,
        unlocks: [unlock({ scope: 'quiz', lessonId: 'lesson-1' })],
        grantedByEmails: new Map([['admin-1', 'admin@soflia.ai']]),
      }),
      USER_ID,
      NOW,
    )

    expect(locks).toHaveLength(1)
    expect(locks[0].status).toBe('cleared')
    expect(locks[0].attemptsUsed).toBe(0)
    expect(locks[0].unlock?.grantedByEmail).toBe('admin@soflia.ai')
    expect(countBlockingLocks(locks)).toBe(0)
  })

  it('warns when a single attempt is left', () => {
    const attempts = Array.from({ length: MAX_QUIZ_ATTEMPTS - 1 }, (_, i) =>
      quizAttempt(i, withinWindow(i)),
    )

    const locks = computeAttemptLocks(input({ quizAttempts: attempts }), USER_ID, NOW)

    expect(locks[0].status).toBe('at_risk')
    expect(countBlockingLocks(locks)).toBe(0)
  })
})

describe('computeAttemptLocks — diálogo SofLIA', () => {
  it('only counts terminal sessions inside the window', () => {
    const sessions = [
      ...Array.from({ length: MAX_DIALOGUE_ACTIVITY_ATTEMPTS }, (_, i) =>
        dialogueSession(i, 'FAIL_OR_RETRY', withinWindow(i)),
      ),
      dialogueSession(99, 'ELICIT_RESPONSE', withinWindow(0)),
    ]

    const locks = computeAttemptLocks(input({ dialogueSessions: sessions }), USER_ID, NOW)

    expect(locks).toHaveLength(1)
    expect(locks[0].status).toBe('cooldown')
    expect(locks[0].attemptsUsed).toBe(MAX_DIALOGUE_ACTIVITY_ATTEMPTS)
    // El bloqueo se levanta solo: ya no requiere acción del administrador.
    expect(locks[0].retryAvailableAtUtc).toBe(retryAvailableAt(withinWindow(0)))
    expect(locks[0].target.activityId).toBe('activity-9')
  })

  it('frees quota once the sessions leave the window', () => {
    const sessions = Array.from({ length: MAX_DIALOGUE_ACTIVITY_ATTEMPTS }, (_, i) =>
      dialogueSession(i, 'FAIL_OR_RETRY', beforeWindow(i)),
    )

    expect(computeAttemptLocks(input({ dialogueSessions: sessions }), USER_ID, NOW)).toEqual([])
  })

  it('does not report an activity completed by the student', () => {
    const sessions = [
      ...Array.from({ length: MAX_DIALOGUE_ACTIVITY_ATTEMPTS - 1 }, (_, i) =>
        dialogueSession(i, 'FAIL_OR_RETRY', withinWindow(i)),
      ),
      dialogueSession(50, 'COMPLETE', withinWindow(0)),
    ]

    expect(computeAttemptLocks(input({ dialogueSessions: sessions }), USER_ID, NOW)).toEqual([])
  })

  it('restarts the count from an activity-scoped unlock', () => {
    const sessions = Array.from({ length: MAX_DIALOGUE_ACTIVITY_ATTEMPTS }, (_, i) =>
      dialogueSession(i, 'FAIL_OR_RETRY', withinWindow(i)),
    )

    const locks = computeAttemptLocks(
      input({
        dialogueSessions: sessions,
        unlocks: [unlock({ scope: 'dialogue', activityId: 'activity-9' })],
      }),
      USER_ID,
      NOW,
    )

    expect(locks[0].status).toBe('cleared')
    expect(locks[0].attemptsUsed).toBe(0)
  })
})

describe('computeAttemptLocks — actividad LIA', () => {
  it('reports a cooldown once every attempt in the window failed', () => {
    const completions = Array.from({ length: MAX_ACTIVITY_COMPLETION_ATTEMPTS }, (_, i) =>
      liaCompletion(i, withinWindow(i)),
    )

    const locks = computeAttemptLocks(input({ liaCompletions: completions }), USER_ID, NOW)

    expect(locks).toHaveLength(1)
    expect(locks[0].scope).toBe('lia_activity')
    expect(locks[0].status).toBe('cooldown')
    expect(locks[0].maxAttempts).toBe(MAX_ACTIVITY_COMPLETION_ATTEMPTS)
    expect(locks[0].retryAvailableAtUtc).toBe(retryAvailableAt(withinWindow(0)))
    // El desbloqueo se concede por usuario + actividad, igual que se cuenta el tope.
    expect(locks[0].target.enrollmentId).toBeNull()
    expect(locks[0].target.activityId).toBe('activity-lia')
  })

  it('restarts the count from an activity-scoped unlock', () => {
    const completions = Array.from({ length: MAX_ACTIVITY_COMPLETION_ATTEMPTS }, (_, i) =>
      liaCompletion(i, withinWindow(i)),
    )

    const locks = computeAttemptLocks(
      input({
        liaCompletions: completions,
        unlocks: [unlock({ scope: 'lia_activity', activityId: 'activity-lia' })],
      }),
      USER_ID,
      NOW,
    )

    expect(locks[0].status).toBe('cleared')
    expect(locks[0].attemptsUsed).toBe(0)
  })
})

describe('computeAttemptLocks — historial', () => {
  it('keeps the attempts made since the last unlock even after they leave the window', () => {
    const completions = [
      ...Array.from({ length: MAX_ACTIVITY_COMPLETION_ATTEMPTS }, (_, i) =>
        liaCompletion(i, beforeWindow(i)),
      ),
      liaCompletion(90, withinWindow(0)),
    ]

    const locks = computeAttemptLocks(input({ liaCompletions: completions }), USER_ID, NOW)

    // Solo 1 intento consume cupo ahora, pero el auditor ve los 6 acumulados.
    expect(locks).toHaveLength(0)

    const withUnlockHistory = computeAttemptLocks(
      input({
        liaCompletions: completions,
        unlocks: [unlock({ scope: 'lia_activity', activityId: 'activity-lia' })],
      }),
      USER_ID,
      NOW,
    )

    expect(withUnlockHistory[0].status).toBe('cleared')
    expect(withUnlockHistory[0].attemptsUsed).toBe(0)
    expect(withUnlockHistory[0].attemptsSinceUnlock).toBe(0)
  })

  it('counts every attempt since the beginning when there is no unlock', () => {
    const attempts = [
      ...Array.from({ length: MAX_QUIZ_ATTEMPTS }, (_, i) => quizAttempt(i, beforeWindow(i))),
      ...Array.from({ length: MAX_QUIZ_ATTEMPTS }, (_, i) =>
        quizAttempt(i + 10, withinWindow(i)),
      ),
    ]

    const locks = computeAttemptLocks(input({ quizAttempts: attempts }), USER_ID, NOW)

    expect(locks[0].attemptsUsed).toBe(MAX_QUIZ_ATTEMPTS)
    expect(locks[0].attemptsSinceUnlock).toBe(MAX_QUIZ_ATTEMPTS * 2)
  })
})

describe('computeAttemptLocks — ordenación', () => {
  it('puts active lockouts before warnings', () => {
    const locks = computeAttemptLocks(
      input({
        quizAttempts: Array.from({ length: MAX_QUIZ_ATTEMPTS }, (_, i) =>
          quizAttempt(i, withinWindow(i)),
        ),
        dialogueSessions: Array.from({ length: MAX_DIALOGUE_ACTIVITY_ATTEMPTS - 1 }, (_, i) =>
          dialogueSession(i, 'FAIL_OR_RETRY', withinWindow(i)),
        ),
      }),
      USER_ID,
      NOW,
    )

    expect(locks.map((lock) => lock.status)).toEqual(['cooldown', 'at_risk'])
  })
})
