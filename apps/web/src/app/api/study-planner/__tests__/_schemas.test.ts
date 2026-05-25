import { describe, expect, it } from 'vitest'

import {
  calendarSelectionSchema,
  lessonTrackingCompleteSchema,
  savePlanSchema,
  studyPlanApplyPatchSchema,
  syncSessionsSchema,
} from '../_schemas'

describe('study planner route schemas', () => {
  it('requires at least one selected calendar id', () => {
    expect(calendarSelectionSchema.safeParse({
      selectedCalendarIds: [],
      provider: 'google',
    }).success).toBe(false)

    expect(calendarSelectionSchema.safeParse({
      selectedCalendarIds: ['primary'],
      provider: 'google',
    }).success).toBe(true)
  })

  it('requires a tracking id or lesson id to complete lesson tracking', () => {
    expect(lessonTrackingCompleteSchema.safeParse({
      endTrigger: 'manual',
    }).success).toBe(false)

    expect(lessonTrackingCompleteSchema.safeParse({
      lessonId: 'lesson-1',
      endTrigger: 'manual',
    }).success).toBe(true)
  })

  it('normalizes sync session ids through the existing parser', () => {
    const parsed = syncSessionsSchema.parse({
      sessionIds: [' session-1 ', 'session-1', 'session-2'],
    })

    expect(parsed.sessionIds).toEqual(['session-1', 'session-2'])
  })

  it('parses study plan patch operations through the existing parser', () => {
    const parsed = studyPlanApplyPatchSchema.parse({
      planId: 'plan-1',
      operations: [{
        type: 'move_session',
        clientReferenceId: 'client-1',
        targetDate: '2026-05-20',
        targetStartTime: '09:00',
        targetEndTime: '10:00',
      }],
    })

    expect(parsed.operations[0]).toMatchObject({
      type: 'move_session',
      clientReferenceId: 'client-1',
    })
  })

  it('accepts the lightweight save-plan session payload used by the client', () => {
    const parsed = savePlanSchema.safeParse({
      config: {
        name: 'Plan IA',
        userType: 'b2c',
        courseIds: ['course-1'],
        goalHoursPerWeek: 5,
        timezone: 'America/Mexico_City',
        preferredDays: [1, 2, 3],
        preferredTimeBlocks: [{
          startHour: 9,
          startMinute: 0,
          endHour: 10,
          endMinute: 0,
        }],
        minSessionMinutes: 20,
        maxSessionMinutes: 50,
        breakDurationMinutes: 10,
        preferredSessionType: 'medium',
        generationMode: 'ai_generated',
        calendarAnalyzed: false,
      },
      sessions: [{
        clientReferenceId: 'client-1',
        title: 'Sesion de estudio',
        description: 'Repaso',
        courseId: 'course-1',
        startTime: '2026-05-20T09:00:00.000Z',
        endTime: '2026-05-20T10:00:00.000Z',
        isAiGenerated: true,
        sessionType: 'medium',
      }],
    })

    expect(parsed.success).toBe(true)
  })
})
