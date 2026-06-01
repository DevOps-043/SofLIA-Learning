// @vitest-environment jsdom

import { waitFor } from '@testing-library/react'
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

describe('submitQuizResults', () => {
  it('waits for lesson content refresh before resolving quiz submission', async () => {
    const events: string[] = []
    let resolveRefresh: (() => void) | undefined

    global.fetch = vi.fn(async () => {
      events.push('submit')
      return createJsonResponse({ message: 'Guardado' })
    }) as typeof fetch

    const submissionPromise = submitQuizResults({
      lessonId: 'lesson-1',
      normalizedQuizData: [
        {
          correctAnswer: 0,
          id: 'question-1',
          options: ['A', 'B'],
          question: 'Pregunta',
        },
      ],
      onQuizSubmitted: () =>
        new Promise<void>((resolve) => {
          events.push('refresh-start')
          resolveRefresh = () => {
            events.push('refresh-end')
            resolve()
          }
        }),
      selectedAnswers: {
        'question-1': 0,
      },
      setServerMessage: vi.fn(),
      setSubmitError: vi.fn(),
      slug: 'course-slug',
    })

    await waitFor(() => {
      expect(events).toEqual(['submit', 'refresh-start'])
    })

    resolveRefresh?.()
    await submissionPromise

    expect(events).toEqual(['submit', 'refresh-start', 'refresh-end'])
  })
})
