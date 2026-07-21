// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'

import { submitQuizResults } from '../quiz-submit.service'

function createJsonResponse(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })
}

const baseParams = {
  lessonId: 'lesson-1',
  selectedAnswers: { 'question-1': 0 },
  slug: 'course-slug',
} as const

describe('submitQuizResults', () => {
  it('returns the server-graded result on success without trusting the client', async () => {
    const serverResult = {
      score: 1,
      totalQuestions: 1,
      totalPoints: 1,
      pointsEarned: 1,
      percentage: 100,
      isPassed: true,
      perQuestion: [
        { questionId: 'question-1', isCorrect: true, correctAnswer: 0, explanation: null, points: 1 },
      ],
      attemptsRemaining: 2,
      maxAttempts: 3,
    }

    global.fetch = vi.fn(async () =>
      createJsonResponse({ message: 'Quiz aprobado.', result: serverResult }),
    ) as typeof fetch

    const outcome = await submitQuizResults({ ...baseParams })

    expect(outcome.status).toBe('ok')
    if (outcome.status === 'ok') {
      expect(outcome.result).toEqual(serverResult)
    }

    // El body enviado NO debe incluir la clave de respuestas.
    const call = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    const sentBody = JSON.parse((call[1] as RequestInit).body as string)
    expect(sentBody).not.toHaveProperty('quizData')
    expect(sentBody).toHaveProperty('answers')
  })

  it('returns a locked outcome with retryAfter on HTTP 429', async () => {
    global.fetch = vi.fn(async () =>
      createJsonResponse(
        {
          error: 'QUIZ_ATTEMPT_LIMIT_REACHED',
          message: 'Alcanzaste el maximo de intentos.',
          details: { retryAfter: '2026-07-21T10:00:00.000Z' },
        },
        { status: 429 },
      ),
    ) as typeof fetch

    const outcome = await submitQuizResults({ ...baseParams })

    expect(outcome.status).toBe('locked')
    if (outcome.status === 'locked') {
      expect(outcome.retryAfter).toBe('2026-07-21T10:00:00.000Z')
    }
  })

  it('returns an error outcome when the response has no result', async () => {
    global.fetch = vi.fn(async () =>
      createJsonResponse({ error: 'QUIZ_CONTENT_NOT_FOUND', message: 'No encontrado.' }, { status: 404 }),
    ) as typeof fetch

    const outcome = await submitQuizResults({ ...baseParams })

    expect(outcome.status).toBe('error')
  })
})
