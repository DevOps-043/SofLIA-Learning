'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import type {
  StudyApproach,
  StudyPlannerMessage,
} from '../types/planner-ui.types';
import type { StudyPlannerStoredLessonDistribution } from '../types/planner-schedule.types';

interface StudyPlannerSavedSession {
  conversationHistory?: StudyPlannerMessage[];
  currentStep?: number;
  hasShownFinalSummary?: boolean;
  savedLessonDistribution?: StudyPlannerStoredLessonDistribution[];
  studyApproach?: StudyApproach | null;
  targetDate?: string | null;
  timestamp: string;
}

interface UseStudyPlannerSessionStorageParams {
  conversationHistory: StudyPlannerMessage[];
  currentStep: number;
  currentUserId: string | null;
  hasShownFinalSummary: boolean;
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[];
  setConversationHistory: Dispatch<SetStateAction<StudyPlannerMessage[]>>;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  setHasShownFinalSummary: Dispatch<SetStateAction<boolean>>;
  setSavedLessonDistribution: Dispatch<SetStateAction<StudyPlannerStoredLessonDistribution[]>>;
  setStudyApproach: Dispatch<SetStateAction<StudyApproach | null>>;
  setTargetDate: Dispatch<SetStateAction<string | null>>;
  showConversation: boolean;
  studyApproach: StudyApproach | null;
  targetDate: string | null;
}

function buildStorageKey(userId: string) {
  return `lia_planner_session_v1_${userId}`;
}

export function useStudyPlannerSessionStorage({
  conversationHistory,
  currentStep,
  currentUserId,
  hasShownFinalSummary,
  savedLessonDistribution,
  setConversationHistory,
  setCurrentStep,
  setHasShownFinalSummary,
  setSavedLessonDistribution,
  setStudyApproach,
  setTargetDate,
  showConversation,
  studyApproach,
  targetDate,
}: UseStudyPlannerSessionStorageParams) {
  const [savedSessionDate, setSavedSessionDate] = useState<string | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  useEffect(() => {
    if (!currentUserId || typeof window === 'undefined') {
      return;
    }

    try {
      const savedData = localStorage.getItem(buildStorageKey(currentUserId));
      if (!savedData) {
        return;
      }

      const session = JSON.parse(savedData) as StudyPlannerSavedSession;
      const sessionTime = new Date(session.timestamp).getTime();
      const isRecent = Date.now() - sessionTime < 24 * 60 * 60 * 1000;

      if (isRecent && (session.conversationHistory?.length || session.savedLessonDistribution?.length)) {
        setSavedSessionDate(
          new Date(session.timestamp).toLocaleString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        );

        if (showConversation) {
          setShowResumePrompt(true);
        }
      }
    } catch (error) {
      console.error('Error leyendo sesion guardada:', error);
    }
  }, [currentUserId, showConversation]);

  useEffect(() => {
    if (!currentUserId || !showConversation || showResumePrompt || typeof window === 'undefined') {
      return;
    }

    if (conversationHistory.length === 0 && savedLessonDistribution.length === 0) {
      return;
    }

    const sessionData: StudyPlannerSavedSession = {
      timestamp: new Date().toISOString(),
      conversationHistory,
      savedLessonDistribution,
      currentStep,
      studyApproach,
      targetDate,
      hasShownFinalSummary,
    };

    localStorage.setItem(buildStorageKey(currentUserId), JSON.stringify(sessionData));
  }, [
    conversationHistory,
    currentStep,
    currentUserId,
    hasShownFinalSummary,
    savedLessonDistribution,
    showConversation,
    showResumePrompt,
    studyApproach,
    targetDate,
  ]);

  const handleResumeSession = () => {
    if (!currentUserId || typeof window === 'undefined') {
      setShowResumePrompt(false);
      return;
    }

    try {
      const savedData = localStorage.getItem(buildStorageKey(currentUserId));
      if (savedData) {
        const session = JSON.parse(savedData) as StudyPlannerSavedSession;

        if (session.conversationHistory) {
          setConversationHistory(session.conversationHistory);
        }
        if (session.savedLessonDistribution) {
          setSavedLessonDistribution(session.savedLessonDistribution);
        }
        if (session.currentStep) {
          setCurrentStep(session.currentStep);
        }
        if (session.studyApproach) {
          setStudyApproach(session.studyApproach);
        }
        if (session.targetDate) {
          setTargetDate(session.targetDate);
        }
        if (session.hasShownFinalSummary) {
          setHasShownFinalSummary(session.hasShownFinalSummary);
        }

        setConversationHistory((previousHistory) => [
          ...previousHistory,
          {
            role: 'system',
            content: '[SISTEMA] Sesion anterior restaurada exitosamente. Puedes continuar donde lo dejaste.',
          },
        ]);
      }
    } catch (error) {
      console.error('Error restaurando sesion:', error);
    }

    setShowResumePrompt(false);
  };

  const handleDiscardSession = () => {
    if (currentUserId && typeof window !== 'undefined') {
      localStorage.removeItem(buildStorageKey(currentUserId));
    }

    setShowResumePrompt(false);
  };

  const clearStudyPlannerSessionStorage = () => {
    if (currentUserId && typeof window !== 'undefined') {
      localStorage.removeItem(buildStorageKey(currentUserId));
    }
  };

  return {
    clearStudyPlannerSessionStorage,
    handleDiscardSession,
    handleResumeSession,
    savedSessionDate,
    showResumePrompt,
  };
}
