import type { StudyPlannerStoredLessonDistribution } from '../../types/planner-schedule.types'

export interface GroupedDistributionDay {
  dateStr: string
  dayName: string
  items: StudyPlannerStoredLessonDistribution[]
}
