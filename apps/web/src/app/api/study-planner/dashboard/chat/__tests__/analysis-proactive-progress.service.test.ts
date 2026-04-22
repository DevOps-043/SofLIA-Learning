import { describe, expect, it } from 'vitest'
import { addWeeklyProgressInsights } from '../analysis-proactive-progress.service'
import type { ProactiveAnalysis } from '../types'

function createAnalysis(): ProactiveAnalysis {
  return {
    conflicts: [],
    overloadedDays: [],
    missedSessions: [],
    overdueSessions: [],
    effectivelyCompletedSessions: [],
    partialSessions: [],
    freeSlots: [],
    weeklyProgress: {
      plannedMinutes: 0,
      completedMinutes: 0,
      remainingMinutes: 0,
      overdueMinutes: 0,
      upcomingMinutes: 0,
      onTrack: true,
      status: 'neutral',
      suggestion: '',
    },
    consistencyAlert: null,
    burnoutRisk: null,
    patterns: {
      frequentRescheduleTime: null,
      preferredStudyTime: null,
      suggestion: null,
    },
  }
}

describe('analysis-proactive-progress.service', () => {
  it('keeps a fresh weekly plan in neutral mode when no session is overdue', () => {
    const analysis = createAnalysis()
    const now = new Date('2026-04-22T09:00:00-06:00')
    const todayStart = new Date('2026-04-22T00:00:00-06:00')

    addWeeklyProgressInsights({
      analysis,
      now,
      todayStart,
      activeSessions: [
        {
          id: 'session-1',
          title: 'Sesion futura',
          start_time: '2026-04-22T16:00:00-06:00',
          end_time: '2026-04-22T17:00:00-06:00',
          status: 'planned',
          duration_minutes: 60,
          plan_id: 'plan-1',
        },
      ],
    })

    expect(analysis.weeklyProgress.onTrack).toBe(true)
    expect(analysis.weeklyProgress.status).toBe('neutral')
    expect(analysis.weeklyProgress.suggestion).toContain('no hay evidencia de atraso')
  })

  it('marks progress as actionable only when there are overdue minutes', () => {
    const analysis = createAnalysis()
    const now = new Date('2026-04-22T14:00:00-06:00')
    const todayStart = new Date('2026-04-22T00:00:00-06:00')

    addWeeklyProgressInsights({
      analysis,
      now,
      todayStart,
      activeSessions: [
        {
          id: 'session-1',
          title: 'Sesion vencida',
          start_time: '2026-04-22T08:00:00-06:00',
          end_time: '2026-04-22T09:00:00-06:00',
          status: 'planned',
          duration_minutes: 60,
          plan_id: 'plan-1',
        },
      ],
    })

    expect(analysis.weeklyProgress.onTrack).toBe(false)
    expect(analysis.weeklyProgress.status).toBe('actionable')
    expect(analysis.weeklyProgress.overdueMinutes).toBe(60)
    expect(analysis.weeklyProgress.suggestion).toContain('sin romper el orden de lecciones')
  })
})
