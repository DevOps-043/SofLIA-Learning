import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type {
  StudyPlannerUserContextApiData,
} from '../../services/planner-user-context-client.service';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerCalendarEventLike,
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types';

export type StateSetter<T> = Dispatch<SetStateAction<T>>;
export type CalendarProvider = NonNullable<StudyPlannerCalendarProvider>;

export type StudyPlannerAnalyzeCalendarAndSuggest = (
  provider: string,
  targetDateParam?: string,
  approachParam?: StudyApproach | null,
  skipB2BRedirect?: boolean,
) => Promise<void>;

export type StudyPlannerAnalyzeCalendarAndSuggestB2B = (
  provider: string,
  approach: StudyApproach,
  userProfile: StudyPlannerUserContextApiData,
  assignedCourses: StudyPlannerAssignedCourse[],
) => Promise<void>;

export interface CalendarEventsPayload {
  error?: string;
  events?: StudyPlannerCalendarEventLike[];
  requiresReconnection?: boolean;
}

export interface UseStudyPlannerCalendarActionsParams {
  availableCourses: StudyPlannerCourseOption[];
  assignedCourses: StudyPlannerAssignedCourse[];
  isAudioEnabled: boolean;
  isProcessing: boolean;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  pendingLessonsWithNames: StudyPlannerPendingLesson[];
  selectedCourseIds: string[];
  setCalendarSkipped: StateSetter<boolean>;
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setIsConnectingCalendar: StateSetter<boolean>;
  setIsProcessing: StateSetter<boolean>;
  setPendingLessonsWithNames: StateSetter<StudyPlannerPendingLesson[]>;
  setSavedCalendarData: StateSetter<StudyPlannerCalendarDataMap | null>;
  setSavedLessonDistribution: StateSetter<StudyPlannerStoredLessonDistribution[]>;
  setSavedTargetDate: StateSetter<string | null>;
  setSavedTotalLessons: StateSetter<number>;
  setSelectedCourseIds: StateSetter<string[]>;
  setShowCalendarModal: StateSetter<boolean>;
  setTargetDate: StateSetter<string | null>;
  setUserContext: StateSetter<StudyPlannerUserContext | null>;
  speakText: (text: string) => Promise<void>;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  userContext: StudyPlannerUserContext | null;
  userId: string | undefined;
}

export interface StudyPlannerCalendarEventsRequest {
  endDate: Date;
  provider: string;
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setShowCalendarModal: StateSetter<boolean>;
  startDate: Date;
}

export interface StudyPlannerAnalyzeCalendarAndSuggestParams
  extends UseStudyPlannerCalendarActionsParams {
  analyzeCalendarAndSuggestB2B: StudyPlannerAnalyzeCalendarAndSuggestB2B;
}

export interface StudyPlannerDisconnectCalendarParams {
  isAudioEnabled: boolean;
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setIsConnectingCalendar: StateSetter<boolean>;
  setShowCalendarModal: StateSetter<boolean>;
  speakText: (text: string) => Promise<void>;
}

export interface StudyPlannerSkipCalendarConnectionParams {
  isAudioEnabled: boolean;
  setCalendarSkipped: StateSetter<boolean>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setIsProcessing: StateSetter<boolean>;
  setShowCalendarModal: StateSetter<boolean>;
  setUserContext: StateSetter<StudyPlannerUserContext | null>;
  speakText: (text: string) => Promise<void>;
}
