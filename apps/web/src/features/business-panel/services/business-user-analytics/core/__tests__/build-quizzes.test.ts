import { describe, expect, it } from 'vitest'

import { buildQuizzes } from '../build-quizzes'
import { buildBusinessUserAnalyticsPeriod } from '../build-business-user-analytics-period'
import type { LessonProgressRecord } from '../lesson-progress-record'
import type { QuizAttemptRecord } from '../quiz-attempt-record'
import type { QueryData } from '../query-data'

const PERIOD = buildBusinessUserAnalyticsPeriod('365d')

function progress(overrides: Partial<LessonProgressRecord> = {}): LessonProgressRecord {
  return {
    progress_id: `p-${Math.random().toString(36).slice(2)}`,
    enrollment_id: 'e1',
    lesson_id: `l-${Math.random().toString(36).slice(2)}`,
    organization_id: 'org-1',
    lesson_status: 'completed',
    is_completed: true,
    time_spent_minutes: 0,
    completed_at: '2026-06-01T00:00:00.000Z',
    started_at: null,
    last_activity_submission_at: null,
    last_accessed_at: null,
    updated_at: '2026-06-01T00:00:00.000Z',
    activity_progress_percentage: null,
    quiz_progress_percentage: overrides.quiz_progress_percentage ?? null,
    quiz_completed: overrides.quiz_completed ?? null,
    quiz_passed: overrides.quiz_passed ?? null,
    required_activities_completed: null,
    required_activities_total: null,
    ...overrides,
  }
}

function attempt(attemptNumber: number, isPassed: boolean): QuizAttemptRecord {
  return {
    attempt_id: `a-${Math.random().toString(36).slice(2)}`,
    lesson_id: 'l1',
    enrollment_id: 'e1',
    percentage_score: isPassed ? 100 : 40,
    is_passed: isPassed,
    attempt_number: attemptNumber,
    created_at: '2026-06-01T00:00:00.000Z',
  }
}

function queryData(overrides: Partial<QueryData> = {}): QueryData {
  return {
    assignments: [], enrollments: [], courseLessons: [], lessonActivities: [],
    lessonProgress: [], activitySubmissions: [], activityCompletions: [], activityEvaluations: [],
    dialogueResults: [], dialogueSessions: [], dialogueTurns: [], liaConversations: [], liaMessages: [],
    lessonNotes: [], quizSubmissions: [], quizAttempts: [], quizLessonIds: [],
    certificates: [], userSessions: [], lessonTracking: [],
    ...overrides,
  }
}

describe('buildQuizzes', () => {
  it('mide presentados/aprobados/promedio desde el progreso, no desde submissions', () => {
    const data = queryData({
      quizLessonIds: ['l1', 'l2', 'l3', 'l4'], // 4 lecciones con quiz
      lessonProgress: [
        progress({ quiz_completed: true, quiz_passed: true, quiz_progress_percentage: 100 }),
        progress({ quiz_completed: true, quiz_passed: true, quiz_progress_percentage: 80 }),
        progress({ quiz_completed: true, quiz_passed: false, quiz_progress_percentage: 60 }),
        progress({ quiz_completed: false, quiz_passed: false, quiz_progress_percentage: 0 }),
      ],
    })

    const result = buildQuizzes(data, PERIOD)

    expect(result.lessonsWithQuiz).toBe(4)
    expect(result.quizzesTaken).toBe(3) // quiz_completed
    expect(result.quizzesPassed).toBe(2) // quiz_passed
    expect(result.passRate).toBe(66.7) // 2/3 redondeado a 1 decimal
    expect(result.averageScore).toBe(80) // avg(100,80,60)
  })

  it('cuenta intentos totales y reintentos desde user_quiz_attempts', () => {
    const data = queryData({
      quizLessonIds: ['l1'],
      lessonProgress: [progress({ quiz_completed: true, quiz_passed: true, quiz_progress_percentage: 100 })],
      quizAttempts: [attempt(1, false), attempt(2, false), attempt(3, true)],
    })

    const result = buildQuizzes(data, PERIOD)

    expect(result.totalAttempts).toBe(3)
    expect(result.retries).toBe(2) // attempt_number > 1
    // primer intento (1) no aprobado -> firstTryPassRate 0
    expect(result.firstTryPassRate).toBe(0)
  })
})
