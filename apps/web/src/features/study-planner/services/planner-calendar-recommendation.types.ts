import type { StudyApproach } from '../types/planner-ui.types'
import type { StudyPlannerCalendarFreeSlotWithDay } from '../types/planner-schedule.types'
import type { StudyPlannerUserContextApiData } from './planner-user-context-client.service'
import type { StudyPlannerLessonDistributionResult } from './planner-lesson-distribution.service'

export interface StudyPlannerProfileAvailability {
  minutesPerDay: number
  recommendedBreak: number
  recommendedSessionLength: number
}

export interface StudyPlannerCalendarRecommendationParams {
  busiestDays: string[]
  calendarEventsCount: number
  distributionResult: StudyPlannerLessonDistributionResult
  effectiveApproach: StudyApproach | null
  effectiveTargetDate: string | null
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[]
  profileAvailability: StudyPlannerProfileAvailability | null | undefined
  provider: string
  userProfile: StudyPlannerUserContextApiData | null
}

export interface StudyPlannerAudioSummaryParams {
  calendarEventsCount: number
  daysWithFreeTime: Array<{ dayName: string }>
  finalSlots: StudyPlannerCalendarFreeSlotWithDay[]
}
