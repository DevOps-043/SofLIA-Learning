'use client';

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { useStudyPlannerInitializationFlow } from '../../hooks/useStudyPlannerInitializationFlow';
import { useStudyPlannerPendingLessonsSync } from '../../hooks/useStudyPlannerPendingLessonsSync';
import { useStudyPlannerWelcomeFlow } from '../../hooks/useStudyPlannerWelcomeFlow';
import type { LessonData } from '../../hooks/useSofLIAData';
import type {
  StudyPlannerAssignedCourse,
  StudyPlannerCalendarProvider,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
  StudyPlannerUserContext,
} from '../../types/planner-ui.types';
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../../types/planner-schedule.types';
import { useRegisterDuplicatePlanHandler } from './useRegisterDuplicatePlanHandler';

type StateSetter<T> = Dispatch<SetStateAction<T>>;
type CalendarProvider = NonNullable<StudyPlannerCalendarProvider>;
type AnalyzeCalendarAndSuggest = (
  provider: CalendarProvider,
  targetDateParam?: string,
  approachParam?: 'corto' | 'balance' | 'largo' | null,
) => Promise<void>;

interface UseStudyPlannerLIAOrchestrationParams {
  assignedCourses: StudyPlannerAssignedCourse[];
  conversationHistory: StudyPlannerMessage[];
  conversationHistoryRef: MutableRefObject<StudyPlannerMessage[]>;
  currentStep: number;
  currentUserId: string | null;
  getAnalyzeCalendarAndSuggest: () => AnalyzeCalendarAndSuggest;
  getLessonsForPrompt: (selectedCourseIds?: string[]) => string;
  handleDuplicatePlanRef: MutableRefObject<() => void>;
  hasAttemptedOpenRef: MutableRefObject<boolean>;
  isAudioEnabled: boolean;
  isVisible: boolean;
  lessons: LessonData[];
  lessonsAreLoading: boolean;
  lessonsAreReady: boolean;
  lessonsError: string | null;
  loadPendingLessons: () => Promise<void>;
  loadUserCourses: (freshCourses?: StudyPlannerAssignedCourse[]) => void | Promise<void>;
  pendingLessonsRef: MutableRefObject<StudyPlannerPendingLesson[]>;
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  setAssignedCourses: StateSetter<StudyPlannerAssignedCourse[]>;
  setConnectedCalendar: StateSetter<StudyPlannerCalendarProvider>;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setCurrentUserId: StateSetter<string | null>;
  setHasConfiguredCalendars: StateSetter<boolean>;
  setHasShownFinalSummary: StateSetter<boolean>;
  setHasUserInteracted: StateSetter<boolean>;
  setIsProcessing: StateSetter<boolean>;
  setIsVisible: StateSetter<boolean>;
  setLiaConversationId: StateSetter<string | null>;
  setPendingLessonsWithNames: StateSetter<StudyPlannerPendingLesson[]>;
  setSavedLessonDistribution: StateSetter<StudyPlannerStoredLessonDistribution[]>;
  setSelectedCourseIds: StateSetter<string[]>;
  setShowApproachButtons: StateSetter<boolean>;
  setShowConversation: StateSetter<boolean>;
  setUserContext: StateSetter<StudyPlannerUserContext | null>;
  showConversation: boolean;
  showCourseSelector: boolean;
  speakText: (text: string) => Promise<void>;
  userContext: StudyPlannerUserContext | null;
  welcomeSpeech: string;
}

export function useStudyPlannerLIAOrchestration({
  assignedCourses,
  conversationHistory,
  conversationHistoryRef,
  currentStep,
  currentUserId,
  getAnalyzeCalendarAndSuggest,
  getLessonsForPrompt,
  handleDuplicatePlanRef,
  hasAttemptedOpenRef,
  isAudioEnabled,
  isVisible,
  lessons,
  lessonsAreLoading,
  lessonsAreReady,
  lessonsError,
  loadPendingLessons,
  loadUserCourses,
  pendingLessonsRef,
  savedCalendarData,
  setAssignedCourses,
  setConnectedCalendar,
  setConversationHistory,
  setCurrentUserId,
  setHasConfiguredCalendars,
  setHasShownFinalSummary,
  setHasUserInteracted,
  setIsProcessing,
  setIsVisible,
  setLiaConversationId,
  setPendingLessonsWithNames,
  setSavedLessonDistribution,
  setSelectedCourseIds,
  setShowApproachButtons,
  setShowConversation,
  setUserContext,
  showConversation,
  showCourseSelector,
  speakText,
  userContext,
  welcomeSpeech,
}: UseStudyPlannerLIAOrchestrationParams): void {
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory, conversationHistoryRef]);

  useStudyPlannerPendingLessonsSync({
    assignedCourses,
    lessons,
    lessonsAreLoading,
    lessonsAreReady,
    lessonsError,
    loadPendingLessons,
    pendingLessonsRef,
    setPendingLessonsWithNames,
  });

  useStudyPlannerInitializationFlow({
    currentUserId,
    getAnalyzeCalendarAndSuggest,
    hasAttemptedOpenRef,
    setAssignedCourses,
    setConnectedCalendar,
    setConversationHistory,
    setCurrentUserId,
    setHasConfiguredCalendars,
    setHasShownFinalSummary,
    setIsVisible,
    setSavedLessonDistribution,
    setSelectedCourseIds,
    setShowConversation,
    setUserContext,
  });

  useEffect(() => {
    if (!isVisible || currentStep !== 0 || !isAudioEnabled) {
      return;
    }

    const timer = setTimeout(() => {
      void speakText(welcomeSpeech);
      setHasUserInteracted(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentStep, isAudioEnabled, isVisible, setHasUserInteracted, speakText, welcomeSpeech]);

  useRegisterDuplicatePlanHandler({
    handleDuplicatePlanRef,
    loadUserCourses,
    setAssignedCourses,
    setSelectedCourseIds,
  });

  useStudyPlannerWelcomeFlow({
    assignedCourses,
    conversationHistoryLength: conversationHistory.length,
    getLessonsForPrompt,
    isAudioEnabled,
    lessonsAreReady,
    onWelcomeComplete: () => {
      void loadUserCourses();
    },
    savedCalendarData,
    setConversationHistory,
    setIsProcessing,
    setLiaConversationId,
    setShowApproachButtons,
    showConversation,
    showCourseSelector,
    speakText,
    userContext,
  });
}
