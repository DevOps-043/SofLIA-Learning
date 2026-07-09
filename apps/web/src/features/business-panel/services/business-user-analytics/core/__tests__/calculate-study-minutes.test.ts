import { describe, expect, it } from 'vitest'

import { calculateStudyMinutes } from '../calculate-study-minutes'
import type { CourseLessonRecord } from '../course-lesson-record'
import type { DialogueSessionRecord } from '../dialogue-session-record'
import type { LessonActivityRecord } from '../lesson-activity-record'
import type { LessonProgressRecord } from '../lesson-progress-record'
import type { LessonTrackingRecord } from '../lesson-tracking-record'

function courseLesson(overrides: Partial<CourseLessonRecord> = {}): CourseLessonRecord {
  return {
    lesson_id: 'l1',
    duration_seconds: null,
    total_duration_minutes: null,
    course_modules: { course_id: 'c1' },
    ...overrides,
  }
}

function dialogueSession(overrides: Partial<DialogueSessionRecord> = {}): DialogueSessionRecord {
  return {
    session_id: `s-${Math.random().toString(36).slice(2)}`,
    activity_id: 'act-1',
    course_id: 'c1',
    lesson_id: 'l1',
    enrollment_id: 'e1',
    organization_id: 'org-1',
    user_id: 'u1',
    state: 'COMPLETE',
    current_score: 100,
    turns_count: 4,
    completed_at: '2026-06-01T00:10:00.000Z',
    started_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:10:00.000Z',
    active_seconds: 120,
    ...overrides,
  }
}

describe('calculateStudyMinutes', () => {
  it('usa el tiempo real de dialogo con SofLIA cuando no hay progreso ni tracking, aunque la leccion no este completada', () => {
    const total = calculateStudyMinutes(
      [],
      [],
      [courseLesson()],
      [],
      false,
      [dialogueSession({ active_seconds: 300 })], // 300s = 5 min
    )

    expect(total).toBe(5)
  })

  it('el progreso real (time_spent_minutes) gana sobre el tiempo real de dialogo', () => {
    const progress: LessonProgressRecord = {
      progress_id: 'p1',
      enrollment_id: 'e1',
      lesson_id: 'l1',
      organization_id: 'org-1',
      lesson_status: 'completed',
      is_completed: true,
      time_spent_minutes: 12,
      completed_at: '2026-06-01T00:00:00.000Z',
      started_at: null,
      last_activity_submission_at: null,
      last_accessed_at: null,
      updated_at: '2026-06-01T00:00:00.000Z',
      activity_progress_percentage: null,
      quiz_progress_percentage: null,
      quiz_completed: null,
      quiz_passed: null,
      required_activities_completed: null,
      required_activities_total: null,
    }

    const total = calculateStudyMinutes(
      [progress],
      [],
      [courseLesson()],
      [],
      true,
      [dialogueSession({ active_seconds: 3000 })], // 50 min, mucho mayor que el progreso real
    )

    expect(total).toBe(12)
  })

  it('el tracking real gana sobre el tiempo real de dialogo cuando no hay progreso', () => {
    const tracking: LessonTrackingRecord = {
      id: 't1',
      enrollment_id: 'e1',
      lesson_id: 'l1',
      organization_id: 'org-1',
      status: 'completed',
      started_at: null,
      completed_at: '2026-06-01T00:00:00.000Z',
      last_activity_at: null,
      t_lesson_minutes: 8,
      t_video_minutes: null,
      t_materials_minutes: null,
      updated_at: '2026-06-01T00:00:00.000Z',
    }

    const total = calculateStudyMinutes(
      [],
      [tracking],
      [courseLesson()],
      [],
      true,
      [dialogueSession({ active_seconds: 3000 })],
    )

    expect(total).toBe(8)
  })

  it('cae al estimado estatico cuando la leccion completada no tiene tiempo real ni de dialogo', () => {
    const activity: LessonActivityRecord = {
      activity_id: 'act-1',
      lesson_id: 'l1',
      is_required: true,
      estimated_time_minutes: 15,
    }

    const total = calculateStudyMinutes(
      [],
      [],
      [courseLesson()],
      [activity],
      true,
      [],
    )

    expect(total).toBe(15)
  })

  it('ignora sesiones de dialogo sin active_seconds calculado (sesion aun abierta)', () => {
    const total = calculateStudyMinutes(
      [],
      [],
      [courseLesson()],
      [],
      false,
      [dialogueSession({ active_seconds: null })],
    )

    expect(total).toBe(0)
  })
})
