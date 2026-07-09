import { describe, expect, it } from 'vitest'

import {
  buildDialogueMinutesByLesson,
  buildStudyMinutesByUser,
  buildStudyMinutesByUserLesson,
  getLessonTrackingMinutes,
  resolveStudyMinutes,
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

  describe('resolveStudyMinutes with real SofLIA dialogue time', () => {
    it('uses real dialogue minutes over the static estimate even when the lesson is not completed', () => {
      expect(
        resolveStudyMinutes({
          completed: false,
          estimatedMinutes: 15,
          progressMinutes: 0,
          realDialogueMinutes: 4,
          trackingMinutes: 0,
        }),
      ).toBe(4)
    })

    it('progress minutes still win over real dialogue minutes', () => {
      expect(
        resolveStudyMinutes({
          completed: true,
          estimatedMinutes: 15,
          progressMinutes: 9,
          realDialogueMinutes: 50,
          trackingMinutes: 0,
        }),
      ).toBe(9)
    })

    it('tracking minutes still win over real dialogue minutes', () => {
      expect(
        resolveStudyMinutes({
          completed: true,
          estimatedMinutes: 15,
          progressMinutes: 0,
          realDialogueMinutes: 50,
          trackingMinutes: 7,
        }),
      ).toBe(7)
    })

    it('falls back to the static estimate when there is no real dialogue time and the lesson is completed', () => {
      expect(
        resolveStudyMinutes({
          completed: true,
          estimatedMinutes: 15,
          progressMinutes: 0,
          realDialogueMinutes: 0,
          trackingMinutes: 0,
        }),
      ).toBe(15)
    })
  })

  describe('buildDialogueMinutesByLesson', () => {
    it('sums active_seconds per lesson and converts to minutes', () => {
      const minutesByLesson = buildDialogueMinutesByLesson([
        { lesson_id: 'lesson-1', active_seconds: 120 },
        { lesson_id: 'lesson-1', active_seconds: 60 },
        { lesson_id: 'lesson-2', active_seconds: 30 },
      ])

      expect(minutesByLesson.get('lesson-1')).toBe(3)
      expect(minutesByLesson.get('lesson-2')).toBe(0.5)
    })

    it('ignores sessions without a lesson_id or without a computed active_seconds', () => {
      const minutesByLesson = buildDialogueMinutesByLesson([
        { lesson_id: null, active_seconds: 300 },
        { lesson_id: 'lesson-1', active_seconds: null },
      ])

      expect(minutesByLesson.size).toBe(0)
    })
  })
})
