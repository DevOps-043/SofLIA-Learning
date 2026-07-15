import { describe, expect, it } from 'vitest'

import { buildAiAdoption } from '../build-ai-adoption'
import { buildBusinessUserAnalyticsPeriod } from '../build-business-user-analytics-period'
import type { DialogueTurnRecord } from '../dialogue-turn-record'
import type { QueryData } from '../query-data'

const PERIOD = buildBusinessUserAnalyticsPeriod('365d')

function queryData(overrides: Partial<QueryData> = {}): QueryData {
  return {
    assignments: [],
    enrollments: [],
    courseLessons: [],
    lessonActivities: [],
    lessonProgress: [],
    activitySubmissions: [],
    activityCompletions: [],
    activityEvaluations: [],
    dialogueResults: [],
    dialogueSessions: [],
    dialogueTurns: [],
    liaConversations: [],
    liaMessages: [],
    lessonNotes: [],
    quizSubmissions: [],
    quizAttempts: [],
    quizLessonIds: [],
    certificates: [],
    userSessions: [],
    lessonTracking: [],
    ...overrides,
  }
}

function turn(sessionId: string, role: string): DialogueTurnRecord {
  return { session_id: sessionId, role, created_at: '2026-06-01T00:00:00.000Z' }
}

describe('buildAiAdoption con conversaciones de diálogo', () => {
  it('cuenta las sesiones de diálogo como uso de SofLIA cuando no hay LIA legacy', () => {
    const data = queryData({
      assignments: [{ course_id: 'c1' } as never],
      dialogueTurns: [
        turn('s1', 'assistant'),
        turn('s1', 'user'),
        turn('s1', 'assistant'),
        turn('s2', 'assistant'),
        turn('s2', 'user'),
      ],
    })

    const adoption = buildAiAdoption(data, PERIOD)

    // 2 sesiones con turno de usuario = 2 conversaciones; 5 turnos = 5 mensajes.
    expect(adoption.totalConversations).toBe(2)
    expect(adoption.totalMessages).toBe(5)
    expect(adoption.userMessages).toBe(2)
    expect(adoption.adoptionScore).toBeGreaterThan(0)
  })

  it('ignora sesiones de diálogo sin turno de usuario para el conteo de conversaciones', () => {
    const data = queryData({
      assignments: [{ course_id: 'c1' } as never],
      dialogueTurns: [turn('s1', 'assistant'), turn('s1', 'assistant')],
    })

    const adoption = buildAiAdoption(data, PERIOD)

    expect(adoption.totalConversations).toBe(0)
    expect(adoption.totalMessages).toBe(2)
  })
})
