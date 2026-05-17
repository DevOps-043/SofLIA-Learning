import type {
  StudyPlannerCalendarDayAnalysis,
  StudyPlannerCalendarFreeSlotWithDay,
} from '../../types/planner-schedule.types'
import { canUseSunday } from '../sunday-eligibility.service'
import { isUpcomingSlot, sortSlotsByQuality } from './slot-date.utils'

export function buildCandidateSlots(
  daysAnalysis: StudyPlannerCalendarDayAnalysis[],
  currentTime: Date,
  minimumSessionDuration: number,
): StudyPlannerCalendarFreeSlotWithDay[] {
  const slotsByDay = new Map<string, StudyPlannerCalendarFreeSlotWithDay[]>()

  daysAnalysis.forEach((day) => {
    if (day.requiresRestAfter) {
      return
    }

    if (!canUseSunday({ date: day.date, events: day.events, hasWorkBlock: day.hasWorkBlock })) {
      return
    }

    const validSlots = day.freeSlots
      .filter((slot) => slot.durationMinutes >= minimumSessionDuration && slot.durationMinutes <= 360)
      .map((slot) => ({
        ...slot,
        dayName: day.dayName,
        dateStr: day.dateStr,
        date: day.date,
        requiresRest: day.requiresRestAfter,
        restReason: day.restReason,
      }))
      .filter((slot) => isUpcomingSlot(slot, currentTime))
      .sort(sortSlotsByQuality)

    if (validSlots.length > 0) {
      slotsByDay.set(day.dateStr, validSlots.slice(0, 3))
    }
  })

  return Array.from(slotsByDay.entries())
    .sort((dayA, dayB) => new Date(dayA[0]).getTime() - new Date(dayB[0]).getTime())
    .flatMap(([, slots]) => slots)
}
