'use client';

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, type Dispatch, type SetStateAction } from 'react';

import {
  getStudyPlannerWelcomeAudioMessage,
  getStudyPlannerWelcomeFallbackMessage,
  requestStudyPlannerWelcomeMessage,
  STUDY_PLANNER_WELCOME_REQUEST_TIMEOUT_MS,
} from '../services/planner-welcome.service';
import type {
  StudyPlannerAssignedCourse,
  StudyPlannerMessage,
  StudyPlannerUserContext,
} from '../types/planner-ui.types';
import type { StudyPlannerCalendarDataMap } from '../types/planner-schedule.types';

type StateSetter<T> = Dispatch<SetStateAction<T>>;

interface UseStudyPlannerWelcomeFlowParams {
  assignedCourses: StudyPlannerAssignedCourse[];
  conversationHistoryLength: number;
  getLessonsForPrompt: (selectedCourseIds?: string[]) => string;
  isAudioEnabled: boolean;
  lessonsAreReady: boolean;
  onWelcomeComplete?: () => void;
  savedCalendarData: StudyPlannerCalendarDataMap | null;
  setConversationHistory: StateSetter<StudyPlannerMessage[]>;
  setIsProcessing: StateSetter<boolean>;
  setLiaConversationId: StateSetter<string | null>;
  setShowApproachButtons: StateSetter<boolean>;
  showConversation: boolean;
  showCourseSelector: boolean;
  speakText: (text: string) => Promise<void>;
  userContext: StudyPlannerUserContext | null;
}

export function useStudyPlannerWelcomeFlow({
  assignedCourses,
  conversationHistoryLength,
  getLessonsForPrompt,
  isAudioEnabled,
  lessonsAreReady,
  onWelcomeComplete,
  savedCalendarData,
  setConversationHistory,
  setIsProcessing,
  setLiaConversationId,
  setShowApproachButtons,
  showConversation,
  showCourseSelector,
  speakText,
  userContext,
}: UseStudyPlannerWelcomeFlowParams): void {
  useEffect(() => {
    if (!showConversation || conversationHistoryLength > 0 || showCourseSelector) {
      return;
    }

    if (!userContext?.userType) {
      return;
    }

    if (assignedCourses.length > 0 && !lessonsAreReady) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STUDY_PLANNER_WELCOME_REQUEST_TIMEOUT_MS);
    let isMounted = true;

    const runWelcomeFlow = async () => {
      setIsProcessing(true);

      try {
        const result = await requestStudyPlannerWelcomeMessage({
          assignedCourses,
          lessonsContext: getLessonsForPrompt(),
          savedCalendarData,
          signal: controller.signal,
          userContext,
        });

        if (!isMounted) {
          return;
        }

        if (result.conversationId) {
          setLiaConversationId(result.conversationId);
        }

        setConversationHistory([{ role: 'assistant', content: result.response }]);

        // Do NOT show approach buttons here.
        // The user must first select a course (RF-01, RUX-02).
        // Approach selection happens after course selection in confirmCourseSelection().

        // After the welcome message renders, automatically open the course selector
        // so the user can pick which course to plan without having to type it (RUX-02).
        if (assignedCourses.length > 0 && onWelcomeComplete) {
          window.setTimeout(onWelcomeComplete, 800);
        }

        if (isAudioEnabled && assignedCourses.length > 0) {
          void speakText(getStudyPlannerWelcomeAudioMessage());
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (
          controller.signal.aborted ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          return;
        }

        techDebtLogger.error('Error generando mensaje de bienvenida:', error);

        setConversationHistory([
          {
            role: 'assistant',
            content: getStudyPlannerWelcomeFallbackMessage(assignedCourses.length > 0),
          },
        ]);
      } finally {
        clearTimeout(timeoutId);

        if (isMounted) {
          setIsProcessing(false);
        }
      }
    };

    void runWelcomeFlow();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    assignedCourses,
    conversationHistoryLength,
    getLessonsForPrompt,
    isAudioEnabled,
    lessonsAreReady,
    onWelcomeComplete,
    savedCalendarData,
    setConversationHistory,
    setIsProcessing,
    setLiaConversationId,
    setShowApproachButtons,
    showConversation,
    showCourseSelector,
    speakText,
    userContext,
  ]);
}
