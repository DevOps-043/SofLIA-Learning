import type { Dispatch, SetStateAction } from 'react'
import type {
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
} from '../types/planner-ui.types'
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types'

export interface UsePlanScheduleAdjusterParams {
  connectedCalendar: StudyPlannerCalendarProvider
  conversationHistory: StudyPlannerMessage[]
  isAudioEnabled: boolean
  savedCalendarData: StudyPlannerCalendarDataMap | null
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[]
  savedPlanId: string | null
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>
  setSavedLessonDistribution: Dispatch<SetStateAction<StudyPlannerStoredLessonDistribution[]>>
  setSavedPlanId: Dispatch<SetStateAction<string | null>>
  speakText: (text: string) => Promise<void>
}

export interface CanonicalSessionUpdate {
  id: string
  clientReferenceId?: string
  startTime: string
  endTime: string
}
