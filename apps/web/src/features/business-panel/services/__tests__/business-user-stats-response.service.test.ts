import { describe, expect, it } from 'vitest'
import { buildBusinessUserStatsResponse } from '../business-user-stats-response.service'
import { createAggregatedStatsData } from './business-user-stats-response.aggregation.fixture'
import {
  createEnrollment,
  createStatsData,
} from './business-user-stats-response.fixtures'

describe('business-user-stats-response.service', () => {
  it('builds aggregated user stats, per-course metrics and enriched certificates', () => {
    const response = buildBusinessUserStatsResponse(createAggregatedStatsData())

    expect(response.user.display_name).toBe('Ana Ruiz')
    expect(response.stats.total_courses).toBe(2)
    expect(response.stats.completed_courses).toBe(1)
    expect(response.stats.not_started_courses).toBe(1)
    expect(response.stats.average_progress).toBe(50)
    expect(response.stats.total_time_spent_hours).toBe(1.5)
    expect(response.stats.quiz_average_score).toBe(80)
    expect(response.stats.lia_activities_completed).toBe(1)
    expect(response.courses[0]).toMatchObject({
      course_id: 'course-1',
      course_title: 'Curso A',
      notes_count: 1,
      modules_total: 1,
      lessons_total: 1,
      lessons_completed: 1,
      lia_conversations_count: 1,
      quiz_total: 1,
    })
    expect(response.courses[1]).toMatchObject({
      course_id: 'course-2',
      course_title: 'Curso B',
      progress: 0,
      is_assigned: true,
      assigned_at: '2025-03-01T00:00:00.000Z',
      due_date: '2025-04-01T00:00:00.000Z',
      modules_total: 1,
      lessons_total: 1,
    })
    expect(response.certificates[0].instructor_name).toBe('Laura Pérez')
  })

  it('orders courses by learning path sequence and leaves non-path courses last', () => {
    const response = buildBusinessUserStatsResponse(createStatsData({
      enrollments: [
        createEnrollment('course-1', 'Curso A'),
        createEnrollment('course-2', 'Curso B'),
        createEnrollment('course-3', 'Curso C'),
      ],
      learningPathCourseOrder: new Map([
        ['course-3', 0],
        ['course-1', 1],
      ]),
    }))

    expect(response.courses.map((course) => course.course_id)).toEqual([
      'course-3',
      'course-1',
      'course-2',
    ])
    expect(response.stats.courses_with_lessons.map((course) => course.course_id))
      .toEqual(['course-3', 'course-1', 'course-2'])
  })
})
