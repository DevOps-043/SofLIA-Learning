import { describe, expect, it } from 'vitest'

import {
  ATTEMPT_COOLDOWN_HOURS,
  MAX_QUIZ_ATTEMPTS,
  resolveQuizAttempt,
} from '../quiz-attempt-limit.service'

type WindowRow = { created_at: string }
type UnlockRow = Record<string, unknown>
type StubResult<T> = { data: T[] | null; error: { message: string } | null }

/**
 * Stub encadenable que imita el query builder de Supabase envuelto por `fromLoose`.
 * Todos los métodos de filtro devuelven el mismo objeto, que es "awaitable" y resuelve
 * al resultado de la tabla consultada (intentos vs. desbloqueos administrativos).
 *
 * El stub NO aplica los filtros: el `.gte` de la ventana se captura para verificarlo y
 * el recorte real lo hace el servicio en memoria, con la misma aritmética que el resto
 * de motores de intentos.
 */
function createSupabaseStub(
  attempts: StubResult<WindowRow>,
  unlocks: StubResult<UnlockRow> = { data: [], error: null },
) {
  /** Inicio de ventana con el que se consultó `user_quiz_attempts`. */
  const attemptsWindowStart: string[] = []

  const makeChain = (
    result: StubResult<WindowRow> | StubResult<UnlockRow>,
    recordWindow: boolean,
  ) => {
    const chain: Record<string, unknown> = {}
    for (const method of ['select', 'eq', 'is', 'order', 'limit']) {
      chain[method] = () => chain
    }
    chain.gte = (_column: string, value: string) => {
      if (recordWindow) attemptsWindowStart.push(value)
      return chain
    }
    chain.then = (resolve: (value: typeof result) => unknown) => resolve(result)
    return chain
  }

  return {
    attemptsWindowStart,
    client: {
      from: (table: string) =>
        table === 'user_attempt_unlocks' ? makeChain(unlocks, false) : makeChain(attempts, true),
    },
  }
}

const WINDOW_MS = ATTEMPT_COOLDOWN_HOURS * 60 * 60 * 1000
const NOW = new Date('2026-08-03T12:00:00.000Z')

const baseInput = {
  userId: 'user-1',
  lessonId: 'lesson-1',
  enrollmentId: 'enroll-1',
  materialId: 'material-1',
  activityId: null,
  alreadyPassed: false,
}

function quizUnlock(overrides: Partial<UnlockRow> = {}): UnlockRow {
  return {
    unlock_id: 'unlock-1',
    scope: 'quiz',
    lesson_id: 'lesson-1',
    material_id: null,
    activity_id: null,
    enrollment_id: null,
    effective_from: '2026-08-03T11:30:00.000Z',
    granted_by: 'admin-1',
    reason: 'Fallo técnico durante el intento',
    created_at: '2026-08-03T11:30:00.000Z',
    ...overrides,
  }
}

describe('resolveQuizAttempt', () => {
  it('short-circuits when the quiz is already passed', async () => {
    const stub = createSupabaseStub({ data: [], error: null })
    const decision = await resolveQuizAttempt(
      stub.client,
      { ...baseInput, alreadyPassed: true },
      NOW,
    )
    expect(decision.kind).toBe('already_passed')
  })

  it('allows an attempt when below the limit', async () => {
    const stub = createSupabaseStub({
      data: [{ created_at: '2026-08-03T11:30:00.000Z' }],
      error: null,
    })

    const decision = await resolveQuizAttempt(stub.client, baseInput, NOW)

    expect(decision).toEqual({
      kind: 'can_attempt',
      attemptNumber: 2,
      attemptsRemaining: MAX_QUIZ_ATTEMPTS - 1,
    })
  })

  it('blocks with retryAfter once the limit is reached', async () => {
    const oldest = '2026-08-03T11:10:00.000Z'
    const rows: WindowRow[] = [
      { created_at: oldest },
      { created_at: '2026-08-03T11:30:00.000Z' },
      { created_at: '2026-08-03T11:50:00.000Z' },
    ]

    const stub = createSupabaseStub({ data: rows, error: null })
    const decision = await resolveQuizAttempt(stub.client, baseInput, NOW)

    expect(decision.kind).toBe('limit_reached')
    if (decision.kind === 'limit_reached') {
      expect(decision.retryAfter).toBe(new Date(Date.parse(oldest) + WINDOW_MS).toISOString())
      expect(decision.attemptsInWindow).toBe(MAX_QUIZ_ATTEMPTS)
    }
  })

  it('frees quota again once the attempts leave the cooldown window', async () => {
    const stub = createSupabaseStub({
      data: [
        { created_at: '2026-08-03T09:00:00.000Z' },
        { created_at: '2026-08-03T09:30:00.000Z' },
        { created_at: '2026-08-03T10:00:00.000Z' },
      ],
      error: null,
    })

    const decision = await resolveQuizAttempt(stub.client, baseInput, NOW)

    expect(decision).toEqual({
      kind: 'can_attempt',
      attemptNumber: 1,
      attemptsRemaining: MAX_QUIZ_ATTEMPTS,
    })
  })

  it('fails open (allows attempt) when the count query errors', async () => {
    const stub = createSupabaseStub({ data: null, error: { message: 'db down' } })
    const decision = await resolveQuizAttempt(stub.client, baseInput, NOW)
    expect(decision.kind).toBe('can_attempt')
  })

  it('counts from the admin unlock when it is newer than the cooldown window', async () => {
    const stub = createSupabaseStub(
      { data: [], error: null },
      { data: [quizUnlock()], error: null },
    )

    await resolveQuizAttempt(stub.client, baseInput, NOW)

    expect(stub.attemptsWindowStart).toEqual(['2026-08-03T11:30:00.000Z'])
  })

  it('ignores unlocks granted for a different lesson', async () => {
    const stub = createSupabaseStub(
      { data: [], error: null },
      { data: [quizUnlock({ lesson_id: 'another-lesson' })], error: null },
    )

    await resolveQuizAttempt(stub.client, baseInput, NOW)

    expect(stub.attemptsWindowStart).toEqual([new Date(NOW.getTime() - WINDOW_MS).toISOString()])
  })
})
