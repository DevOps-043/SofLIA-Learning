import type { Dispatch, SetStateAction } from 'react'
import type {
  StudyPlannerUserContextApiData,
} from '../../../services/planner-user-context-client.service'
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
} from '../../../types/planner-ui.types'
import type { StudyPlannerCalendarEventLike } from '../../../types/planner-schedule.types'

export type StateSetter<T> = Dispatch<SetStateAction<T>>
export type CalendarProvider = NonNullable<StudyPlannerCalendarProvider>

export type StudyPlannerAnalyzeCalendarAndSuggest = (
  provider: string,
  targetDateParam?: string,
  approachParam?: StudyApproach | null,
  skipB2BRedirect?: boolean,
) => Promise<void>

export type StudyPlannerAnalyzeCalendarAndSuggestB2B = (
  provider: string,
  approach: StudyApproach,
  userProfile: StudyPlannerUserContextApiData,
  assignedCourses: StudyPlannerAssignedCourse[],
) => Promise<void>

export interface CalendarEventsPayload {
  error?: string
  events?: StudyPlannerCalendarEventLike[]
  requiresReconnection?: boolean
}
