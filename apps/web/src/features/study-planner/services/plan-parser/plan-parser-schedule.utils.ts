import {
  ensureLessonDistributionIdentity,
  sortLessonDistributions,
} from '../lesson-distribution.service'
import type { StudyPlannerStoredLessonDistribution } from '../../types/planner-schedule.types'

export function flushCurrentSchedule(
  schedules: StudyPlannerStoredLessonDistribution[],
  currentSchedule: StudyPlannerStoredLessonDistribution | null,
): StudyPlannerStoredLessonDistribution | null {
  if (!currentSchedule) {
    return null
  }

  schedules.push({
    ...currentSchedule,
    lessons: [...currentSchedule.lessons],
  })

  return null
}

export function finalizeParsedSchedules(
  schedules: StudyPlannerStoredLessonDistribution[],
): StudyPlannerStoredLessonDistribution[] {
  return sortLessonDistributions(
    schedules
      .filter((schedule) =>
        Boolean(schedule.dateStr) &&
        Boolean(schedule.startTime) &&
        Boolean(schedule.endTime),
      )
      .map((schedule) => ensureLessonDistributionIdentity(schedule)),
  )
}
