'use client';

/**
 * useStudyPlannerLIALogic – orchestrator
 *
 * State is split into two focused sub-hooks:
 *   - useMessageProcessor  → conversation / processing state
 *   - useResponseHandler   → UI response state (modals, courses, calendar, …)
 *
 * All business-logic is still delegated to the same domain hooks as before;
 * the public API (return shape) is unchanged.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOrganizationStylesContext } from '../../../business-panel/contexts/OrganizationStylesContext';
import { useAuth } from '../../../auth/hooks/useAuth';
import { STUDY_PLANNER_STEPS } from '../../constants/studyPlannerSteps';
import { useStudyPlannerCourseSelectionFlow } from '../../hooks/useStudyPlannerCourseSelectionFlow';
import { useStudyPlannerInitializationFlow } from '../../hooks/useStudyPlannerInitializationFlow';
import { useSofLIAData } from '../../hooks/useSofLIAData';
import { useStudyPlannerCalendarUiFlow } from '../../hooks/useStudyPlannerCalendarUiFlow';
import { useStudyPlannerPendingLessonsSync } from '../../hooks/useStudyPlannerPendingLessonsSync';
import { useStudyPlanPersistence } from '../../hooks/useStudyPlanPersistence';
import { useStudyPlannerSessionStorage } from '../../hooks/useStudyPlannerSessionStorage';
import { useStudyPlannerWelcomeFlow } from '../../hooks/useStudyPlannerWelcomeFlow';
import { useStudyPlannerVoiceInteraction } from '../../hooks/useStudyPlannerVoiceInteraction';
import { useStudyPlannerMessageHandler } from '../../hooks/useStudyPlannerMessageHandler';
import { useStudyPlannerVoiceQuestionHandler } from '../../hooks/useStudyPlannerVoiceQuestionHandler';
import { useStudyPlannerCalendarActions } from './useStudyPlannerCalendarActions';
import { useStudyPlannerNavigationHandlers } from './useStudyPlannerNavigationHandlers';
import { useMessageProcessor } from './useMessageProcessor';
import { useResponseHandler } from './useResponseHandler';
import { createPlannerRedirectScheduler, type AnalyzeCalendarAndSuggest } from './planner-redirect.utils';
import type { StudyPlannerCalendarProvider } from '../../types/planner-ui.types';

export function useStudyPlannerLIALogic() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();

  const restartTour = () => {};
  const { styles, loading: loadingStyles } = useOrganizationStylesContext();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (styles?.panel && typeof document !== 'undefined') {
      const root = document.documentElement;
      const panelStyles = styles.panel;

      if (panelStyles.primary_button_color) root.style.setProperty('--color-primary', panelStyles.primary_button_color);
      if (panelStyles.secondary_button_color) root.style.setProperty('--color-secondary', panelStyles.secondary_button_color);
      if (panelStyles.accent_color) root.style.setProperty('--color-accent', panelStyles.accent_color);
      if (panelStyles.sidebar_background) root.style.setProperty('--color-bg-dark', panelStyles.sidebar_background);
      if (panelStyles.card_background) root.style.setProperty('--color-bg-card', panelStyles.card_background);
      if (panelStyles.text_color) root.style.setProperty('--color-text-primary', panelStyles.text_color);
    }
  }, [styles]);

  // ── Sub-hook: message / conversation state ──────────────────────────────
  const {
    isProcessing, setIsProcessing,
    conversationHistory, setConversationHistory,
    liaConversationId, setLiaConversationId,
    processingRef,
    lastVoiceQuestionRef,
    conversationHistoryRef,
    pendingLessonsRef,
  } = useMessageProcessor();

  // ── Sub-hook: UI response / modal state ─────────────────────────────────
  const {
    showConversation, setShowConversation,
    userMessage, setUserMessage,
    hoveredButton, setHoveredButton,
    showCourseSelector, setShowCourseSelector,
    availableCourses, setAvailableCourses,
    selectedCourseIds, setSelectedCourseIds,
    isLoadingCourses, setIsLoadingCourses,
    courseSearchQuery, setCourseSearchQuery,
    showCalendarModal, setShowCalendarModal,
    isConnectingCalendar, setIsConnectingCalendar,
    connectedCalendar, setConnectedCalendar,
    calendarSkipped, setCalendarSkipped,
    showCalendarConfig, setShowCalendarConfig,
    hasConfiguredCalendars, setHasConfiguredCalendars,
    studyApproach, setStudyApproach,
    targetDate, setTargetDate,
    hasAskedApproach, setHasAskedApproach,
    hasAskedTargetDate, setHasAskedTargetDate,
    showApproachModal, setShowApproachModal,
    showApproachButtons, setShowApproachButtons,
    showDateModal, setShowDateModal,
    selectedDate, setSelectedDate,
    currentMonth, setCurrentMonth,
    savedLessonDistribution, setSavedLessonDistribution,
    savedTargetDate, setSavedTargetDate,
    savedTotalLessons, setSavedTotalLessons,
    savedPlanId, setSavedPlanId,
    hasShownFinalSummary, setHasShownFinalSummary,
    savedCalendarData, setSavedCalendarData,
    currentUserId, setCurrentUserId,
    userContext, setUserContext,
    assignedCourses, setAssignedCourses,
    pendingLessonsWithNames, setPendingLessonsWithNames,
  } = useResponseHandler();

  const liaData = useSofLIAData();

  // ── Schedule Preview panel state ───────────────────────────────────────
  const [showSchedulePreview, setShowSchedulePreview] = useState(false);
  const [showSchedulePreviewTab, setShowSchedulePreviewTab] = useState(false);
  const prevDistributionLengthRef = useRef(savedLessonDistribution.length);

  // Auto-open panel when LIA generates a plan (distribution goes from 0 → N).
  useEffect(() => {
    const prevLen = prevDistributionLengthRef.current;
    const currLen = savedLessonDistribution.length;
    prevDistributionLengthRef.current = currLen;

    if (prevLen === 0 && currLen > 0) {
      setShowSchedulePreview(true);
      setShowSchedulePreviewTab(true);
    }
  }, [savedLessonDistribution.length]);

  const handleSchedulePreviewClose = useCallback(() => {
    setShowSchedulePreview(false);
  }, []);

  const handleSchedulePreviewOpen = useCallback(() => {
    setShowSchedulePreview(true);
  }, []);

  const handleVoiceQuestionRef = useRef<(question: string) => Promise<void>>(async () => {});
  const hasAttemptedOpenRef = useRef<boolean>(false);
  const isOpeningRef = useRef<boolean>(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Forward-reference ref so hooks called before useStudyPlannerCalendarActions
  // can still invoke analyzeCalendarAndSuggest at call time (not at render time).
  const analyzeCalendarAndSuggestRef = useRef<AnalyzeCalendarAndSuggest>(async () => {});

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  useStudyPlannerPendingLessonsSync({
    assignedCourses,
    lessons: liaData.lessons,
    lessonsAreLoading: liaData.isLoading,
    lessonsAreReady: liaData.isReady,
    lessonsError: liaData.error,
    loadPendingLessons: liaData.loadPendingLessons,
    pendingLessonsRef,
    setPendingLessonsWithNames,
  });

  useStudyPlannerInitializationFlow({
    currentUserId,
    getAnalyzeCalendarAndSuggest: () => analyzeCalendarAndSuggest,
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
    if (isVisible && currentStep === 0 && isAudioEnabled) {
      const timer = setTimeout(() => {
        speakText(STUDY_PLANNER_STEPS[0].speech);
        setHasUserInteracted(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const { isListening, isSpeaking, speakText, stopAllAudio, toggleListening } = useStudyPlannerVoiceInteraction({
    isAudioEnabled,
    isProcessing,
    onTranscript: async (question: string) => {
      await handleVoiceQuestionRef.current(question);
    },
  });

  const scheduleStudyPlannerRedirect = createPlannerRedirectScheduler(router);

  const {
    clearStudyPlannerSessionStorage,
    handleDiscardSession,
    handleResumeSession,
    savedSessionDate,
    showResumePrompt,
  } = useStudyPlannerSessionStorage({
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
  });

  const { saveStudyPlan: persistStudyPlan } = useStudyPlanPersistence({
    availableCourses,
    connectedCalendar,
    isAudioEnabled,
    savedLessonDistribution,
    savedPlanId,
    savedTargetDate,
    selectedCourseIds,
    setConnectedCalendar,
    setConversationHistory,
    setIsProcessing,
    setSavedPlanId,
    speakText,
    studyApproach,
    userType: userContext?.userType === 'b2b' ? 'b2b' : null,
  });

  const {
    handleApproachSelection,
    handleCalendarConfigSaveSuccess,
    handleCalendarConnect,
    handleCalendarModalCloseButtonClick,
    handleCalendarModalOverlayClose,
    handleDateMonthChange,
    handleDateSelection,
    handleTargetDateResponse,
  } = useStudyPlannerCalendarUiFlow({
    assignedCourses,
    calendarSkipped,
    connectedCalendar,
    conversationHistory,
    getAnalyzeCalendarAndSuggest: () => analyzeCalendarAndSuggest,
    isAudioEnabled,
    setConnectedCalendar,
    setConversationHistory,
    setCurrentMonth,
    setHasAskedTargetDate,
    setHasConfiguredCalendars,
    setIsConnectingCalendar,
    setIsProcessing,
    setSelectedDate,
    setShowApproachButtons,
    setShowApproachModal,
    setShowCalendarConfig,
    setShowCalendarModal,
    setShowDateModal,
    setStudyApproach,
    setTargetDate,
    speakText,
    studyApproach,
    targetDate,
    userContext,
  });

  const {
    confirmCourseSelection,
    handleComplete,
    handleSkip,
    loadUserCourses,
    toggleCourseSelection,
  } = useStudyPlannerCourseSelectionFlow({
    availableCourses,
    isAudioEnabled,
    selectedCourseIds,
    setAvailableCourses,
    setConversationHistory,
    setHasAskedApproach,
    setIsLoadingCourses,
    setIsProcessing,
    setIsVisible,
    setSelectedCourseIds,
    setShowApproachModal,
    setShowConversation,
    setShowCourseSelector,
    speakText,
    stopAllAudio,
  });

  useStudyPlannerWelcomeFlow({
    assignedCourses,
    conversationHistoryLength: conversationHistory.length,
    getLessonsForPrompt: liaData.getLessonsForPrompt,
    isAudioEnabled,
    lessonsAreReady: liaData.isReady,
    // After the welcome message renders, open the course selector automatically
    // so the user doesn't have to type the course name (RUX-02, RF-03).
    onWelcomeComplete: loadUserCourses,
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

  // ── Calendar actions sub-hook ──────────────────────────────────────────────
  const {
    analyzeCalendarAndSuggest,
    analyzeCalendarAndSuggestB2B,
    disconnectCalendar,
    skipCalendarConnection,
  } = useStudyPlannerCalendarActions({
    availableCourses,
    assignedCourses,
    isAudioEnabled,
    isProcessing,
    pendingLessonsRef,
    pendingLessonsWithNames,
    selectedCourseIds,
    setCalendarSkipped,
    setConnectedCalendar,
    setConversationHistory,
    setIsConnectingCalendar,
    setIsProcessing,
    setPendingLessonsWithNames,
    setSavedCalendarData,
    setSavedLessonDistribution,
    setSavedTargetDate,
    setSavedTotalLessons,
    setSelectedCourseIds,
    setShowCalendarModal,
    setTargetDate,
    setUserContext,
    speakText,
    studyApproach,
    targetDate,
    userContext,
    userId: user?.id,
  });

  // ── Navigation & audio handlers sub-hook ──────────────────────────────────
  const orgSlugParam = params?.orgSlug;
  const orgSlug = user?.organization?.slug
    || (typeof orgSlugParam === 'string'
      ? orgSlugParam
      : Array.isArray(orgSlugParam)
        ? orgSlugParam[0]
        : null);

  const {
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
  } = useStudyPlannerNavigationHandlers({
    clearStudyPlannerSessionStorage,
    currentStep,
    handleApproachSelection,
    handleComplete,
    handleTargetDateResponse,
    hasUserInteracted,
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
  });

  const { handleVoiceQuestion } = useStudyPlannerVoiceQuestionHandler({
    assignedCourses,
    connectedCalendar,
    conversationHistoryRef,
    getLessonsForPrompt: liaData.getLessonsForPrompt,
    hasAskedApproach,
    hasAskedTargetDate,
    isAudioEnabled,
    lastVoiceQuestionRef,
    lessons: liaData.lessons,
    lessonsAreReady: liaData.isReady,
    onCourseSelectorRequested: handleVoiceCourseSelectorRequest,
    onStudyApproachDetected: handleVoiceStudyApproachDetected,
    onTargetDateDetected: handleVoiceTargetDateDetected,
    pendingLessonsRef,
    processingRef,
    savedLessonDistribution,
    selectedCourseIds,
    setConversationHistory,
    setIsProcessing,
    showDateModal,
    speakText,
    stopAllAudio,
    studyApproach,
    targetDate,
    totalPendingLessons: liaData.totalPending || pendingLessonsRef.current.length,
    userContext,
  });

  useEffect(() => {
    handleVoiceQuestionRef.current = handleVoiceQuestion;
  }, [handleVoiceQuestion]);

  const { handleSendMessage } = useStudyPlannerMessageHandler({
    availableCourses,
    assignedCourses,
    connectedCalendar,
    conversationHistory,
    executeFinalPlanSave,
    hasAskedApproach,
    hasAskedTargetDate,
    hasShownFinalSummary,
    isAudioEnabled,
    isProcessing,
    liaConversationId,
    liaData: {
      getLessonsForPrompt: liaData.getLessonsForPrompt,
      isReady: liaData.isReady,
      lessons: liaData.lessons,
      totalPending: liaData.totalPending,
    },
    loadUserCourses,
    onStudyApproachResponse: handleStudyApproachResponse,
    onTargetDateResponse: handleTargetDateResponse,
    pendingLessonsRef,
    savedCalendarData,
    savedLessonDistribution,
    savedPlanId,
    savedTargetDate,
    savedTotalLessons,
    selectedCourseIds,
    setConversationHistory,
    setHasShownFinalSummary,
    setIsProcessing,
    setLiaConversationId,
    setSavedLessonDistribution,
    setSavedPlanId,
    setStudyApproach,
    setTargetDate,
    showDateModal,
    speakText,
    stopAllAudio,
    studyApproach,
    targetDate,
    userContext,
  });

  return {
    // State
    isVisible,
    currentStep,
    isAudioEnabled,
    hasUserInteracted,
    isMobile,
    showConversation,
    userMessage,
    showCourseSelector,
    hoveredButton,
    availableCourses,
    selectedCourseIds,
    isLoadingCourses,
    courseSearchQuery,
    showCalendarModal,
    isConnectingCalendar,
    connectedCalendar,
    calendarSkipped,
    showCalendarConfig,
    hasConfiguredCalendars,
    studyApproach,
    targetDate,
    hasAskedApproach,
    hasAskedTargetDate,
    showApproachModal,
    showApproachButtons,
    showDateModal,
    selectedDate,
    currentMonth,
    savedLessonDistribution,
    savedTargetDate,
    savedTotalLessons,
    savedPlanId,
    hasShownFinalSummary,
    savedCalendarData,
    currentUserId,
    userContext,
    assignedCourses,
    pendingLessonsWithNames,
    isProcessing,
    conversationHistory,
    liaConversationId,
    // Setters
    setIsVisible,
    setCurrentStep,
    setIsAudioEnabled,
    setHasUserInteracted,
    setIsMobile,
    setShowConversation,
    setUserMessage,
    setShowCourseSelector,
    setHoveredButton,
    setAvailableCourses,
    setSelectedCourseIds,
    setIsLoadingCourses,
    setCourseSearchQuery,
    setShowCalendarModal,
    setIsConnectingCalendar,
    setConnectedCalendar,
    setCalendarSkipped,
    setShowCalendarConfig,
    setHasConfiguredCalendars,
    setStudyApproach,
    setTargetDate,
    setHasAskedApproach,
    setHasAskedTargetDate,
    setShowApproachModal,
    setShowApproachButtons,
    setShowDateModal,
    setSelectedDate,
    setCurrentMonth,
    setSavedLessonDistribution,
    setSavedTargetDate,
    setSavedTotalLessons,
    setSavedPlanId,
    setHasShownFinalSummary,
    setSavedCalendarData,
    setCurrentUserId,
    setUserContext,
    setAssignedCourses,
    setPendingLessonsWithNames,
    setIsProcessing,
    setConversationHistory,
    setLiaConversationId,
    // Voice
    isListening,
    isSpeaking,
    speakText,
    stopAllAudio,
    toggleListening,
    // Handlers
    restartTour,
    handleNext,
    handlePrevious,
    handleComplete,
    handleSkip,
    handleStudyApproachResponse,
    handleVoiceCourseSelectorRequest,
    handleVoiceStudyApproachDetected,
    handleVoiceTargetDateDetected,
    handleVoiceQuestion,
    analyzeCalendarAndSuggest,
    analyzeCalendarAndSuggestB2B,
    disconnectCalendar,
    skipCalendarConnection,
    saveStudyPlan,
    executeFinalPlanSave,
    handleSendMessage,
    toggleAudio,
    handlePlannerBack,
    // Calendar UI flow handlers
    handleApproachSelection,
    handleCalendarConfigSaveSuccess,
    handleCalendarConnect,
    handleCalendarModalCloseButtonClick,
    handleCalendarModalOverlayClose,
    handleDateMonthChange,
    handleDateSelection,
    handleTargetDateResponse,
    // Course selection handlers
    confirmCourseSelection,
    loadUserCourses,
    toggleCourseSelection,
    // Session storage
    clearStudyPlannerSessionStorage,
    handleDiscardSession,
    handleResumeSession,
    savedSessionDate,
    showResumePrompt,
    // Redirect
    scheduleStudyPlannerRedirect,
    // Schedule Preview
    showSchedulePreview,
    showSchedulePreviewTab,
    onSchedulePreviewClose: handleSchedulePreviewClose,
    onSchedulePreviewOpen: handleSchedulePreviewOpen,
  };
}
