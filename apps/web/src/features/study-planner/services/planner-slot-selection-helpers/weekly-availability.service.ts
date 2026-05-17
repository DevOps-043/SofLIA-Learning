import type { StudyPlannerCalendarFreeSlotWithDay } from '../../types/planner-schedule.types'

export function computeWeeklyAvailableMinutes(
  slots: StudyPlannerCalendarFreeSlotWithDay[],
  startDate: Date,
  weeksUntilTarget: number,
  defaultWeeklyMinutes: number,
): number {
  if (slots.length === 0) {
    return defaultWeeklyMinutes
  }

  const effectiveWeeks = Math.max(1, weeksUntilTarget)
  const firstWeeksSlots = slots.filter((slot) => {
    const daysFromStart = Math.floor((slot.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysFromStart >= 0 && daysFromStart < effectiveWeeks * 7
  })

  if (firstWeeksSlots.length > 0) {
    const totalMinutes = firstWeeksSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0)
    return Math.round(totalMinutes / effectiveWeeks)
  }

  const slotsPerWeek = Math.max(1, Math.ceil(slots.length / effectiveWeeks))
  return slots.reduce((sum, slot) => sum + slot.durationMinutes, 0) / slotsPerWeek
}
