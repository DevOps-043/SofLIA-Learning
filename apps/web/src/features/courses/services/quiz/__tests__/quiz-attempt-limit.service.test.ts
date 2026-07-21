import { describe, expect, it } from 'vitest'

import {
  MAX_QUIZ_ATTEMPTS,
  QUIZ_ATTEMPT_COOLDOWN_HOURS,
  resolveQuizAttempt,
} from '../quiz-attempt-limit.service'

type WindowRow = { created_at: string }

/**
 * Stub encadenable que imita el query builder de Supabase envuelto por `fromLoose`.
 * Todos los métodos de filtro devuelven el mismo objeto, que es "awaitable" y resuelve
 * al resultado provisto.
 */
function createSupabaseStub(result: { data: WindowRow[] | null; error: { message: string } | null }) {
  const chain: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'is', 'gte', 'order']) {
    chain[method] = () => chain
  }
  chain.then = (resolve: (value: typeof result) => unknown) => resolve(result)
  return { from: () => chain }
}

const baseInput = {
  userId: 'user-1',
  lessonId: 'lesson-1',
  enrollmentId: 'enroll-1',
  materialId: 'material-1',
  activityId: null,
  alreadyPassed: false,
}

describe('resolveQuizAttempt', () => {
  it('short-circuits when the quiz is already passed', async () => {
    const decision = await resolveQuizAttempt(createSupabaseStub({ data: [], error: null }), {
      ...baseInput,
      alreadyPassed: true,
    })
    expect(decision.kind).toBe('already_passed')
  })

  it('allows an attempt when below the limit', async () => {
    const decision = await resolveQuizAttempt(
      createSupabaseStub({ data: [{ created_at: '2026-07-20T10:00:00.000Z' }], error: null }),
      baseInput,
    )
    expect(decision).toEqual({ kind: 'can_attempt', attemptNumber: 2, attemptsRemaining: MAX_QUIZ_ATTEMPTS - 1 })
  })

  it('blocks with retryAfter once the limit is reached', async () => {
    const oldest = '2026-07-20T08:00:00.000Z'
    const rows: WindowRow[] = [
      { created_at: oldest },
      { created_at: '2026-07-20T09:00:00.000Z' },
      { created_at: '2026-07-20T10:00:00.000Z' },
    ]
    const now = new Date('2026-07-20T11:00:00.000Z')

    const decision = await resolveQuizAttempt(createSupabaseStub({ data: rows, error: null }), baseInput, now)

    expect(decision.kind).toBe('limit_reached')
    if (decision.kind === 'limit_reached') {
      const expected = new Date(
        new Date(oldest).getTime() + QUIZ_ATTEMPT_COOLDOWN_HOURS * 60 * 60 * 1000,
      ).toISOString()
      expect(decision.retryAfter).toBe(expected)
      expect(decision.attemptsInWindow).toBe(3)
    }
  })

  it('fails open (allows attempt) when the count query errors', async () => {
    const decision = await resolveQuizAttempt(
      createSupabaseStub({ data: null, error: { message: 'db down' } }),
      baseInput,
    )
    expect(decision.kind).toBe('can_attempt')
  })
})
