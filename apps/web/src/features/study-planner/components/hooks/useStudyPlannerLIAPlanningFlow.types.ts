import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { useStudyPlannerCourseSelectionFlow } from '../../hooks/useStudyPlannerCourseSelectionFlow';
import type { useStudyPlannerCalendarUiFlow } from '../../hooks/useStudyPlannerCalendarUiFlow';
import type { useStudyPlanPersistence } from '../../hooks/useStudyPlanPersistence';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types';
import type { useStudyPlannerCalendarActions } from './useStudyPlannerCalendarActions';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export interface UseStudyPlannerLIAPlanningFlowParams {
  assignedCourses: StudyPlannerAssignedCourse[];
  availableCourses: StudyPlannerCourseOption[];
  calendarSkipped: boolean;
  connectedCalendar: StudyPlannerCalendarProvider;
  conversationHistory: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['conversationHistory'];
  getAnalyzeCalendarAndSuggest: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['getAnalyzeCalendarAndSuggest'];
  isAudioEnabled: boolean;
  isProcessing: boolean;
  onDuplicatePlan: () => void;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  pendingLessonsWithNames: StudyPlannerPendingLesson[];
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedPlanId: string | null;
  savedTargetDate: string | null;
  selectedCourseIds: string[];
  setCalendarSkipped: Parameters<typeof useStudyPlannerCalendarActions>[0]['setCalendarSkipped'];
  setConnectedCalendar: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setConnectedCalendar'];
  setConversationHistory: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setConversationHistory'];
  setCurrentMonth: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setCurrentMonth'];
  setAvailableCourses: Parameters<typeof useStudyPlannerCourseSelectionFlow>[0]['setAvailableCourses'];
  setHasAskedApproach: Parameters<typeof useStudyPlannerCourseSelectionFlow>[0]['setHasAskedApproach'];
  setHasAskedTargetDate: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setHasAskedTargetDate'];
  setHasConfiguredCalendars: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setHasConfiguredCalendars'];
  setIsConnectingCalendar: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setIsConnectingCalendar'];
  setIsLoadingCourses: Parameters<typeof useStudyPlannerCourseSelectionFlow>[0]['setIsLoadingCourses'];
  setIsProcessing: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setIsProcessing'];
  setIsVisible: StateSetter<boolean>;
  setPendingLessonsWithNames: Parameters<typeof useStudyPlannerCalendarActions>[0]['setPendingLessonsWithNames'];
  setSavedCalendarData: Parameters<typeof useStudyPlannerCalendarActions>[0]['setSavedCalendarData'];
  setSavedLessonDistribution: Parameters<typeof useStudyPlanPersistence>[0]['setSavedLessonDistribution'];
  setSavedPlanId: Parameters<typeof useStudyPlanPersistence>[0]['setSavedPlanId'];
  setSavedTargetDate: Parameters<typeof useStudyPlannerCalendarActions>[0]['setSavedTargetDate'];
  setSavedTotalLessons: Parameters<typeof useStudyPlannerCalendarActions>[0]['setSavedTotalLessons'];
  setSelectedCourseIds: Parameters<typeof useStudyPlannerCourseSelectionFlow>[0]['setSelectedCourseIds'];
  setSelectedDate: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setSelectedDate'];
  setShowApproachButtons: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setShowApproachButtons'];
  setShowApproachModal: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setShowApproachModal'];
  setShowCalendarConfig: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setShowCalendarConfig'];
  setShowCalendarModal: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setShowCalendarModal'];
  setShowConversation: Parameters<typeof useStudyPlannerCourseSelectionFlow>[0]['setShowConversation'];
  setShowCourseSelector: Parameters<typeof useStudyPlannerCourseSelectionFlow>[0]['setShowCourseSelector'];
  setShowDateModal: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setShowDateModal'];
  setStudyApproach: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setStudyApproach'];
  setTargetDate: Parameters<typeof useStudyPlannerCalendarUiFlow>[0]['setTargetDate'];
  setUserContext: Parameters<typeof useStudyPlannerCalendarActions>[0]['setUserContext'];
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  userContext: StudyPlannerUserContext | null;
  userId: string | undefined;
}
