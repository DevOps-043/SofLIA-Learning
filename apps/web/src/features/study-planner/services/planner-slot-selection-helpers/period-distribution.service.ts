import type { StudyPlannerCalendarFreeSlotWithDay } from '../../types/planner-schedule.types'

export function distributeSlotsAcrossPeriod(
  slots: StudyPlannerCalendarFreeSlotWithDay[],
  hasOrganizationalDeadlines: boolean,
  isB2BUser: boolean,
  totalLessonsNeeded: number,
): StudyPlannerCalendarFreeSlotWithDay[] {
  if (isB2BUser || hasOrganizationalDeadlines) {
    return slots
  }

  if (slots.length === 0) {
    return []
  }

  const estimatedLessons = Math.max(totalLessonsNeeded, 30)
  const slotsNeeded = Math.ceil(estimatedLessons / 2)
  const slotsToUse = Math.min(slotsNeeded, slots.length)

  if (slotsToUse >= slots.length || slotsToUse <= 1) {
    return slots.slice(0, slotsToUse)
  }

  const selectedSlots: StudyPlannerCalendarFreeSlotWithDay[] = []
  const step = (slots.length - 1) / (slotsToUse - 1)

  for (let index = 0; index < slotsToUse; index += 1) {
    selectedSlots.push(slots[Math.round(index * step)])
  }

  return selectedSlots
}
