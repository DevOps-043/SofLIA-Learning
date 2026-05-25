import type { StudyPlannerCalendarFreeSlotWithDay } from '../../types/planner-schedule.types'

export function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

export function isUpcomingSlot(slot: StudyPlannerCalendarFreeSlotWithDay, currentTime: Date): boolean {
  const slotDate = new Date(slot.date)
  slotDate.setHours(0, 0, 0, 0)
  const today = new Date(currentTime)
  today.setHours(0, 0, 0, 0)

  if (slotDate.getTime() > today.getTime()) {
    return true
  }

  if (slotDate.getTime() === today.getTime()) {
    return slot.start.getTime() > currentTime.getTime()
  }

  return false
}

export function sortSlotsByQuality(
  slotA: StudyPlannerCalendarFreeSlotWithDay,
  slotB: StudyPlannerCalendarFreeSlotWithDay,
): number {
  const durationA = slotA.durationMinutes
  const durationB = slotB.durationMinutes
  const isIdealDurationA = durationA >= 60 && durationA <= 180
  const isIdealDurationB = durationB >= 60 && durationB <= 180

  if (isIdealDurationA && !isIdealDurationB) {
    return -1
  }

  if (!isIdealDurationA && isIdealDurationB) {
    return 1
  }

  const hourA = slotA.start.getHours()
  const hourB = slotB.start.getHours()
  const isGoodTimeA = (hourA >= 7 && hourA < 12) || (hourA >= 12 && hourA < 18) || (hourA >= 18 && hourA < 22)
  const isGoodTimeB = (hourB >= 7 && hourB < 12) || (hourB >= 12 && hourB < 18) || (hourB >= 18 && hourB < 22)

  if (isGoodTimeA && !isGoodTimeB) {
    return -1
  }

  if (!isGoodTimeA && isGoodTimeB) {
    return 1
  }

  return durationB - durationA
}
