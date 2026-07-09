import { describe, expect, it } from 'vitest'

import { buildResponseStats } from '../response-stats'
import { createStatsData } from '../../__tests__/business-user-stats-response.fixtures'

describe('buildResponseStats — tiempo real de dialogo con SofLIA', () => {
  it('suma (no reemplaza) el tiempo real de dialogo al tiempo de user_lesson_progress', () => {
    const data = createStatsData({
      lessonProgress: [{
        progress_id: 'lp-1',
        lesson_status: 'completed',
        is_completed: true,
        time_spent_minutes: 10,
        completed_at: '2026-06-01T00:00:00.000Z',
        started_at: null,
        enrollment_id: 'enr-1',
        lesson_id: 'lesson-1',
        quiz_progress_percentage: null,
        quiz_completed: null,
        quiz_passed: null,
        video_progress_percentage: null,
        required_activities_completed: null,
        required_activities_total: null,
        user_course_enrollments: { course_id: 'course-1', courses: { id: 'course-1', title: 'Curso A' } },
      }],
      dialogueSessions: [{ active_seconds: 120 }, { active_seconds: 60 }], // 3 min reales
    })

    const stats = buildResponseStats({
      certificates: [],
      coursesData: [],
      coursesWithLessons: [],
      data,
      realLessonsByCourse: new Map(),
    })

    expect(stats.total_time_spent_minutes).toBe(13) // 10 (progreso) + 3 (dialogo)
    expect(stats.total_time_spent_hours).toBe(0.2)
  })

  it('no rompe cuando no hay sesiones de dialogo', () => {
    const data = createStatsData({ lessonProgress: [], dialogueSessions: [] })

    const stats = buildResponseStats({
      certificates: [],
      coursesData: [],
      coursesWithLessons: [],
      data,
      realLessonsByCourse: new Map(),
    })

    expect(stats.total_time_spent_minutes).toBe(0)
  })

  it('ignora sesiones de dialogo sin active_seconds calculado', () => {
    const data = createStatsData({
      lessonProgress: [],
      dialogueSessions: [{ active_seconds: null }],
    })

    const stats = buildResponseStats({
      certificates: [],
      coursesData: [],
      coursesWithLessons: [],
      data,
      realLessonsByCourse: new Map(),
    })

    expect(stats.total_time_spent_minutes).toBe(0)
  })
})
