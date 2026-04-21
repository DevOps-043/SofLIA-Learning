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

describe('analyzeStudyPlannerSlotCalendar — days range', () => {
  it('analyzes 30 days by default when targetDateObjForEvents is null', () => {
    const result = analyzeStudyPlannerSlotCalendar(makeInput())
    expect(result.daysAnalysis.length).toBe(30)
  })

  it('respects targetDateObjForEvents to limit analyzed days', () => {
    const startDate = ld(2025, 6, 2)
    const targetDate = ld(2025, 6, 4) // 3 days: June 2, 3, 4
    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate }),
    )
    expect(result.daysAnalysis.length).toBe(3)
  })

  it('returns 1 day when target is same as start', () => {
    const startDate = ld(2025, 6, 2)
    const targetDate = ld(2025, 6, 2)
    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate }),
    )
    expect(result.daysAnalysis.length).toBe(1)
  })
})

// ─── Holiday skipping ────────────────────────────────────────────────────────

describe('analyzeStudyPlannerSlotCalendar — holiday skipping', () => {
  it('skips days where HolidayService.isHoliday returns true', () => {
    vi.mocked(HolidayService.isHoliday).mockImplementation((date: Date) => {
      return date.getDate() === 2 && date.getMonth() === 5 // June 2
    })

    const startDate = ld(2025, 6, 2)
    const targetDate = ld(2025, 6, 4)
    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate }),
    )
    // June 2 skipped → only June 3, 4 remain
    expect(result.daysAnalysis.length).toBe(2)
    expect(result.daysAnalysis[0].dateStr).toBe(dateStr(2025, 6, 3))
  })

  it('skips January 1 regardless of HolidayService', () => {
    vi.mocked(HolidayService.isHoliday).mockReturnValue(false)
    const startDate = ld(2025, 1, 1)
    const targetDate = ld(2025, 1, 2)
    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate }),
    )
    const dateStrs = result.daysAnalysis.map((d) => d.dateStr)
    expect(dateStrs).not.toContain('2025-01-01')
  })
})

// ─── Free slots — no events ──────────────────────────────────────────────────

describe('analyzeStudyPlannerSlotCalendar — free slots with no events', () => {
  it('produces 3 free slot ranges for a future day', () => {
    const currentTime = ld(2025, 6, 2, 0, 0) // midnight
    const startDate = ld(2025, 6, 3)          // tomorrow
    const targetDate = ld(2025, 6, 3)
    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ currentTime, startDate, targetDateObjForEvents: targetDate }),
    )
    const day = result.daysAnalysis[0]
    expect(day.freeSlots.length).toBe(3)
    expect(day.totalFreeMinutes).toBeGreaterThan(0)
  })

  it('calculates positive avgFreeHoursPerDay', () => {
    const result = analyzeStudyPlannerSlotCalendar(makeInput())
    expect(parseFloat(result.avgFreeHoursPerDay)).toBeGreaterThan(0)
  })

  it('returns daysWithFreeTime only for days with ≥60 free minutes', () => {
    const result = analyzeStudyPlannerSlotCalendar(makeInput())
    result.daysWithFreeTime.forEach((day) => {
      expect(day.totalFreeMinutes).toBeGreaterThanOrEqual(60)
    })
  })

  it('includes the day in daysWithFreeTime when there is ≥60 min free', () => {
    const startDate = ld(2025, 6, 3)
    const targetDate = ld(2025, 6, 3)
    const currentTime = ld(2025, 6, 2, 0, 0)
    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ currentTime, startDate, targetDateObjForEvents: targetDate }),
    )
    expect(result.daysWithFreeTime.length).toBeGreaterThan(0)
  })
})

// ─── Events filling slots ────────────────────────────────────────────────────

describe('analyzeStudyPlannerSlotCalendar — events filling day', () => {
  it('assigns events to their day slot', () => {
    const startDate = ld(2025, 6, 3)
    const targetDate = ld(2025, 6, 3)
    const event = makeEvent(ld(2025, 6, 3, 9, 0), ld(2025, 6, 3, 11, 0))

    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate, calendarEvents: [event] }),
    )
    const day = result.daysAnalysis[0]
    expect(day.events.length).toBe(1)
    expect(day.totalBusyMinutes).toBe(120)
  })

  it('ignores events outside the analyzed date range', () => {
    const startDate = ld(2025, 6, 3)
    const targetDate = ld(2025, 6, 3)
    const event = makeEvent(ld(2025, 6, 10, 9, 0), ld(2025, 6, 10, 11, 0))

    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate, calendarEvents: [event] }),
    )
    expect(result.daysAnalysis[0].events.length).toBe(0)
  })

  it('merges overlapping busy slots correctly', () => {
    const startDate = ld(2025, 6, 3)
    const targetDate = ld(2025, 6, 3)
    const events = [
      makeEvent(ld(2025, 6, 3, 9, 0), ld(2025, 6, 3, 11, 0)),
      makeEvent(ld(2025, 6, 3, 10, 0), ld(2025, 6, 3, 12, 0)), // overlaps
    ]

    const result = analyzeStudyPlannerSlotCalendar(
      makeInput({ startDate, targetDateObjForEvents: targetDate, calendarEvents: events }),
    )
    const day = result.daysAnalysis[0]
    // Merged → 9:00–12:00 = 180 min
    expect(day.busySlots.length).toBe(1)
    expect(day.totalBusyMinutes).toBe(180)
  })

  it('reduces free minutes when an event occupies morning slot', () => {
    const currentTime = ld(2025, 6, 2, 0, 0)
    const startDate = ld(2025, 6, 3)
    const targetDate = ld(2025, 6, 3)
    const event = makeEvent(ld(2025, 6, 3, 7, 0), ld(2025, 6, 3, 12, 0)) // 5h morning blocked

    const resultWithEvent = analyzeStudyPlannerSlotCalendar(
      makeInput({ currentTime, startDate, targetDateObjForEvents: targetDate, calendarEvents: [event] }),
    )
    const resultFree = analyzeStudyPlannerSlotCalendar(
      makeInput({ currentTime, startDate, targetDateObjForEvents: targetDate }),
    )
    expect(resultWithEvent.daysAnalysis[0].totalFreeMinutes)
      .toBeLessThan(resultFree.daysAnalysis[0].totalFreeMinutes)
  })
})

// ─── All-day events ──────────────────────────────────────────────────────────

