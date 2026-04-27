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

import { selectStudyPlannerFinalSlots } from '../planner-slot-selection.service'
import { HolidayService } from '../../../../lib/holidays'
import type {
  StudyPlannerCalendarDayAnalysis,
  StudyPlannerCalendarFreeSlot,
  StudyPlannerTargetWindow,
} from '../../types/planner-schedule.types'

// Use local-time constructors — service uses getHours()/getDate() (local time)
function ld(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTargetWindow(overrides: Partial<StudyPlannerTargetWindow> = {}): StudyPlannerTargetWindow {
  return {
    targetDateObj: null,
    weeksUntilTarget: 4,
    bufferDays: 0,
    adjustedTargetDate: null,
    ...overrides,
  }
}

function makeFreeSlot(start: Date, end: Date): StudyPlannerCalendarFreeSlot {
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
  return { start, end, durationMinutes }
}

function makeDay(
  year: number,
  month: number,
  day: number,
  freeSlots: StudyPlannerCalendarFreeSlot[],
  overrides: Partial<StudyPlannerCalendarDayAnalysis> = {},
): StudyPlannerCalendarDayAnalysis {
  const date = ld(year, month, day)
  const dStr = dateKey(year, month, day)
  const totalFreeMinutes = freeSlots.reduce((s, f) => s + f.durationMinutes, 0)
  return {
    date,
    dateStr: dStr,
    dayName: 'Lunes',
    events: [],
    busySlots: [],
    freeSlots,
    totalBusyMinutes: 0,
    totalFreeMinutes,
    heavyEvents: [],
    requiresRestAfter: false,
    restReason: null,
    ...overrides,
  }
}

// currentTime = June 2 2025 08:00 local
const CURRENT_TIME = ld(2025, 6, 2, 8, 0)
const START_DATE = ld(2025, 6, 2)

function makeInput(
  days: StudyPlannerCalendarDayAnalysis[],
  overrides: Partial<Parameters<typeof selectStudyPlannerFinalSlots>[0]> = {},
) {
  return {
    currentTime: CURRENT_TIME,
    daysAnalysis: days,
    hasOrganizationalDeadlines: false,
    profileAvailability: null,
    startDate: START_DATE,
    studyApproach: null,
    targetWindow: makeTargetWindow(),
    totalLessonsNeeded: 20,
    userType: 'b2c' as const,
    ...overrides,
  }
}

beforeEach(() => {
  vi.mocked(HolidayService.isHoliday).mockReturnValue(false)
})

// ─── Empty input ──────────────────────────────────────────────────────────────

describe('selectStudyPlannerFinalSlots — empty input', () => {
  it('returns empty finalSlots for empty daysAnalysis', () => {
    const result = selectStudyPlannerFinalSlots(makeInput([]))
    expect(result.finalSlots).toEqual([])
  })

  it('falls back to profileAvailability.weeklyMinutes when no slots', () => {
    const result = selectStudyPlannerFinalSlots(
      makeInput([], {
        profileAvailability: { weeklyMinutes: 450, recommendedSessionLength: 45, recommendedBreak: 10 },
      }),
    )
    expect(result.weeklyAvailableMinutes).toBe(450)
  })

  it('returns 300 weeklyAvailableMinutes by default when no slots and no profileAvailability', () => {
    const result = selectStudyPlannerFinalSlots(makeInput([]))
    expect(result.weeklyAvailableMinutes).toBe(300)
  })
})

describe('selectStudyPlannerFinalSlots - sunday eligibility', () => {
  it('excludes free sundays without work blocks', () => {
    const sundaySlot = makeFreeSlot(ld(2025, 6, 8, 9, 0), ld(2025, 6, 8, 11, 0))
    const sunday = makeDay(2025, 6, 8, [sundaySlot], { dayName: 'Domingo' })

    const result = selectStudyPlannerFinalSlots(makeInput([sunday]))

    expect(result.finalSlots).toHaveLength(0)
  })

  it('allows sundays with detected work blocks', () => {
    const sundaySlot = makeFreeSlot(ld(2025, 6, 8, 9, 0), ld(2025, 6, 8, 11, 0))
    const sunday = makeDay(2025, 6, 8, [sundaySlot], {
      dayName: 'Domingo',
      hasWorkBlock: true,
    })

    const result = selectStudyPlannerFinalSlots(makeInput([sunday]))

    expect(result.finalSlots.length).toBeGreaterThan(0)
  })

  it('keeps non-sunday free days eligible', () => {
    const mondaySlot = makeFreeSlot(ld(2025, 6, 9, 9, 0), ld(2025, 6, 9, 11, 0))
    const monday = makeDay(2025, 6, 9, [mondaySlot], { dayName: 'Lunes' })

    const result = selectStudyPlannerFinalSlots(makeInput([monday]))

    expect(result.finalSlots.length).toBeGreaterThan(0)
  })
})

// ─── Past slots filtered out ──────────────────────────────────────────────────

describe('selectStudyPlannerFinalSlots — past slots filtered', () => {
  it('excludes slots that have already passed (yesterday)', () => {
    // June 1 09:00–11:00 — before currentTime June 2 08:00
    const slot = makeFreeSlot(ld(2025, 6, 1, 9, 0), ld(2025, 6, 1, 11, 0))
    const day = makeDay(2025, 6, 1, [slot])
    const result = selectStudyPlannerFinalSlots(makeInput([day]))
    expect(result.finalSlots).toHaveLength(0)
  })

  it('includes slots on a future day (hours 09:00–11:00 local)', () => {
    // June 4 09:00–11:00 — future, morning hours pass the >=7 filter
    const slot = makeFreeSlot(ld(2025, 6, 4, 9, 0), ld(2025, 6, 4, 11, 0))
    const day = makeDay(2025, 6, 4, [slot])
    const result = selectStudyPlannerFinalSlots(makeInput([day]))
    expect(result.finalSlots.length).toBeGreaterThan(0)
  })

  it('excludes same-day slots that start before currentTime', () => {
    // June 2 07:00–08:30 — starts before currentTime (08:00)
    const slot = makeFreeSlot(ld(2025, 6, 2, 7, 0), ld(2025, 6, 2, 8, 30))
    const day = makeDay(2025, 6, 2, [slot])
    const result = selectStudyPlannerFinalSlots(makeInput([day]))
    expect(result.finalSlots).toHaveLength(0)
  })

  it('includes same-day slots that start after currentTime', () => {
    // June 2 10:00–12:00 — starts after currentTime (08:00)
    const slot = makeFreeSlot(ld(2025, 6, 2, 10, 0), ld(2025, 6, 2, 12, 0))
    const day = makeDay(2025, 6, 2, [slot])
    const result = selectStudyPlannerFinalSlots(makeInput([day]))
    expect(result.finalSlots.length).toBeGreaterThan(0)
  })
})

// ─── Holiday filtering ────────────────────────────────────────────────────────

describe('selectStudyPlannerFinalSlots — holiday filtering', () => {
  it('excludes slots on holiday days', () => {
    vi.mocked(HolidayService.isHoliday).mockReturnValue(true)
    const slot = makeFreeSlot(ld(2025, 6, 4, 9, 0), ld(2025, 6, 4, 11, 0))
    const day = makeDay(2025, 6, 4, [slot])
    const result = selectStudyPlannerFinalSlots(makeInput([day]))
    expect(result.finalSlots).toHaveLength(0)
  })
})

// ─── requiresRestAfter ────────────────────────────────────────────────────────

describe('selectStudyPlannerFinalSlots — requiresRestAfter skipped', () => {
  it('excludes days marked requiresRestAfter', () => {
    const slot = makeFreeSlot(ld(2025, 6, 4, 9, 0), ld(2025, 6, 4, 11, 0))
    const day = makeDay(2025, 6, 4, [slot], { requiresRestAfter: true })
    const result = selectStudyPlannerFinalSlots(makeInput([day]))
    expect(result.finalSlots).toHaveLength(0)
  })
})

// ─── Minimum slot duration ───────────────────────────────────────────────────

describe('selectStudyPlannerFinalSlots — minimum slot duration', () => {
  it('excludes slots shorter than 25 minutes (MIN_SLOT_DURATION)', () => {
    // 20-min slot
    const slot = makeFreeSlot(ld(2025, 6, 4, 9, 0), ld(2025, 6, 4, 9, 20))
    const day = makeDay(2025, 6, 4, [slot])
    const result = selectStudyPlannerFinalSlots(makeInput([day]))
    expect(result.finalSlots).toHaveLength(0)
  })

  it('includes slots of 60+ minutes', () => {
    // 90-min slot
    const slot = makeFreeSlot(ld(2025, 6, 4, 9, 0), ld(2025, 6, 4, 10, 30))
    const day = makeDay(2025, 6, 4, [slot])
    const result = selectStudyPlannerFinalSlots(makeInput([day]))
    expect(result.finalSlots.length).toBeGreaterThan(0)
  })
})

// ─── B2B vs B2C slot cap ──────────────────────────────────────────────────────

describe('selectStudyPlannerFinalSlots — per-day slot cap', () => {
  function buildDayWithManySlots(y: number, m: number, d: number, count: number): StudyPlannerCalendarDayAnalysis {
    // Spread slots across the day, each 90 min, starting from 07:00
    const slots = Array.from({ length: count }, (_, i) => {
      const startH = 7 + i * 2
      return makeFreeSlot(ld(y, m, d, startH, 0), ld(y, m, d, startH + 1, 30))
    }).filter((s) => s.start.getHours() < 20) // keep within bounds
    return makeDay(y, m, d, slots)
  }

  it('caps at 2 slots per day for b2c users', () => {
    const day = buildDayWithManySlots(2025, 6, 4, 6)
    const result = selectStudyPlannerFinalSlots(makeInput([day], { userType: 'b2c' }))
    const daySlots = result.finalSlots.filter((s) => s.dateStr === dateKey(2025, 6, 4))
    expect(daySlots.length).toBeLessThanOrEqual(2)
  })

  it('caps at 4 slots per day for b2b users', () => {
    const day = buildDayWithManySlots(2025, 6, 4, 6)
    const result = selectStudyPlannerFinalSlots(makeInput([day], { userType: 'b2b' }))
    const daySlots = result.finalSlots.filter((s) => s.dateStr === dateKey(2025, 6, 4))
    expect(daySlots.length).toBeLessThanOrEqual(4)
  })

  it('b2b allows more slots per day than b2c when many slots available', () => {
    const day = buildDayWithManySlots(2025, 6, 4, 6)
    const b2cResult = selectStudyPlannerFinalSlots(makeInput([day], { userType: 'b2c' }))
    const b2bResult = selectStudyPlannerFinalSlots(makeInput([day], { userType: 'b2b' }))
    const b2cCount = b2cResult.finalSlots.filter((s) => s.dateStr === dateKey(2025, 6, 4)).length
    const b2bCount = b2bResult.finalSlots.filter((s) => s.dateStr === dateKey(2025, 6, 4)).length
    expect(b2cCount).toBeLessThanOrEqual(b2bCount)
  })
})

// ─── targetWindow date cutoff ─────────────────────────────────────────────────
