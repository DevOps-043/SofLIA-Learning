import type { StudyPlannerStoredLessonDistribution } from '../../types/planner-schedule.types'
import { HOLIDAY_SUFFIXES } from './constants'
import type { GroupedDistributionDay } from './types'

export function countAssignedLessons(distribution: StudyPlannerStoredLessonDistribution[]): number {
  return distribution.reduce((total, item) => {
    const lessonCount = item.lessons?.filter((lesson) => lesson?.lessonTitle?.trim()).length ?? 0
    return total + lessonCount
  }, 0)
}

export function groupDistributionByDay(
  distribution: StudyPlannerStoredLessonDistribution[],
  options?: { excludeHolidayDates?: boolean },
): GroupedDistributionDay[] {
  const grouped = new Map<string, StudyPlannerStoredLessonDistribution[]>()

  distribution.forEach((item) => {
    if (!item?.dateStr || !item.startTime || !item.endTime) {
      return
    }

    if (options?.excludeHolidayDates && HOLIDAY_SUFFIXES.some((suffix) => item.dateStr.includes(suffix))) {
      return
    }

    const current = grouped.get(item.dateStr) ?? []
    current.push(item)
    grouped.set(item.dateStr, current)
  })

  return Array.from(grouped.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([dateStr, items]) => ({
      dateStr,
      dayName: items[0]?.dayName ?? '',
      items,
    }))
}
