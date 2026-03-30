'use client';

import { useRef } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { STUDY_PLANNER_STEPS } from '../../constants/studyPlannerSteps';
import type { StudyApproach } from '../../types/planner-ui.types';

export interface UseStudyPlannerNavigationHandlersParams {
  clearStudyPlannerSessionStorage: () => void;
  currentStep: number;
  handleApproachSelection: (approach: StudyApproach) => Promise<void>;
  handleComplete: () => void;
  handleTargetDateResponse: (value: string) => Promise<void>;
  isAudioEnabled: boolean;
  loadUserCourses: () => void;
  orgSlug: string | null;
  persistStudyPlan: (opts: { scheduleRedirect: () => void }) => Promise<void>;
  router: AppRouterInstance;
  scheduleStudyPlannerRedirect: (delayMs: number) => void;
  setCurrentStep: (step: number) => void;
  setHasUserInteracted: (v: boolean) => void;
  setIsAudioEnabled: (v: boolean) => void;
  setIsProcessing: (v: boolean) => void;
  setStudyApproach: (v: StudyApproach | null) => void;
  setTargetDate: (v: string | null) => void;
  speakText: (text: string) => Promise<void>;
  stopAllAudio: () => void;
  hasUserInteracted: boolean;
}

export function useStudyPlannerNavigationHandlers({
  clearStudyPlannerSessionStorage,
  currentStep,
  handleApproachSelection,
  handleComplete,
  handleTargetDateResponse,
  isAudioEnabled,
  loadUserCourses,
  orgSlug,
  persistStudyPlan,
  router,
  scheduleStudyPlannerRedirect,
  setCurrentStep,
  setHasUserInteracted,
  setIsAudioEnabled,
  setIsProcessing,
  setStudyApproach,
  setTargetDate,
  speakText,
  stopAllAudio,
  hasUserInteracted,
}: UseStudyPlannerNavigationHandlersParams) {
  const handleNext = () => {
    stopAllAudio();
    setHasUserInteracted(true);

    const nextStep = currentStep + 1;

    if (nextStep < STUDY_PLANNER_STEPS.length) {
      setCurrentStep(nextStep);
      speakText(STUDY_PLANNER_STEPS[nextStep].speech);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    stopAllAudio();

    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      speakText(STUDY_PLANNER_STEPS[prevStep].speech);
    }
  };

  const handleStudyApproachResponse = async (approach: StudyApproach) => {
    await handleApproachSelection(approach);
  };

  const handleVoiceCourseSelectorRequest = () => {
    loadUserCourses();
  };

  const handleVoiceStudyApproachDetected = async (approach: StudyApproach) => {
    setStudyApproach(approach);
    await handleStudyApproachResponse(approach);
  };

  const handleVoiceTargetDateDetected = async (value: string) => {
    setTargetDate(value);
    await handleTargetDateResponse(value);
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);

    if (!newState) {
      stopAllAudio();
    } else {
      speakText(STUDY_PLANNER_STEPS[currentStep].speech);
    }
  };

  const handlePlannerBack = () => {
    if (orgSlug) {
      router.push(`/${orgSlug}/business-user/dashboard`);
      return;
    }

    router.back();
  };

  const saveStudyPlan = async () => {
    await persistStudyPlan({
      scheduleRedirect: () => {
        clearStudyPlannerSessionStorage();
        scheduleStudyPlannerRedirect(3000);
      },
    });
  };

  const executeFinalPlanSave = async () => {
    setIsProcessing(true);
    await persistStudyPlan({
      scheduleRedirect: () => {
        clearStudyPlannerSessionStorage();
        scheduleStudyPlannerRedirect(0);
      },
    });
  };

  return {
    executeFinalPlanSave,
    handleNext,
    handlePlannerBack,
    handlePrevious,
    handleStudyApproachResponse,
    handleVoiceCourseSelectorRequest,
    handleVoiceStudyApproachDetected,
    handleVoiceTargetDateDetected,
    saveStudyPlan,
    toggleAudio,
  };
}
