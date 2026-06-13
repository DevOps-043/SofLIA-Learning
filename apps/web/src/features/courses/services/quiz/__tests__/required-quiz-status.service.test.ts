import { describe, expect, it } from 'vitest'

import {
  buildRequiredQuizStatus,
  toRequiredQuizResources,
  type RequiredQuizResource,
  type RequiredQuizSubmission,
} from '../required-quiz-status.service'

describe('buildRequiredQuizStatus', () => {
  it('returns an empty passed status when the lesson has no required quizzes', () => {
    const status = buildRequiredQuizStatus({
      quizzes: [],
      submissions: [],
    })

    expect(status).toEqual({
      allQuizzesPassed: true,
      completedQuizzes: 0,
      hasRequiredQuizzes: false,
      passedQuizzes: 0,
      quizzes: [],
      totalRequiredQuizzes: 0,
    })
  })

  it('tracks a partial approved state', () => {
    const quizzes: RequiredQuizResource[] = [
      { id: 'material-quiz', title: 'Quiz material', type: 'material' },
      { id: 'activity-quiz', title: 'Quiz actividad', type: 'activity', isRequired: true },
    ]
    const submissions: RequiredQuizSubmission[] = [
      {
        completed_at: '2026-06-13T12:00:00.000Z',
        is_passed: true,
        material_id: 'material-quiz',
        percentage_score: 90,
        score: 9,
        submission_id: 'submission-1',
        user_answers: { q1: 1 },
      },
    ]

    const status = buildRequiredQuizStatus({ quizzes, submissions })

    expect(status.hasRequiredQuizzes).toBe(true)
    expect(status.totalRequiredQuizzes).toBe(2)
    expect(status.completedQuizzes).toBe(1)
    expect(status.passedQuizzes).toBe(1)
    expect(status.allQuizzesPassed).toBe(false)
    expect(status.quizzes[0]).toMatchObject({
      id: 'material-quiz',
      isCompleted: true,
      isPassed: true,
      percentage: 90,
      type: 'material',
    })
    expect(status.quizzes[0]?.latestSubmission?.userAnswers).toEqual({ q1: 1 })
    expect(status.quizzes[1]).toMatchObject({
      id: 'activity-quiz',
      isCompleted: false,
      isPassed: false,
      percentage: 0,
      type: 'activity',
    })
  })

  it('marks all required material and activity quizzes as passed', () => {
    const quizzes = toRequiredQuizResources({
      activityQuizzes: [
        { activity_id: 'activity-quiz', activity_title: 'Quiz actividad', is_required: true },
      ],
      materialQuizzes: [
        { material_id: 'material-quiz', material_title: 'Quiz material' },
      ],
    })
    const submissions: RequiredQuizSubmission[] = [
      {
        activity_id: 'activity-quiz',
        completed_at: '2026-06-13T12:01:00.000Z',
        is_passed: true,
        percentage_score: 85,
        score: 17,
        submission_id: 'submission-activity',
      },
      {
        completed_at: '2026-06-13T12:00:00.000Z',
        is_passed: true,
        material_id: 'material-quiz',
        percentage_score: 100,
        score: 10,
        submission_id: 'submission-material',
      },
    ]

    const status = buildRequiredQuizStatus({ quizzes, submissions })

    expect(status.totalRequiredQuizzes).toBe(2)
    expect(status.completedQuizzes).toBe(2)
    expect(status.passedQuizzes).toBe(2)
    expect(status.allQuizzesPassed).toBe(true)
    expect(status.quizzes.map((quiz) => quiz.type)).toEqual(['material', 'activity'])
  })

  it('keeps failed submissions incomplete for the approval rule', () => {
    const status = buildRequiredQuizStatus({
      quizzes: [
        { id: 'activity-quiz', title: 'Quiz actividad', type: 'activity', isRequired: true },
      ],
      submissions: [
        {
          activity_id: 'activity-quiz',
          is_passed: false,
          percentage_score: 70,
          score: 7,
          submission_id: 'submission-failed',
        },
      ],
    })

    expect(status.completedQuizzes).toBe(1)
    expect(status.passedQuizzes).toBe(0)
    expect(status.allQuizzesPassed).toBe(false)
    expect(status.quizzes[0]).toMatchObject({
      isCompleted: true,
      isPassed: false,
      percentage: 70,
    })
  })
})
