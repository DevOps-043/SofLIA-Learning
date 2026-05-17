import type { PlanningWindow } from './organization-planner-config.types'

export function isDateWithinPlanningWindow(
  date: Date,
  window: PlanningWindow,
): boolean {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)

  const windowStart = new Date(window.startDate)
  windowStart.setHours(0, 0, 0, 0)

  const windowEnd = new Date(window.endDate)
  windowEnd.setHours(23, 59, 59, 999)

  return dayStart >= windowStart && dayStart <= windowEnd
}
