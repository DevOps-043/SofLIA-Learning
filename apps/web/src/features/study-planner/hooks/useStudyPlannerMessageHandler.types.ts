import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { LessonData } from './useSofLIAData';
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerCourseOption,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types';

export interface StudyPlannerMessageHandlerLiaData {
  getLessonsForPrompt: (selectedCourseIds?: string[]) => string;
  isReady: boolean;
  lessons: LessonData[];
  totalPending: number;
}

export interface UseStudyPlannerMessageHandlerParams {
  availableCourses: StudyPlannerCourseOption[];
  assignedCourses: StudyPlannerAssignedCourse[];
  connectedCalendar: StudyPlannerCalendarProvider;
  conversationHistory: StudyPlannerMessage[];
  executeFinalPlanSave: () => Promise<void>;
  hasAskedApproach: boolean;
  hasAskedTargetDate: boolean;
  hasShownFinalSummary: boolean;
  isAudioEnabled: boolean;
  isProcessing: boolean;
  liaConversationId: string | null;
  liaData: StudyPlannerMessageHandlerLiaData;
  loadUserCourses: () => void;
  onStudyApproachResponse: (approach: StudyApproach) => Promise<void>;
  onTargetDateResponse: (value: string) => Promise<void>;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedPlanId: string | null;
  savedTargetDate: string | null;
  savedTotalLessons: number;
  selectedCourseIds: string[];
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setHasShownFinalSummary: Dispatch<SetStateAction<boolean>>;
  setIsProcessing: Dispatch<SetStateAction<boolean>>;
  setLiaConversationId: Dispatch<SetStateAction<string | null>>;
  setSavedLessonDistribution: Dispatch<SetStateAction<StudyPlannerStoredLessonDistribution[]>>;
  setSavedPlanId: Dispatch<SetStateAction<string | null>>;
  setStudyApproach: Dispatch<SetStateAction<StudyApproach | null>>;
  setTargetDate: Dispatch<SetStateAction<string | null>>;
  showDateModal: boolean;
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  userContext: StudyPlannerUserContext | null;
}
