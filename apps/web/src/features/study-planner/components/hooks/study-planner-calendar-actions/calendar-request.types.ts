import type {
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
  StudyPlannerUserContext,
} from '../../../types/planner-ui.types'
import type {
  StateSetter,
  StudyPlannerAnalyzeCalendarAndSuggestB2B,
} from './common.types'
import type { UseStudyPlannerCalendarActionsParams } from './params.types'

export interface StudyPlannerCalendarEventsRequest {
  endDate: Date
  provider: string
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>
  setConversationHistory: StateSetter<StudyPlannerMessage[]>
  setShowCalendarModal: StateSetter<boolean>
  startDate: Date
}

export interface StudyPlannerAnalyzeCalendarAndSuggestParams
  extends UseStudyPlannerCalendarActionsParams {
  analyzeCalendarAndSuggestB2B: StudyPlannerAnalyzeCalendarAndSuggestB2B
}

export interface StudyPlannerDisconnectCalendarParams {
  isAudioEnabled: boolean
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>
  setConversationHistory: StateSetter<StudyPlannerMessage[]>
  setIsConnectingCalendar: StateSetter<boolean>
  setShowCalendarModal: StateSetter<boolean>
  speakText: (text: string) => Promise<void>
}

export interface StudyPlannerSkipCalendarConnectionParams {
  isAudioEnabled: boolean
  setCalendarSkipped: StateSetter<boolean>
  setConversationHistory: StateSetter<StudyPlannerMessage[]>
  setIsProcessing: StateSetter<boolean>
  setShowCalendarModal: StateSetter<boolean>
  setUserContext: StateSetter<StudyPlannerUserContext | null>
  speakText: (text: string) => Promise<void>
}
