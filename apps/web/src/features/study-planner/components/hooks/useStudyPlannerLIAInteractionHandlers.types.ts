import type { MutableRefObject } from 'react';
import type { useStudyPlannerMessageHandler } from '../../hooks/useStudyPlannerMessageHandler';
import type { LessonData } from '../../hooks/useSofLIAData';
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
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types';
import type { useStudyPlannerNavigationHandlers } from './useStudyPlannerNavigationHandlers';

type ProcessRef = MutableRefObject<boolean>;
type VoiceQuestionRef = MutableRefObject<(question: string) => Promise<void>>;
type LastVoiceQuestionRef = MutableRefObject<{ text: string; ts: number }>;
type ConversationHistoryRef = MutableRefObject<StudyPlannerMessage[]>;
type PendingLessonsRef = MutableRefObject<StudyPlannerPendingLesson[]>;

export interface StudyPlannerInteractionLiaData {
  getLessonsForPrompt: (selectedCourseIds?: string[]) => string;
  isReady: boolean;
  lessons: LessonData[];
  totalPending: number;
}

export interface UseStudyPlannerLIAInteractionHandlersParams {
  availableCourses: StudyPlannerCourseOption[];
  assignedCourses: StudyPlannerAssignedCourse[];
  clearStudyPlannerSessionStorage: () => void;
  connectedCalendar: StudyPlannerCalendarProvider;
  conversationHistory: StudyPlannerMessage[];
  conversationHistoryRef: ConversationHistoryRef;
  currentStep: number;
  executePlanSave: (opts: { scheduleRedirect: () => void }) => Promise<void>;
  handleApproachSelection: (approach: StudyApproach) => Promise<void>;
  handleComplete: () => void;
  handleTargetDateResponse: (value: string) => Promise<void>;
  handleVoiceQuestionRef: VoiceQuestionRef;
  hasAskedApproach: boolean;
  hasAskedTargetDate: boolean;
  hasShownFinalSummary: boolean;
  hasUserInteracted: boolean;
  isAudioEnabled: boolean;
  isProcessing: boolean;
  lastVoiceQuestionRef: LastVoiceQuestionRef;
  liaConversationId: string | null;
  liaData: StudyPlannerInteractionLiaData;
  loadUserCourses: (freshCourses?: StudyPlannerAssignedCourse[]) => void | Promise<void>;
  orgSlug: string | null;
  pendingLessonsRef: PendingLessonsRef;
  processingRef: ProcessRef;
  router: Parameters<typeof useStudyPlannerNavigationHandlers>[0]['router'];
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  savedPlanId: string | null;
  savedTargetDate: string | null;
  savedTotalLessons: number;
  scheduleStudyPlannerRedirect: (delayMs: number) => void;
  selectedCourseIds: string[];
  setConversationHistory: Parameters<typeof useStudyPlannerMessageHandler>[0]['setConversationHistory'];
  setCurrentStep: (step: number) => void;
  setHasShownFinalSummary: Parameters<typeof useStudyPlannerMessageHandler>[0]['setHasShownFinalSummary'];
  setHasUserInteracted: (value: boolean) => void;
  setIsAudioEnabled: (value: boolean) => void;
  setIsProcessing: Parameters<typeof useStudyPlannerMessageHandler>[0]['setIsProcessing'];
  setLiaConversationId: Parameters<typeof useStudyPlannerMessageHandler>[0]['setLiaConversationId'];
  setSavedLessonDistribution: Parameters<typeof useStudyPlannerMessageHandler>[0]['setSavedLessonDistribution'];
  setSavedPlanId: Parameters<typeof useStudyPlannerMessageHandler>[0]['setSavedPlanId'];
  setStudyApproach: Parameters<typeof useStudyPlannerMessageHandler>[0]['setStudyApproach'];
  setTargetDate: Parameters<typeof useStudyPlannerMessageHandler>[0]['setTargetDate'];
  showDateModal: boolean;
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
  userContext: StudyPlannerUserContext | null;
}
