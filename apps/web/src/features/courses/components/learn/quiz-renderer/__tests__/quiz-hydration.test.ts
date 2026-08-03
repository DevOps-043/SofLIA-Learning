import { describe, expect, it } from 'vitest'

import { buildHydratedQuizState } from '../quiz-hydration'

describe('quiz hydration', () => {
  it('keeps authoritative earned points when the client answer key is sanitized', () => {
    const state = buildHydratedQuizState(
      [
        {
          id: 'q1',
          question: 'Primera',
          options: ['A', 'B'],
          correctAnswer: '',
          points: 1,
        },
        {
          id: 'q2',
          question: 'Segunda',
          options: ['A', 'B'],
          correctAnswer: '',
          points: 1,
        },
        {
          id: 'q3',
          question: 'Tercera',
          options: ['A', 'B'],
          correctAnswer: '',
          points: 1,
        },
      ],
      {
        completedAt: '2026-08-03T20:25:53.000Z',
        id: 'material-quiz',
        isCompleted: true,
        isPassed: true,
        latestSubmission: {
          completedAt: '2026-08-03T20:25:53.000Z',
          pointsEarned: 3,
          score: 3,
          submissionId: 'submission-1',
          userAnswers: { q1: 'A', q2: 'B', q3: 'A' },
        },
        percentage: 100,
        title: 'Quiz final',
        type: 'material',
      },
    )

    expect(state.score).toBe(3)
    expect(state.pointsEarned).toBe(3)
  })
})
