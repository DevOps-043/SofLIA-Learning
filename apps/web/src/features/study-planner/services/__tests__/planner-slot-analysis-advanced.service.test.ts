import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

vi.mock('../../../../lib/holidays', () => ({
  HolidayService: {
    isHoliday: vi.fn(() => false),
    isSameDay: vi.fn((a: Date, b: Date) => {
      const da = new Date(a); da.setHours(0, 0, 0, 0)
      const db = new Date(b); db.setHours(0, 0, 0, 0)
      return da.getTime() === db.getTime()
    }),
  },
}))

vi.mock('../planner-calendar-analysis.service', () => ({
  analyzeStudyPlannerEventContext: vi.fn(() => ({
    requiresRestAfter: false,
    description: null,
    type: 'other',
    mentalFatigue: 'low',
  })),
  calculateStudyPlannerEstimatedAvailability: vi.fn(() => null),
}))

import { analyzeStudyPlannerSlotCalendar } from '../planner-slot-analysis.service'
import { HolidayService } from '../../../../lib/holidays'
import {
  analyzeStudyPlannerEventContext,
  calculateStudyPlannerEstimatedAvailability,
} from '../planner-calendar-analysis.service'
import type { StudyPlannerCalendarEventLike } from '../../types/planner-schedule.types'

// Use local-time constructors to avoid timezone issues — service uses getDate/getHours (local)
function ld(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

// Fixed reference: June 2 2025 10:00 local
const REF_DATE = ld(2025, 6, 2, 10, 0)

function makeInput(overrides: Partial<Parameters<typeof analyzeStudyPlannerSlotCalendar>[0]> = {}) {
  const startDate = ld(2025, 6, 2)
  return {
    calendarEvents: [],
    currentTime: REF_DATE,
    effectiveApproach: null,
    effectiveTargetDate: null,
    startDate,
    targetDateObjForEvents: null,
    userProfile: null,
    ...overrides,
  }
}

function makeEvent(
  start: Date,
  end: Date,
  overrides: Partial<StudyPlannerCalendarEventLike> = {},
): StudyPlannerCalendarEventLike {
  return { start, end, ...overrides }
}

function dateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

beforeEach(() => {
  vi.mocked(HolidayService.isHoliday).mockReturnValue(false)
  vi.mocked(analyzeStudyPlannerEventContext).mockReturnValue({
    requiresRestAfter: false,
    description: null,
    type: 'other',
    mentalFatigue: 'low',
  })
  vi.mocked(calculateStudyPlannerEstimatedAvailability).mockReturnValue(null)
})

// ─── Days range ─────────────────────────────────────────────────────────────

describe('analyzeStudyPlannerSlotCalendar — all-day events', () => {
  it('blocks busy slots for all-day events', () => {
    const startDate = ld(2025, 6, 3)
    const targetDate = ld(2025, 6, 3)
    const event: StudyPlannerCalendarEventLike = {
      start: ld(2025, 6, 3),
      end: ld(2025, 6, 3),
      isAllDay: true,
    }

    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate, calendarEvents: [event] }),
    )
    const day = result.daysAnalysis[0]
    expect(day.busySlots.length).toBeGreaterThan(0)
    expect(day.events.length).toBe(1)
  })
})

// ─── requiresRestAfter propagation ──────────────────────────────────────────

describe('analyzeStudyPlannerSlotCalendar — rest propagation', () => {
  it('marks the day after a heavy event as requiresRestAfter', () => {
    vi.mocked(analyzeStudyPlannerEventContext).mockReturnValue({
      requiresRestAfter: true,
      description: 'evento intenso',
      type: 'intensive',
      mentalFatigue: 'high',
    })

    const startDate = ld(2025, 6, 3)
    const targetDate = ld(2025, 6, 5)
    const event = makeEvent(ld(2025, 6, 3, 9, 0), ld(2025, 6, 3, 11, 0))

    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate, calendarEvents: [event] }),
    )

    const june4 = result.daysAnalysis.find((d) => d.dateStr === dateStr(2025, 6, 4))
    expect(june4?.requiresRestAfter).toBe(true)
    expect(june4?.restReason).toContain('evento intenso')
  })
})

// ─── busiestDays ─────────────────────────────────────────────────────────────

describe('analyzeStudyPlannerSlotCalendar — busiestDays', () => {
  it('returns at most 3 day names sorted by total busy minutes desc', () => {
    const startDate = ld(2025, 6, 2) // Monday
    const targetDate = ld(2025, 6, 8)

    // 4h event on June 2 (Monday)
    const event = makeEvent(ld(2025, 6, 2, 8, 0), ld(2025, 6, 2, 12, 0))

    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ currentTime: startDate, startDate, targetDateObjForEvents: targetDate, calendarEvents: [event] }),
    )
    expect(result.busiestDays.length).toBeLessThanOrEqual(3)
    // Monday has most busy time
    expect(result.busiestDays[0]).toBe('Lunes')
  })

  it('returns no more than 3 entries', () => {
    const result = analyzeStudyPlannerSlotCalendar(makeInput())
    expect(result.busiestDays.length).toBeLessThanOrEqual(3)
  })
})

// ─── calendarDataToSave ───────────────────────────────────────────────────────

describe('analyzeStudyPlannerSlotCalendar — calendarDataToSave', () => {
  it('produces keys matching dateStr for each analyzed day', () => {
    const startDate = ld(2025, 6, 3)
    const targetDate = ld(2025, 6, 5)
    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate }),
    )
    const keys = Object.keys(result.calendarDataToSave).sort()
    expect(keys).toEqual([dateStr(2025, 6, 3), dateStr(2025, 6, 4), dateStr(2025, 6, 5)])
  })
})

// ─── profileAvailability ─────────────────────────────────────────────────────

describe('analyzeStudyPlannerSlotCalendar — profileAvailability', () => {
  it('returns null when userProfile is null', () => {
    const result = analyzeStudyPlannerSlotCalendar(makeInput({ userProfile: null }))
    expect(result.profileAvailability).toBeNull()
  })

  it('calls calculateStudyPlannerEstimatedAvailability when userProfile provided', () => {
    const mockResult = { weeklyMinutes: 300, recommendedSessionLength: 45, recommendedBreak: 10 }
    vi.mocked(calculateStudyPlannerEstimatedAvailability).mockReturnValue(
      mockResult as ReturnType<typeof calculateStudyPlannerEstimatedAvailability>,
    )

    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ userProfile: { userType: 'b2b' } }),
    )
    expect(calculateStudyPlannerEstimatedAvailability).toHaveBeenCalled()
    expect(result.profileAvailability).toEqual(mockResult)
  })
})
