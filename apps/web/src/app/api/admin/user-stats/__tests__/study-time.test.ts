import { describe, expect, it } from 'vitest'

import {
  buildStudyMinutesByUser,
  buildStudyMinutesByUserLesson,
  getLessonTrackingMinutes,
} from '../study-time'

describe('admin user stats study-time', () => {
  it('prefers explicit progress minutes over tracking and estimates', () => {
    const minutesByUserLesson = buildStudyMinutesByUserLesson({
      courseLessons: [{ lesson_id: 'lesson-1', total_duration_minutes: 30 }],
      lessonProgress: [
        {
          user_id: 'user-1',
          lesson_id: 'lesson-1',
          is_completed: true,
          time_spent_minutes: 12,
        },
      ],
      lessonTracking: [
        {
          user_id: 'user-1',
          lesson_id: 'lesson-1',
          t_lesson_minutes: 20,
        },
      ],
    })

    expect(minutesByUserLesson.get('user-1::lesson-1')).toBe(12)
  })

  it('uses real tracking minutes when progress minutes are missing', () => {
    const minutesByUser = buildStudyMinutesByUser({
      courseLessons: [{ lesson_id: 'lesson-1', total_duration_minutes: 30 }],
      lessonProgress: [],
      lessonTracking: [
        {
          user_id: 'user-1',
          lesson_id: 'lesson-1',
          t_materials_minutes: 5,
          t_video_minutes: 8,
        },
      ],
    })

    expect(minutesByUser.get('user-1')).toBe(13)
  })

  it('falls back to estimated duration only for completed lessons', () => {
    const minutesByUser = buildStudyMinutesByUser({
      courseLessons: [
        { lesson_id: 'completed-lesson', duration_seconds: 900 },
        { lesson_id: 'incomplete-lesson', duration_seconds: 900 },
      ],
      lessonProgress: [
        {
          user_id: 'user-1',
          lesson_id: 'completed-lesson',
          is_completed: true,
        },
        {
          user_id: 'user-1',
          lesson_id: 'incomplete-lesson',
          is_completed: false,
        },
      ],
      lessonTracking: [],
    })

    expect(minutesByUser.get('user-1')).toBe(15)
  })

  it('derives tracking minutes from timestamps as a final real-time source', () => {
    expect(
      getLessonTrackingMinutes({
        user_id: 'user-1',
        lesson_id: 'lesson-1',
        started_at: '2026-06-06T10:00:00.000Z',
        completed_at: '2026-06-06T10:18:30.000Z',
      }),
    ).toBe(18.5)
  })
})
