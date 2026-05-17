import type { MutableRefObject } from 'react'
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../../../types/planner-ui.types'
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../../../types/planner-schedule.types'
import type { StateSetter } from './common.types'

export interface UseStudyPlannerCalendarActionsParams {
  availableCourses: StudyPlannerCourseOption[]
  assignedCourses: StudyPlannerAssignedCourse[]
  isAudioEnabled: boolean
  isProcessing: boolean
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>
  pendingLessonsWithNames: StudyPlannerPendingLesson[]
  selectedCourseIds: string[]
  setCalendarSkipped: StateSetter<boolean>
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>
  setConversationHistory: StateSetter<StudyPlannerMessage[]>
  setIsConnectingCalendar: StateSetter<boolean>
  setIsProcessing: StateSetter<boolean>
  setPendingLessonsWithNames: StateSetter<StudyPlannerPendingLesson[]>
  setSavedCalendarData: StateSetter<StudyPlannerCalendarDataMap | null>
  setSavedLessonDistribution: StateSetter<StudyPlannerStoredLessonDistribution[]>
  setSavedTargetDate: StateSetter<string | null>
  setSavedTotalLessons: StateSetter<number>
  setSelectedCourseIds: StateSetter<string[]>
  setShowCalendarModal: StateSetter<boolean>
  setTargetDate: StateSetter<string | null>
  setUserContext: StateSetter<StudyPlannerUserContext | null>
  speakText: (text: string) => Promise<void>
  studyApproach: StudyApproach | null
  targetDate: string | null
  userContext: StudyPlannerUserContext | null
  userId: string | undefined
}
