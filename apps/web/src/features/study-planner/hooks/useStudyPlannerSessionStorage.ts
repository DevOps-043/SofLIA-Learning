'use client';

import { useEffect, useState } from 'react';
import {
  getSavedSessionDateLabel,
  hasRestorablePlannerSession,
  readPlannerSession,
  removePlannerSession,
  savePlannerSession,
} from './study-planner-session-storage.service';
import { restoreStudyPlannerSession } from './study-planner-session-restore.service';
import type { UseStudyPlannerSessionStorageParams } from './useStudyPlannerSessionStorage.types';

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
    const session = readPlannerSession(currentUserId);
    if (!session || !hasRestorablePlannerSession(session)) {
      return;
    }

    setSavedSessionDate(getSavedSessionDateLabel(session));
    if (showConversation) {
      setShowResumePrompt(true);
    }
  }, [currentUserId, showConversation]);

  useEffect(() => {
    if (!currentUserId || !showConversation || showResumePrompt) {
      return;
    }

    if (conversationHistory.length === 0 && savedLessonDistribution.length === 0) {
      return;
    }

    savePlannerSession(currentUserId, {
      timestamp: new Date().toISOString(),
      conversationHistory,
      savedLessonDistribution,
      currentStep,
      studyApproach,
      targetDate,
      hasShownFinalSummary,
    });
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
    const session = readPlannerSession(currentUserId);
    if (session) {
      restoreStudyPlannerSession({
        session,
        setConversationHistory,
        setCurrentStep,
        setHasShownFinalSummary,
        setSavedLessonDistribution,
        setStudyApproach,
        setTargetDate,
      });
    }
    setShowResumePrompt(false);
  };

  const handleDiscardSession = () => {
    removePlannerSession(currentUserId);
    setShowResumePrompt(false);
  };

  return {
    clearStudyPlannerSessionStorage: () => removePlannerSession(currentUserId),
    handleDiscardSession,
    handleResumeSession,
    savedSessionDate,
    showResumePrompt,
  };
}
